// apps/web/app/api/admin/media/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { BlobServiceClient } from '@azure/storage-blob';
import { authOptions } from '../../auth/[...nextauth]/route';

/**
 * GET /api/admin/media
 * 
 * Lists all uploaded media files from Azure Blob Storage
 * Query params:
 *   - type: filter by type (image, video, etc.)
 */

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'image', 'video', etc.

    // Connect to Azure Blob Storage (same as your upload route)
    const blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING!
    );
    
    // Get container client (same container name as your upload route)
    const containerClient = blobServiceClient.getContainerClient('safety-content');
    
    // Check if container exists
    if (!(await containerClient.exists())) {
      // Container doesn't exist yet, return empty array
      return NextResponse.json([]);
    }

    // List all blobs in the container
    const media = [];
    
    for await (const blob of containerClient.listBlobsFlat()) {
      const blobClient = containerClient.getBlobClient(blob.name);
      const properties = blob.properties;
      
      // Determine file type from content type or extension
      const contentType = properties.contentType || '';
      const fileType = contentType.split('/')[0]; // 'image', 'video', 'application', etc.
      
      // Filter by type if specified
      if (type && !contentType.startsWith(type)) {
        continue;
      }
      
      // Only include images and videos (skip other file types for now)
      if (fileType === 'image' || fileType === 'video') {
        media.push({
          id: blob.name,
          url: blobClient.url,
          filename: blob.name.split('-').slice(1).join('-') || blob.name, // Remove timestamp prefix
          type: contentType,
          size: properties.contentLength || 0,
          createdAt: properties.createdOn || new Date()
        });
      }
    }
    
    // Sort by creation date (newest first)
    media.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });

    return NextResponse.json(media);
    
  } catch (error) {
    console.error('Error fetching media from Azure Blob Storage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media' },
      { status: 500 }
    );
  }
}