// apps/web/components/admin/MediaUploader.tsx
'use client';

import { useState } from 'react';

type MediaUploaderProps = {
  onUploadComplete: (fileUrl: string, fileInfo: any) => void;
  accept?: string;
  maxSizeMB?: number;
  buttonText?: string | React.ReactNode;
  className?: string;
  showFolderSelect?: boolean;
  existingFolders?: string[];
};

export default function MediaUploader({
  onUploadComplete,
  accept = 'image/*,video/*',
  maxSizeMB = 10,
  buttonText = 'Upload Media',
  className,
  showFolderSelect = true,
  existingFolders = []
}: MediaUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState('root');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [customFolders, setCustomFolders] = useState<string[]>([]);
  const [parentFolder, setParentFolder] = useState<string>('root');

  // Build folder options with hierarchy
  const buildFolderOptions = () => {
    const allPaths = ['root', ...existingFolders.filter(f => f !== 'root' && f !== 'uncategorized'), ...customFolders];
    const uniquePaths = Array.from(new Set(allPaths)).sort();
    
    return uniquePaths.map(path => {
      const depth = path === 'root' ? 0 : path.split('/').length;
      const name = path === 'root' ? 'root' : path.split('/').pop() || path;
      const indent = '  '.repeat(depth);
      
      return {
        value: path,
        label: `${indent}${depth > 0 ? '└ ' : ''}${name}`,
        isNew: customFolders.includes(path)
      };
    });
  };

  const folderOptions = buildFolderOptions();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`File too large. Maximum size: ${maxSizeMB}MB`);
      return;
    }
    
    setError(null);
    setIsUploading(true);
    setProgress(10);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', selectedFolder);
    
    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const next = prev + Math.floor(Math.random() * 15);
          return next < 90 ? next : 90;
        });
      }, 300);
      
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
        folder: result.folder,
        blobName: result.blobName,
        contentType: result.contentType,
        size: result.size
      });
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
      setTimeout(() => setProgress(0), 1000);
      // Reset file input
      e.target.value = '';
    }
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      const sanitized = newFolderName
        .toLowerCase()
        .replace(/[^a-z0-9-/]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .replace(/\/+/g, '/')
        .replace(/^\/|\/$/g, '');
      
      // Build full path with parent
      const fullPath = parentFolder === 'root' ? sanitized : `${parentFolder}/${sanitized}`;
      
      if (sanitized && !folderOptions.find(f => f.value === fullPath)) {
        setCustomFolders(prev => [...prev, fullPath]);
        setSelectedFolder(fullPath);
        setIsCreatingFolder(false);
        setNewFolderName('');
        setParentFolder('root');
      } else if (folderOptions.find(f => f.value === fullPath)) {
        // Folder already exists, just select it
        setSelectedFolder(fullPath);
        setIsCreatingFolder(false);
        setNewFolderName('');
        setParentFolder('root');
      }
    }
  };

  return (
    <div className="space-y-3">
      {showFolderSelect && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Select Folder {customFolders.length > 0 && (
              <span className="text-xs text-blue-600 ml-2">
                ({customFolders.length} new folder{customFolders.length > 1 ? 's' : ''} created)
              </span>
            )}
          </label>
          {!isCreatingFolder ? (
            <div className="flex gap-2">
              <select
                value={selectedFolder}
                onChange={(e) => setSelectedFolder(e.target.value)}
                disabled={isUploading}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              >
                {folderOptions.map(folder => (
                  <option key={folder.value} value={folder.value}>
                    {folder.label}{folder.isNew ? ' (new)' : ''}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setIsCreatingFolder(true)}
                disabled={isUploading}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium whitespace-nowrap"
              >
                + New Folder
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <select
                  value={parentFolder}
                  onChange={(e) => setParentFolder(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                >
                  {folderOptions.map(folder => (
                    <option key={folder.value} value={folder.value}>
                      {folder.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
                  placeholder="New folder name..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <button
                  onClick={handleCreateFolder}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setIsCreatingFolder(false);
                    setNewFolderName('');
                    setParentFolder('root');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Creating in: <span className="font-mono font-semibold">{parentFolder === 'root' ? '/' : `/${parentFolder}/`}</span>
              </p>
            </div>
          )}
        </div>
      )}
      
      <div className="relative">
        <input
          type="file"
          accept={accept}
          onChange={handleFileChange}
          disabled={isUploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
        />
        <button
          type="button"
          disabled={isUploading}
          className={className || `w-full px-4 py-2 rounded-md ${
            isUploading
              ? 'bg-blue-100 text-blue-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isUploading ? 'Uploading...' : buttonText}
        </button>
      </div>
      
      {isUploading && (
        <div className="space-y-1">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-600 text-center">{progress}%</p>
        </div>
      )}
      
      {error && (
        <p className="text-red-600 text-sm">{error}</p>
      )}
    </div>
  );
}