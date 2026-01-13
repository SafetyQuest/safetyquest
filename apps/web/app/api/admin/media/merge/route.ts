// apps/web/app/api/admin/media/merge/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { BlobServiceClient } from '@azure/storage-blob';
import { checkPermission } from '@safetyquest/shared/rbac/api-helpers';
import { authOptions } from '@/auth';

const FOLDER_META_FILENAME = '_folder.meta';

/**
 * POST /api/admin/media/merge
 * Merge source folder into target folder
 * - Moves all files from source to target
 * - Renames duplicates automatically
 * - Deletes source folder after merge
 * 
 * Body: { sourceFolder: string, targetFolder: string }
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  const authCheck = checkPermission(session, 'media', 'delete');
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.reason || 'Unauthorized' }, { status: 401 });
  }

  try {
    const { sourceFolder, targetFolder } = await req.json();

    if (!sourceFolder || !targetFolder) {
      return NextResponse.json({ error: 'sourceFolder and targetFolder are required' }, { status: 400 });
    }

    if (sourceFolder === targetFolder) {
      return NextResponse.json({ error: 'Cannot merge folder into itself' }, { status: 400 });
    }

    // Validate: Can't merge parent into child or vice versa
    if (targetFolder.startsWith(sourceFolder + '/') || sourceFolder.startsWith(targetFolder + '/')) {
      return NextResponse.json(
        { error: 'Cannot merge folder into its parent or child folder' },
        { status: 400 }
      );
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING!
    );
    const containerClient = blobServiceClient.getContainerClient('safety-content');

    // Helper function to find unique filename in target
    async function getUniqueFilename(filename: string): Promise<string> {
      let newName = filename;
      let counter = 2;
      
      // Split filename and extension
      const lastDotIndex = filename.lastIndexOf('.');
      const name = lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
      const ext = lastDotIndex > 0 ? filename.substring(lastDotIndex) : '';

      while (true) {
        const testPath = `${targetFolder}/${newName}`;
        const testBlobClient = containerClient.getBlockBlobClient(testPath);
        
        if (!(await testBlobClient.exists())) {
          return newName;
        }
        
        newName = `${name}-${counter}${ext}`;
        counter++;
      }
    }

    // Get all blobs in source folder
    const blobsToMerge = [];
    for await (const blob of containerClient.listBlobsFlat()) {
      if (blob.name.startsWith(`${sourceFolder}/`)) {
        blobsToMerge.push(blob.name);
      }
    }

    if (blobsToMerge.length === 0) {
      return NextResponse.json({ error: 'Source folder not found or is empty' }, { status: 404 });
    }

    // Check if target folder exists
    const targetMetaBlob = `${targetFolder}/${FOLDER_META_FILENAME}`;
    const targetMetaBlobClient = containerClient.getBlockBlobClient(targetMetaBlob);
    
    if (!(await targetMetaBlobClient.exists())) {
      return NextResponse.json({ error: 'Target folder does not exist' }, { status: 404 });
    }

    // Merge all blobs
    let mergedCount = 0;
    let duplicatesRenamed = 0;

    for (const oldBlobName of blobsToMerge) {
      const relativePath = oldBlobName.substring(sourceFolder.length + 1);
      
      // Skip _folder.meta from source (don't merge it)
      if (relativePath === FOLDER_META_FILENAME) {
        continue;
      }

      // Get just the filename
      const pathParts = relativePath.split('/');
      const filename = pathParts[pathParts.length - 1];

      // Check for duplicates and get unique name
      const testPath = `${targetFolder}/${filename}`;
      const testBlobClient = containerClient.getBlockBlobClient(testPath);
      
      let finalFilename = filename;
      if (await testBlobClient.exists()) {
        finalFilename = await getUniqueFilename(filename);
        duplicatesRenamed++;
      }

      const newBlobName = `${targetFolder}/${finalFilename}`;

      // Copy to target
      const sourceBlobClient = containerClient.getBlockBlobClient(oldBlobName);
      const targetBlobClient = containerClient.getBlockBlobClient(newBlobName);
      
      const copyPoller = await targetBlobClient.beginCopyFromURL(sourceBlobClient.url);
      await copyPoller.pollUntilDone();
      
      // Delete from source
      await sourceBlobClient.delete();
      mergedCount++;
    }

    // Delete source folder's _folder.meta
    const sourceMetaBlob = `${sourceFolder}/${FOLDER_META_FILENAME}`;
    const sourceMetaBlobClient = containerClient.getBlockBlobClient(sourceMetaBlob);
    if (await sourceMetaBlobClient.exists()) {
      await sourceMetaBlobClient.delete();
    }

    // Update target folder metadata
    if (await targetMetaBlobClient.exists()) {
      const downloadResponse = await targetMetaBlobClient.download();
      const metadataContent = await streamToString(downloadResponse.readableStreamBody!);
      const metadata = JSON.parse(metadataContent);
      
      metadata.lastMerge = {
        sourceFolder,
        mergedAt: new Date().toISOString(),
        mergedBy: session!.user?.email || 'unknown',
        filesAdded: mergedCount
      };
      
      await targetMetaBlobClient.uploadData(Buffer.from(JSON.stringify(metadata, null, 2)), {
        blobHTTPHeaders: {
          blobContentType: 'application/json'
        }
      });
    }

    return NextResponse.json({
      success: true,
      mergedCount,
      duplicatesRenamed,
      details: {
        sourceFolder,
        targetFolder,
        totalFiles: mergedCount
      }
    });

  } catch (error) {
    console.error('Merge error:', error);
    return NextResponse.json(
      { error: 'Failed to merge folders' },
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