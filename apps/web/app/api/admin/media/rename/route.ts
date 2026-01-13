// apps/web/app/api/admin/media/rename/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { BlobServiceClient } from '@azure/storage-blob';
import { checkPermission } from '@safetyquest/shared/rbac/api-helpers';
import { authOptions } from '@/auth';

/**
 * PATCH /api/admin/media/rename
 * Rename a single file
 * 
 * Body: { blobName: string, newFilename: string }
 */
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  const authCheck = checkPermission(session, 'media', 'delete'); // Rename requires delete permission
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.reason || 'Unauthorized' }, { status: 401 });
  }

  try {
    const { blobName, newFilename } = await req.json();

    if (!blobName || !newFilename) {
      return NextResponse.json({ error: 'blobName and newFilename are required' }, { status: 400 });
    }

    // Validate filename (no path separators, special characters)
    const sanitizedFilename = newFilename
      .trim()
      .replace(/[\/\\]/g, '-') // Replace slashes
      .replace(/[^\w\s.-]/g, '') // Remove special chars except dots, dashes, underscores
      .replace(/\s+/g, '-'); // Replace spaces with dashes

    if (!sanitizedFilename) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING!
    );
    const containerClient = blobServiceClient.getContainerClient('safety-content');

    // Get folder path from old blob name
    const pathParts = blobName.split('/');
    const folderPath = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : '';

    // Build new blob name (preserve folder path)
    const newBlobName = folderPath 
      ? `${folderPath}/${sanitizedFilename}`
      : sanitizedFilename;

    // Check if new name already exists
    const targetBlobClient = containerClient.getBlockBlobClient(newBlobName);
    if (await targetBlobClient.exists()) {
      return NextResponse.json(
        { error: 'A file with that name already exists in this folder' },
        { status: 409 }
      );
    }

    // Check if source exists
    const sourceBlobClient = containerClient.getBlockBlobClient(blobName);
    if (!(await sourceBlobClient.exists())) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Copy to new name
    const copyPoller = await targetBlobClient.beginCopyFromURL(sourceBlobClient.url);
    await copyPoller.pollUntilDone();

    // Update metadata with new filename
    try {
      const properties = await sourceBlobClient.getProperties();
      const oldMetadata = properties.metadata || {};
      
      await targetBlobClient.setMetadata({
        ...oldMetadata,
        originalFilename: sanitizedFilename,
        renamedAt: new Date().toISOString(),
        renamedBy: session!.user?.email || 'unknown'
      });
    } catch (error) {
      console.error('Failed to update metadata after rename:', error);
    }

    // Delete old file
    await sourceBlobClient.delete();

    return NextResponse.json({
      success: true,
      oldPath: blobName,
      newPath: newBlobName,
      newFilename: sanitizedFilename
    });

  } catch (error) {
    console.error('Rename error:', error);
    return NextResponse.json(
      { error: 'Failed to rename file' },
      { status: 500 }
    );
  }
}