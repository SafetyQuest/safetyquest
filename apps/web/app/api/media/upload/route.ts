import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { BlobServiceClient } from '@azure/storage-blob';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'ADMIN') {
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

    // Connect to Azure Blob Storage
    const blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING!
    );
    
    // Get container client
    const containerClient = blobServiceClient.getContainerClient('safety-content');
    
    // Create container if it doesn't exist
    if (!(await containerClient.exists())) {
      await containerClient.create();
      await containerClient.setAccessPolicy('blob'); // Public read access
    }
    
    // Generate unique blob name to avoid conflicts
    const blobName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    // Upload file
    const arrayBuffer = await file.arrayBuffer();
    const contentType = file.type || `application/${fileExt}`;
    
    await blockBlobClient.uploadData(arrayBuffer, {
      blobHTTPHeaders: {
        blobContentType: contentType
      }
    });
    
    // Return the URL of the uploaded file
    return NextResponse.json({
      url: blockBlobClient.url,
      filename: file.name,
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