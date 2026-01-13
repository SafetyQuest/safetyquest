// apps/web/app/api/admin/media/move/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { BlobServiceClient } from '@azure/storage-blob';
import { checkPermission } from '@safetyquest/shared/rbac/api-helpers';
import { authOptions } from '@/auth';

const FOLDER_META_FILENAME = '_folder.meta';

/**
 * POST /api/admin/media/move
 * Move files or folders to a different location
 * 
 * Body types:
 * - { type: "file", blobName: string, targetFolder: string }
 * - { type: "files", blobNames: string[], targetFolder: string }
 * - { type: "folder", sourceFolder: string, targetFolder: string }
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  const authCheck = checkPermission(session, 'media', 'delete'); // Move requires delete permission
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.reason || 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { type, blobName, blobNames, sourceFolder, targetFolder } = body;

    const blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING!
    );
    const containerClient = blobServiceClient.getContainerClient('safety-content');

    // ==================== MOVE SINGLE FILE ====================
    if (type === 'file' && blobName) {
      const pathParts = blobName.split('/');
      const filename = pathParts[pathParts.length - 1];
      
      // Build new blob name
      const newBlobName = targetFolder 
        ? `${targetFolder}/${filename}`
        : filename;

      // Copy to new location
      const sourceBlobClient = containerClient.getBlockBlobClient(blobName);
      const targetBlobClient = containerClient.getBlockBlobClient(newBlobName);
      
      const copyPoller = await targetBlobClient.beginCopyFromURL(sourceBlobClient.url);
      await copyPoller.pollUntilDone();
      
      // Delete original
      await sourceBlobClient.delete();

      return NextResponse.json({
        success: true,
        movedCount: 1,
        details: {
          files: 1,
          folders: 0,
          oldPath: blobName,
          newPath: newBlobName
        }
      });
    }

    // ==================== MOVE MULTIPLE FILES ====================
    if (type === 'files' && blobNames && Array.isArray(blobNames)) {
      let movedCount = 0;

      for (const oldBlobName of blobNames) {
        const pathParts = oldBlobName.split('/');
        const filename = pathParts[pathParts.length - 1];
        
        const newBlobName = targetFolder 
          ? `${targetFolder}/${filename}`
          : filename;

        const sourceBlobClient = containerClient.getBlockBlobClient(oldBlobName);
        const targetBlobClient = containerClient.getBlockBlobClient(newBlobName);
        
        const copyPoller = await targetBlobClient.beginCopyFromURL(sourceBlobClient.url);
        await copyPoller.pollUntilDone();
        
        await sourceBlobClient.delete();
        movedCount++;
      }

      return NextResponse.json({
        success: true,
        movedCount,
        details: {
          files: movedCount,
          folders: 0,
          targetFolder
        }
      });
    }

    // ==================== MOVE FOLDER ====================
    if (type === 'folder' && sourceFolder !== undefined) {
      // Validate: Can't move folder into itself or its subfolders
      if (targetFolder && targetFolder.startsWith(sourceFolder + '/')) {
        return NextResponse.json(
          { error: 'Cannot move folder into itself or its subfolders', code: 'CIRCULAR_MOVE' },
          { status: 400 }
        );
      }

      // Validate: Can't move to same location
      if (sourceFolder === targetFolder) {
        return NextResponse.json(
          { error: 'Source and target are the same', code: 'SAME_LOCATION' },
          { status: 400 }
        );
      }

      // Get folder name (last part of path)
      const folderParts = sourceFolder.split('/');
      const folderName = folderParts[folderParts.length - 1];

      // Build new folder path
      const newFolderPath = targetFolder 
        ? `${targetFolder}/${folderName}`
        : folderName;

      // Check if target folder already exists
      const targetMetaBlob = `${newFolderPath}/${FOLDER_META_FILENAME}`;
      const targetMetaBlobClient = containerClient.getBlockBlobClient(targetMetaBlob);
      
      if (await targetMetaBlobClient.exists()) {
        return NextResponse.json(
          { error: 'A folder with that name already exists at the target location', code: 'DUPLICATE_FOLDER' },
          { status: 409 }
        );
      }

      // Get all blobs in source folder
      const blobsToMove = [];
      for await (const blob of containerClient.listBlobsFlat()) {
        if (blob.name.startsWith(`${sourceFolder}/`)) {
          blobsToMove.push(blob.name);
        }
      }

      if (blobsToMove.length === 0) {
        return NextResponse.json({ error: 'Folder not found or is empty' }, { status: 404 });
      }

      // Move all blobs
      let filesCount = 0;
      let foldersCount = 0;

      for (const oldBlobName of blobsToMove) {
        const relativePath = oldBlobName.substring(sourceFolder.length + 1);
        const newBlobName = `${newFolderPath}/${relativePath}`;

        const sourceBlobClient = containerClient.getBlockBlobClient(oldBlobName);
        const targetBlobClient = containerClient.getBlockBlobClient(newBlobName);
        
        const copyPoller = await targetBlobClient.beginCopyFromURL(sourceBlobClient.url);
        await copyPoller.pollUntilDone();
        
        await sourceBlobClient.delete();

        if (oldBlobName.endsWith(FOLDER_META_FILENAME)) {
          foldersCount++;
        } else {
          filesCount++;
        }
      }

      return NextResponse.json({
        success: true,
        movedCount: blobsToMove.length,
        details: {
          files: filesCount,
          folders: foldersCount,
          sourceFolder,
          targetFolder: targetFolder || 'root',
          newPath: newFolderPath
        }
      });
    }

    return NextResponse.json({ error: 'Invalid request. Type must be "file", "files", or "folder"' }, { status: 400 });

  } catch (error) {
    console.error('Move error:', error);
    return NextResponse.json(
      { error: 'Failed to move' },
      { status: 500 }
    );
  }
}