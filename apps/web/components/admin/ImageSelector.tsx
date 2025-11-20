// apps/web/components/admin/ImageSelector.tsx
'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import MediaUploader from './MediaUploader';

type ImageSelectorProps = {
  onSelect: (url: string, fileInfo: any) => void;
  onClose: () => void;
  accept?: string;
};

export default function ImageSelector({ onSelect, onClose, accept = 'image/*' }: ImageSelectorProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'library'>('library');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Fetch uploaded media from your API
  // Note: You'll need to create this API endpoint to list uploaded media
  const { data: media, isLoading } = useQuery({
    queryKey: ['media', 'images'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/admin/media?type=image');
        if (!res.ok) throw new Error('Failed to fetch media');
        return res.json();
      } catch (error) {
        console.error('Error fetching media:', error);
        return [];
      }
    },
    enabled: activeTab === 'library'
  });

  const handleUploadComplete = (url: string, fileInfo: any) => {
    onSelect(url, fileInfo);
    onClose();
  };

  const handleSelectFromLibrary = () => {
    if (!selectedImage) return;
    
    const selectedMedia = media?.find((m: any) => m.url === selectedImage);
    onSelect(selectedImage, selectedMedia || { filename: 'Selected image' });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Select Image</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('library')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'library'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Media Library
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'upload'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Upload New
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'library' ? (
            // Media Library Tab
            <div>
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Loading images...</p>
                </div>
              ) : !media || media.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="mt-2 text-gray-600">No images in library</p>
                  <p className="text-sm text-gray-500 mt-1">Upload your first image using the "Upload New" tab</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {media.map((item: any) => (
                    <div
                      key={item.id || item.url}
                      onClick={() => setSelectedImage(item.url)}
                      className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === item.url
                          ? 'border-blue-600 shadow-lg scale-105'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="aspect-square bg-gray-100">
                        <img
                          src={item.url}
                          alt={item.filename || 'Image'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {selectedImage === item.url && (
                        <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      <div className="p-2 bg-white">
                        <p className="text-xs text-gray-600 truncate" title={item.filename}>
                          {item.filename || 'Unnamed'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Upload New Tab
            <div className="max-w-md mx-auto py-12">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Upload New Image</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Select an image from your computer
                </p>
                <MediaUploader
                  onUploadComplete={handleUploadComplete}
                  accept={accept}
                  buttonText="Choose File"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {activeTab === 'library' && (
          <div className="p-4 border-t flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSelectFromLibrary}
              disabled={!selectedImage}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Select Image
            </button>
          </div>
        )}
      </div>
    </div>
  );
}