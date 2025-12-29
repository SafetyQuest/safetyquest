// apps/web/app/api/media/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { BlobServiceClient } from '@azure/storage-blob';
import { checkPermission } from '@safetyquest/shared/rbac/api-helpers';
import { authOptions } from '@/auth';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  const authCheck = checkPermission(session, 'RESOURCE', 'ACTION');
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.reason || 'Unauthorized' }, { status: 401 });
  }

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Get file extension
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    
    // Validate file type
    const allowedTypes = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'mp4', 'webm', 'pdf'];
    if (!fileExt || !allowedTypes.includes(fileExt)) {
      return NextResponse.json(
        { error: 'File type not supported. Allowed: ' + allowedTypes.join(', ') },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size: 10MB' },
        { status: 400 }
      );
    }

    let folder = (formData.get('folder') as string) || '';
    // Treat 'root', 'undefined', and '' the same → true root (no prefix)
    if (folder === 'root' || folder === 'undefined' || !folder.trim()) {
      folder = '';
    } else {
      // Only sanitize if it's a real folder path
      folder = folder
        .toLowerCase()
        .replace(/[^a-z0-9-/]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .replace(/\/+/g, '/')
        .replace(/^\/|\/$/g, '');
    }

    // Connect to Azure Blob Storage
    const blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING!
    );
    
    // Get container client
    const containerClient = blobServiceClient.getContainerClient('safety-content');
    
    // Create container if it doesn't exist
    if (!(await containerClient.exists())) {
      await containerClient.create();
      await containerClient.setAccessPolicy('blob');
    }
    
    // Generate blob name with folder structure: folder/timestamp-filename
    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/\s+/g, '-');
    const blobName = folder 
      ? `${folder}/${timestamp}-${sanitizedFilename}`
      : `${timestamp}-${sanitizedFilename}`;
    
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    // Upload file with metadata
    const arrayBuffer = await file.arrayBuffer();
    const contentType = file.type || `application/${fileExt}`;
    
    // Sanitize metadata values (Azure metadata can't contain special characters)
    const sanitizeMetadata = (value: string) => {
      return value
        .replace(/[^\x20-\x7E]/g, '') // Remove non-ASCII characters
        .replace(/[\\"]/g, '') // Remove quotes and backslashes
        .substring(0, 256); // Limit length to 256 characters
    };
    
    await blockBlobClient.uploadData(arrayBuffer, {
      blobHTTPHeaders: {
        blobContentType: contentType
      },
      metadata: {
        originalFilename: sanitizeMetadata(file.name),
        folder: folder,
        uploadedBy: sanitizeMetadata(session.user.email || 'unknown'),
        uploadedAt: new Date().toISOString()
      }
    });
    
    return NextResponse.json({
      url: blockBlobClient.url,
      filename: file.name,
      folder: folder,
      blobName: blobName,
      contentType: file.type,
      size: file.size
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}