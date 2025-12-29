// apps/web/app/api/admin/media/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { BlobServiceClient } from '@azure/storage-blob';
import { checkPermission } from '@safetyquest/shared/rbac/api-helpers';
import { authOptions } from '@/auth';

/**
 * GET /api/admin/media
 * Lists all uploaded media files from Azure Blob Storage
 * Query params:
 *   - type: filter by type (image, video, etc.)
 *   - folder: filter by folder name
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  const authCheck = checkPermission(session, 'RESOURCE', 'ACTION');
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.reason || 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const folder = searchParams.get('folder');

    const blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING!
    );
    
    const containerClient = blobServiceClient.getContainerClient('safety-content');
    
    if (!(await containerClient.exists())) {
      return NextResponse.json([]);
    }

    const media = [];
    const folders = new Set<string>();
    
    for await (const blob of containerClient.listBlobsFlat({ includeMetadata: true })) {
      const blobClient = containerClient.getBlobClient(blob.name);
      const properties = blob.properties;
      
      // Extract folder from blob path
      const pathParts = blob.name.split('/');
      const blobFolder = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : '';
      
      const filename = pathParts[pathParts.length - 1];
      
      // Don't add 'uncategorized' to folders list
      if (blobFolder !== 'uncategorized') {
        const parts = blobFolder.split('/');
        let current = "";
        for (const p of parts) {
          current = current ? `${current}/${p}` : p;
          folders.add(current);
        }
      }
      
      const contentType = properties.contentType || '';
      const fileType = contentType.split('/')[0];
      
      // Apply filters
      if (type && !contentType.startsWith(type)) continue;
      if (folder && blobFolder !== folder) continue;
      
      if (fileType === 'image' || fileType === 'video') {
        media.push({
          id: blob.name,
          url: blobClient.url,
          filename: filename.split('-').slice(1).join('-') || filename,
          originalFilename: blob.metadata?.originalFilename || filename,
          folder: blobFolder,
          type: contentType,
          size: properties.contentLength || 0,
          createdAt: properties.createdOn || new Date(),
          uploadedBy: blob.metadata?.uploadedBy || 'unknown'
        });
      }
    }
    
    media.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });

    return NextResponse.json({
      media,
      folders: Array.from(folders).sort()
    });
    
  } catch (error) {
    console.error('Error fetching media from Azure Blob Storage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  const authCheck = checkPermission(session, 'RESOURCE', 'ACTION');
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.reason || 'Unauthorized' }, { status: 401 });
  }

  try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING!
    );
    const { blobName, folder } = await req.json();
    const containerClient = blobServiceClient.getContainerClient('safety-content');
    
    // If deleting a folder
    if (folder) {
      if (folder === 'root') {
        return NextResponse.json({ error: 'Cannot delete root folder' }, { status: 400 });
      }
      
      // Delete all blobs in the folder
      let deletedCount = 0;
      for await (const blob of containerClient.listBlobsFlat()) {
        if (blob.name.startsWith(`${folder}/`)) {
          await containerClient.getBlockBlobClient(blob.name).delete();
          deletedCount++;
        }
      }
      
      return NextResponse.json({ success: true, deletedCount });
    }
    
    // If deleting a single file
    if (blobName) {
      await containerClient.getBlockBlobClient(blobName).delete();
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ error: 'No blobName or folder provided' }, { status: 400 });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}