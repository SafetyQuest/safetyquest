// apps/web/app/api/admin/media/copy/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { BlobServiceClient } from '@azure/storage-blob';
import { checkPermission } from '@safetyquest/shared/rbac/api-helpers';
import { authOptions } from '@/auth';

const FOLDER_META_FILENAME = '_folder.meta';

/**
 * POST /api/admin/media/copy
 * Copy files or folders (creates duplicates)
 * 
 * Body types:
 * - { type: "file", blobName: string, targetFolder: string }
 * - { type: "files", blobNames: string[], targetFolder: string }
 * - { type: "folder", sourceFolder: string, targetFolder: string, newFolderName?: string }
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  const authCheck = checkPermission(session, 'media', 'create');
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.reason || 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { type, blobName, blobNames, sourceFolder, targetFolder, newFolderName } = body;

    const blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING!
    );
    const containerClient = blobServiceClient.getContainerClient('safety-content');

    // Helper function to find unique filename
    async function getUniqueFilename(basePath: string, filename: string): Promise<string> {
      let newName = filename;
      let counter = 2;
      
      // Split filename and extension
      const lastDotIndex = filename.lastIndexOf('.');
      const name = lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
      const ext = lastDotIndex > 0 ? filename.substring(lastDotIndex) : '';

      while (true) {
        const testPath = basePath ? `${basePath}/${newName}` : newName;
        const testBlobClient = containerClient.getBlockBlobClient(testPath);
        
        if (!(await testBlobClient.exists())) {
          return newName;
        }
        
        newName = `${name}-${counter}${ext}`;
        counter++;
      }
    }

    // ==================== COPY SINGLE FILE ====================
    if (type === 'file' && blobName) {
      const pathParts = blobName.split('/');
      const filename = pathParts[pathParts.length - 1];
      
      // Get unique filename in target folder
      const uniqueFilename = await getUniqueFilename(targetFolder, filename);
      const newBlobName = targetFolder 
        ? `${targetFolder}/${uniqueFilename}`
        : uniqueFilename;

      // Copy file
      const sourceBlobClient = containerClient.getBlockBlobClient(blobName);
      const targetBlobClient = containerClient.getBlockBlobClient(newBlobName);
      
      const copyPoller = await targetBlobClient.beginCopyFromURL(sourceBlobClient.url);
      await copyPoller.pollUntilDone();

      return NextResponse.json({
        success: true,
        copiedCount: 1,
        newFiles: [{
          originalPath: blobName,
          newPath: newBlobName,
          newFilename: uniqueFilename
        }]
      });
    }

    // ==================== COPY MULTIPLE FILES ====================
    if (type === 'files' && blobNames && Array.isArray(blobNames)) {
      const newFiles = [];

      for (const oldBlobName of blobNames) {
        const pathParts = oldBlobName.split('/');
        const filename = pathParts[pathParts.length - 1];
        
        const uniqueFilename = await getUniqueFilename(targetFolder, filename);
        const newBlobName = targetFolder 
          ? `${targetFolder}/${uniqueFilename}`
          : uniqueFilename;

        const sourceBlobClient = containerClient.getBlockBlobClient(oldBlobName);
        const targetBlobClient = containerClient.getBlockBlobClient(newBlobName);
        
        const copyPoller = await targetBlobClient.beginCopyFromURL(sourceBlobClient.url);
        await copyPoller.pollUntilDone();

        newFiles.push({
          originalPath: oldBlobName,
          newPath: newBlobName,
          newFilename: uniqueFilename
        });
      }

      return NextResponse.json({
        success: true,
        copiedCount: newFiles.length,
        newFiles
      });
    }

    // ==================== COPY FOLDER ====================
    if (type === 'folder' && sourceFolder !== undefined) {
      // Get folder name
      const folderParts = sourceFolder.split('/');
      const originalFolderName = folderParts[folderParts.length - 1];
      
      // Determine new folder name
      let baseFolderName = newFolderName || originalFolderName;
      
      // Find unique folder name at target location
      let uniqueFolderName = baseFolderName;
      let counter = 2;
      
      while (true) {
        const testPath = targetFolder 
          ? `${targetFolder}/${uniqueFolderName}`
          : uniqueFolderName;
        
        const testMetaBlob = `${testPath}/${FOLDER_META_FILENAME}`;
        const testMetaBlobClient = containerClient.getBlockBlobClient(testMetaBlob);
        
        if (!(await testMetaBlobClient.exists())) {
          break;
        }
        
        uniqueFolderName = `${baseFolderName}-copy-${counter}`;
        counter++;
      }

      // Build new folder path
      const newFolderPath = targetFolder 
        ? `${targetFolder}/${uniqueFolderName}`
        : uniqueFolderName;

      // Get all blobs in source folder
      const blobsToCopy = [];
      for await (const blob of containerClient.listBlobsFlat()) {
        if (blob.name.startsWith(`${sourceFolder}/`)) {
          blobsToCopy.push(blob.name);
        }
      }

      if (blobsToCopy.length === 0) {
        return NextResponse.json({ error: 'Folder not found or is empty' }, { status: 404 });
      }

      // Copy all blobs
      let filesCount = 0;
      let foldersCount = 0;

      for (const oldBlobName of blobsToCopy) {
        const relativePath = oldBlobName.substring(sourceFolder.length + 1);
        const newBlobName = `${newFolderPath}/${relativePath}`;

        const sourceBlobClient = containerClient.getBlockBlobClient(oldBlobName);
        const targetBlobClient = containerClient.getBlockBlobClient(newBlobName);
        
        const copyPoller = await targetBlobClient.beginCopyFromURL(sourceBlobClient.url);
        await copyPoller.pollUntilDone();

        if (oldBlobName.endsWith(FOLDER_META_FILENAME)) {
          foldersCount++;
          
          // Update metadata in copied _folder.meta
          const downloadResponse = await targetBlobClient.download();
          const metadataContent = await streamToString(downloadResponse.readableStreamBody!);
          const metadata = JSON.parse(metadataContent);
          
          metadata.name = uniqueFolderName;
          metadata.path = newFolderPath;
          metadata.copiedFrom = sourceFolder;
          metadata.copiedAt = new Date().toISOString();
          metadata.copiedBy = session!.user?.email || 'unknown';
          
          await targetBlobClient.uploadData(Buffer.from(JSON.stringify(metadata, null, 2)), {
            blobHTTPHeaders: {
              blobContentType: 'application/json'
            }
          });
        } else {
          filesCount++;
        }
      }

      return NextResponse.json({
        success: true,
        copiedCount: blobsToCopy.length,
        details: {
          files: filesCount,
          folders: foldersCount,
          sourceFolder,
          targetFolder: targetFolder || 'root',
          newPath: newFolderPath,
          newFolderName: uniqueFolderName
        }
      });
    }

    return NextResponse.json({ error: 'Invalid request. Type must be "file", "files", or "folder"' }, { status: 400 });

  } catch (error) {
    console.error('Copy error:', error);
    return NextResponse.json(
      { error: 'Failed to copy' },
      { status: 500 }
    );
  }
}

// Helper function to convert stream to string
async function streamToString(readableStream: NodeJS.ReadableStream): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    readableStream.on('data', (data) => {
      chunks.push(data instanceof Buffer ? data : Buffer.from(data));
    });
    readableStream.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8'));
    });
    readableStream.on('error', reject);
  });
}