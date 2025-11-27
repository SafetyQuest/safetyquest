// apps/web/components/admin/VideoSelector.tsx
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import MediaUploader from './MediaUploader';

type VideoSelectorProps = {
  onSelect: (url: string, fileInfo: any) => void;
  onClose: () => void;
  accept?: string;
};

export default function VideoSelector({ onSelect, onClose, accept = 'video/*' }: VideoSelectorProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'library'>('library');
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['media', 'videos'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/admin/media?type=video');
        if (!res.ok) throw new Error('Failed to fetch media');
        return res.json();
      } catch (error) {
        console.error('Error fetching media:', error);
        return { media: [], folders: [] };
      }
    },
    enabled: activeTab === 'library'
  });

  const media = data?.media || [];
  const folders = (data?.folders || []).filter((f: string) => f !== 'uncategorized');

  const filteredMedia = selectedFolder === 'all' 
    ? media 
    : media.filter((m: any) => m.folder === selectedFolder);

  const handleUploadComplete = (url: string, fileInfo: any) => {
    onSelect(url, fileInfo);
    onClose();
  };

  const handleSelectFromLibrary = () => {
    if (!selectedVideo) return;

    const selectedMedia = media?.find((m: any) => m.url === selectedVideo);
    onSelect(selectedVideo, selectedMedia || { filename: 'Selected video' });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[80vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Select Video</h2>
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
            <>
              {/* Folder Filter */}
              {folders.length > 0 && (
                <div className="mb-4 flex gap-2 flex-wrap">
                  <button
                    onClick={() => setSelectedFolder('all')}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                      selectedFolder === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All
                  </button>
                  {folders.map((folder: string) => (
                    <button
                      key={folder}
                      onClick={() => setSelectedFolder(folder)}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                        selectedFolder === folder
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {folder}
                    </button>
                  ))}
                </div>
              )}

              {isLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Loading videos...</p>
                </div>
              ) : !filteredMedia || filteredMedia.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553 2.276a1 1 0 010 1.79L15 16m0-6v6m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="mt-2 text-gray-600">
                    {selectedFolder === 'all' ? 'No videos in library' : `No videos in "${selectedFolder}" folder`}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Upload your first video using the "Upload New" tab</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredMedia.map((item: any) => (
                    <div
                      key={item.id || item.url}
                      onClick={() => setSelectedVideo(item.url)}
                      className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                        selectedVideo === item.url
                          ? 'border-blue-600 shadow-lg scale-105'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="aspect-video bg-black">
                        <video
                          src={item.url}
                          poster={item.thumbnail || ''}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {selectedVideo === item.url && (
                        <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}

                      {/* Folder Badge */}
                      <div className="absolute top-2 left-2">
                        <span className="bg-blue-600/90 text-white text-xs px-2 py-0.5 rounded-full">
                          {item.folder}
                        </span>
                      </div>

                      <div className="p-2 bg-white">
                        <p className="text-xs text-gray-600 truncate" title={item.filename}>
                          {item.filename || 'Unnamed'}
                        </p>

                        {item.duration && (
                          <p className="text-[10px] text-gray-500">{item.duration}s</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="max-w-md mx-auto py-12">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553 2.276a1 1 0 010 1.79L15 16m0-6v6m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Upload New Video</h3>
                <p className="text-sm text-gray-500 mb-4">Select a video file from your computer</p>
                
                <MediaUploader
                  onUploadComplete={handleUploadComplete}
                  accept={accept}
                  buttonText="Choose File"
                  showFolderSelect={true}
                  existingFolders={folders}
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
              disabled={!selectedVideo}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Select Video
            </button>
          </div>
        )}
      </div>
    </div>
  );
}