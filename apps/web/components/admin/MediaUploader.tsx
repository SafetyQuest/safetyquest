// apps/web/components/admin/MediaUploader.tsx
'use client';

import { useState } from 'react';

type MediaUploaderProps = {
  onUploadComplete: (fileUrl: string, fileInfo: any) => void;
  accept?: string;
  maxSizeMB?: number;
  buttonText?: string;
};

export default function MediaUploader({
  onUploadComplete,
  accept = 'image/*,video/*',
  maxSizeMB = 10,
  buttonText = 'Upload Media'
}: MediaUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file size
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`File too large. Maximum size: ${maxSizeMB}MB`);
      return;
    }
    
    setError(null);
    setIsUploading(true);
    setProgress(10);
    
    // Create FormData
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      // Upload progress simulation
      // In a production app, use a real progress API if available
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const next = prev + Math.floor(Math.random() * 15);
          return next < 90 ? next : 90;
        });
      }, 300);
      
      // Upload file
      const res = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData
      });
      
      clearInterval(progressInterval);
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Upload failed');
      }
      
      setProgress(100);
      
      const result = await res.json();
      onUploadComplete(result.url, {
        filename: result.filename,
        contentType: result.contentType,
        size: result.size
      });
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
      // Reset progress after a short delay
      setTimeout(() => setProgress(0), 1000);
    }
  };

  return (
    <div>
      <div className="relative">
        <input
          type="file"
          accept={accept}
          onChange={handleFileChange}
          disabled={isUploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <button
          type="button"
          disabled={isUploading}
          className={`w-full px-4 py-2 rounded-md ${
            isUploading
              ? 'bg-blue-100 text-blue-400'
              : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
          }`}
        >
          {isUploading ? 'Uploading...' : buttonText}
        </button>
      </div>
      
      {isUploading && (
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-600 mt-1 text-center">{progress}%</p>
        </div>
      )}
      
      {error && (
        <p className="text-red-600 text-sm mt-1">{error}</p>
      )}
    </div>
  );
}