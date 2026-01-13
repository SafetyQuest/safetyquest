// apps/web/app/api/admin/media/folders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { BlobServiceClient } from '@azure/storage-blob';
import { checkPermission } from '@safetyquest/shared/rbac/api-helpers';
import { authOptions } from '@/auth';

const FOLDER_META_FILENAME = '_folder.meta';

/**
 * POST /api/admin/media/folders
 * Create a new folder by uploading a _folder.meta file
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  const authCheck = checkPermission(session, 'media', 'create');
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.reason || 'Unauthorized' }, { status: 401 });
  }

  try {
    const { path, name, description } = await req.json();
    
    if (!path || !name) {
      return NextResponse.json({ error: 'Path and name are required' }, { status: 400 });
    }

    // Sanitize path
    const sanitizedPath = path
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-/]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .replace(/\/+/g, '/')
      .replace(/^\/|\/$/g, '');

    if (!sanitizedPath) {
      return NextResponse.json({ error: 'Invalid folder path' }, { status: 400 });
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING!
    );
    
    const containerClient = blobServiceClient.getContainerClient('safety-content');
    
    // Check if container exists
    if (!(await containerClient.exists())) {
      await containerClient.create();
      await containerClient.setAccessPolicy('blob');
    }

    // Check if folder already exists (by checking for _folder.meta file)
    const metaBlobName = `${sanitizedPath}/${FOLDER_META_FILENAME}`;
    const metaBlobClient = containerClient.getBlockBlobClient(metaBlobName);
    
    if (await metaBlobClient.exists()) {
      return NextResponse.json({ error: 'Folder already exists' }, { status: 409 });
    }

    // Create folder metadata
    const metadata = {
      name,
      path: sanitizedPath,
      description: description || '',
      createdAt: new Date().toISOString(),
      createdBy: session!.user?.email || 'unknown'
    };

    // Upload _folder.meta file
    const metadataContent = JSON.stringify(metadata, null, 2);
    await metaBlobClient.uploadData(Buffer.from(metadataContent), {
      blobHTTPHeaders: {
        blobContentType: 'application/json'
      }
    });

    return NextResponse.json({
      success: true,
      folder: {
        path: sanitizedPath,
        name,
        metadata
      }
    });
  } catch (error) {
    console.error('Create folder error:', error);
    return NextResponse.json(
      { error: 'Failed to create folder' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/media/folders
 * Rename a folder (updates all files in folder + _folder.meta)
 */
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  const authCheck = checkPermission(session, 'media', 'delete'); // Rename requires delete permission
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.reason || 'Unauthorized' }, { status: 401 });
  }

  try {
    const { oldPath, newPath, newName } = await req.json();
    
    if (!oldPath || !newPath || !newName) {
      return NextResponse.json({ error: 'oldPath, newPath, and newName are required' }, { status: 400 });
    }

    // Sanitize new path
    const sanitizedNewPath = newPath
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-/]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .replace(/\/+/g, '/')
      .replace(/^\/|\/$/g, '');

    if (!sanitizedNewPath) {
      return NextResponse.json({ error: 'Invalid new folder path' }, { status: 400 });
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING!
    );
    
    const containerClient = blobServiceClient.getContainerClient('safety-content');

    // Check if new path already exists
    const newMetaBlobName = `${sanitizedNewPath}/${FOLDER_META_FILENAME}`;
    const newMetaBlobClient = containerClient.getBlockBlobClient(newMetaBlobName);
    
    if (await newMetaBlobClient.exists()) {
      return NextResponse.json({ error: 'A folder with that name already exists' }, { status: 409 });
    }

    // Get all blobs in the old folder
    const blobsToRename = [];
    for await (const blob of containerClient.listBlobsFlat()) {
      if (blob.name === `${oldPath}/${FOLDER_META_FILENAME}` || blob.name.startsWith(`${oldPath}/`)) {
        blobsToRename.push(blob.name);
      }
    }

    if (blobsToRename.length === 0) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    // Rename all blobs (copy to new location, then delete old)
    for (const oldBlobName of blobsToRename) {
      const newBlobName = oldBlobName.replace(oldPath, sanitizedNewPath);
      
      const sourceBlobClient = containerClient.getBlockBlobClient(oldBlobName);
      const targetBlobClient = containerClient.getBlockBlobClient(newBlobName);
      
      // Copy blob
      const copyPoller = await targetBlobClient.beginCopyFromURL(sourceBlobClient.url);
      await copyPoller.pollUntilDone();
      
      // Delete old blob
      await sourceBlobClient.delete();
    }

    // Update _folder.meta content with new name and path
    const metaBlobClient = containerClient.getBlockBlobClient(`${sanitizedNewPath}/${FOLDER_META_FILENAME}`);
    
    if (await metaBlobClient.exists()) {
      const downloadResponse = await metaBlobClient.download();
      const metadataContent = await streamToString(downloadResponse.readableStreamBody!);
      const metadata = JSON.parse(metadataContent);
      
      metadata.name = newName;
      metadata.path = sanitizedNewPath;
      metadata.updatedAt = new Date().toISOString();
      metadata.updatedBy = session!.user?.email || 'unknown';
      
      await metaBlobClient.uploadData(Buffer.from(JSON.stringify(metadata, null, 2)), {
        blobHTTPHeaders: {
          blobContentType: 'application/json'
        }
      });
    }

    return NextResponse.json({
      success: true,
      renamedCount: blobsToRename.length,
      oldPath,
      newPath: sanitizedNewPath
    });
  } catch (error) {
    console.error('Rename folder error:', error);
    return NextResponse.json(
      { error: 'Failed to rename folder' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/media/folders
 * Delete a folder and all its contents
 */
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  const authCheck = checkPermission(session, 'media', 'delete');
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.reason || 'Unauthorized' }, { status: 401 });
  }

  try {
    const { path } = await req.json();
    
    if (!path) {
      return NextResponse.json({ error: 'Path is required' }, { status: 400 });
    }

    if (path === 'root' || path === '') {
      return NextResponse.json({ error: 'Cannot delete root folder' }, { status: 400 });
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING!
    );
    
    const containerClient = blobServiceClient.getContainerClient('safety-content');

    // Delete all blobs in the folder
    let deletedCount = 0;
    for await (const blob of containerClient.listBlobsFlat()) {
      if (blob.name === `${path}/${FOLDER_META_FILENAME}` || blob.name.startsWith(`${path}/`)) {
        await containerClient.getBlockBlobClient(blob.name).delete();
        deletedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      deletedCount,
      path
    });
  } catch (error) {
    console.error('Delete folder error:', error);
    return NextResponse.json(
      { error: 'Failed to delete folder' },
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