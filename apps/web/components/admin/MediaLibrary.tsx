// apps/web/components/admin/MediaLibrary.tsx
'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import FolderTree from './FolderTree';

type MediaItem = {
  id: string;
  url: string;
  filename: string;
  folder: string;
  type: string;
  size: number;
  createdAt: string;
};

type Tab = 'images' | 'videos';

type FolderNode = {
  name: string;
  path: string;
  children: FolderNode[];
};

function buildFolderTree(folderPaths: string[]): FolderNode[] {
  const root: FolderNode = { name: 'root', path: 'root', children: [] };
  const nodeMap = new Map<string, FolderNode>();
  nodeMap.set('root', root);

  const uniquePaths = [...new Set(folderPaths)];

  for (const path of uniquePaths) {
    if (!path) continue;
    const parts = path.split('/');
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const currentPath = parts.slice(0, i + 1).join('/');

      if (!nodeMap.has(currentPath)) {
        const newNode: FolderNode = { name: part, path: currentPath, children: [] };
        nodeMap.set(currentPath, newNode);
        current.children.push(newNode);
      }

      current = nodeMap.get(currentPath)!;
    }
  }

  const sortTree = (node: FolderNode) => {
    node.children.sort((a, b) => a.name.localeCompare(b.name));
    node.children.forEach(sortTree);
  };
  root.children.forEach(sortTree);

  return root.children;
}

export default function MediaLibrary() {
  const [activeTab, setActiveTab] = useState<Tab>('images');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [customFolders, setCustomFolders] = useState<string[]>([]);
  const [creatingInFolder, setCreatingInFolder] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-media'],
    queryFn: async () => {
      const res = await fetch('/api/admin/media');
      if (!res.ok) throw new Error('Failed to load media');
      return res.json();
    },
  });

  const media: MediaItem[] = data?.media || [];
  const rawFolders: string[] = data?.folders || [];
  const allFolderPaths = [...new Set([...rawFolders, ...customFolders])].filter(f => f !== '');
  const folderTree = buildFolderTree(allFolderPaths);

  const countFilesInFolder = (folderPath: string, items: MediaItem[]): number => {
    return items.filter(item =>
      item.folder === folderPath || 
      (folderPath && item.folder.startsWith(folderPath + '/'))
    ).length;
  };

  const images = media.filter(m => m.type.startsWith('image'));
  const videos = media.filter(m => m.type.startsWith('video'));
  const currentItems = activeTab === 'images' ? images : videos;

  const folderCounts = allFolderPaths.reduce((acc, path) => {
    acc[path] = countFilesInFolder(path, currentItems);
    return acc;
  }, {} as Record<string, number>);

  const filteredItems = currentItems
    .filter(item => {
      if (selectedFolder === 'all') return true;
      if (selectedFolder === '') return item.folder === '';
      return item.folder === selectedFolder || item.folder.startsWith(selectedFolder + '/');
    })
    .filter(item => item.filename.toLowerCase().includes(searchTerm.toLowerCase()));

  const deleteMutation = useMutation({
    mutationFn: async (blobName: string) => {
      const res = await fetch('/api/admin/media', {
        method: 'DELETE',
        body: JSON.stringify({ blobName }),
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Delete failed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-media'] });
      toast.success('Deleted successfully');
    },
    onError: () => toast.error('Failed to delete'),
  });

  const deleteFolderMutation = useMutation({
    mutationFn: async (folder: string) => {
      const res = await fetch('/api/admin/media', {
        method: 'DELETE',
        body: JSON.stringify({ folder }),
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Delete folder failed');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-media'] });
      toast.success(`Folder deleted (${data.deletedCount} files removed)`);
      setSelectedFolder('all');
    },
    onError: () => toast.error('Failed to delete folder'),
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      // Determine folder to upload to
      const uploadFolder = (selectedFolder === 'all' || selectedFolder === '') ? '' : selectedFolder;
      // If "All Files" is selected, we still upload to root
      formData.append('folder', uploadFolder);

      const res = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Upload failed');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Uploaded successfully!');
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Upload failed');
    },
    onSettled: () => {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  });

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type based on tab
    const validTypes = activeTab === 'images' 
      ? ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp']
      : ['video/mp4', 'video/webm'];
    
    if (!validTypes.some(type => file.type.startsWith(type.split('/')[0]))) {
      toast.error(`Please upload a valid ${activeTab === 'images' ? 'image' : 'video'} file.`);
      return;
    }

    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Maximum size: 10MB');
      return;
    }

    setIsUploading(true);
    uploadMutation.mutate(file);
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copied to clipboard!');
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return '—';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleCreateSubfolder = (parentPath: string) => {
    setCreatingInFolder(parentPath);
    setNewFolderName('');
  };

  const handleCreateFolderSubmit = () => {
    if (!newFolderName.trim() || creatingInFolder === null) return;

    const sanitized = newFolderName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    if (!sanitized) {
      toast.error('Invalid folder name');
      return;
    }

    const fullPath = creatingInFolder === '' 
      ? sanitized 
      : `${creatingInFolder}/${sanitized}`;

    if (allFolderPaths.includes(fullPath)) {
      toast.error('Folder already exists');
      return;
    }

    setCustomFolders(prev => [...prev, fullPath]);
    toast.success(`Folder created: ${fullPath}`);
    setCreatingInFolder(null);
    setNewFolderName('');
  };

  // Determine upload button text
  const uploadButtonText = `Upload ${activeTab === 'images' ? 'Image' : 'Video'}`;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Media Library</h1>
          <p className="text-lg text-gray-600">Upload and manage images and videos</p>
        </div>
        <button
          onClick={handleUploadClick}
          disabled={isUploading}
          className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all text-lg disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isUploading ? 'Uploading...' : uploadButtonText}
        </button>
        <input
          type="file"
          ref={fileInputRef}
          accept={activeTab === 'images' ? 'image/*' : 'video/*'}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-8 w-fit">
        <button
          onClick={() => {
            setActiveTab('images');
            setSearchTerm('');
          }}
          className={clsx(
            'px-10 py-4 rounded-lg font-semibold text-lg transition-all flex items-center gap-3',
            activeTab === 'images'
              ? 'bg-white text-blue-700 shadow-lg'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          Images ({images.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('videos');
            setSearchTerm('');
          }}
          className={clsx(
            'px-10 py-4 rounded-lg font-semibold text-lg transition-all flex items-center gap-3',
            activeTab === 'videos'
              ? 'bg-white text-purple-700 shadow-lg'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          Videos ({videos.length})
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Folder Tree Sidebar */}
        <div className="lg:col-span-1">
          {creatingInFolder !== null && (
            <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <p className="text-sm text-blue-800 mb-2">
                Create folder inside: <span className="font-mono font-semibold">
                  {creatingInFolder === '' ? '/' : `/${creatingInFolder}/`}
                </span>
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateFolderSubmit()}
                  placeholder="Folder name..."
                  className="flex-1 px-3 py-2 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <button
                  onClick={handleCreateFolderSubmit}
                  className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 whitespace-nowrap"
                >
                  Create
                </button>
                <button
                  onClick={() => setCreatingInFolder(null)}
                  className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-100 whitespace-nowrap"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <FolderTree
            nodes={folderTree}
            selectedFolder={selectedFolder}
            onSelectFolder={setSelectedFolder}
            onDeleteFolder={(folder) => deleteFolderMutation.mutate(folder)}
            onCreateFolder={handleCreateSubfolder}
            folderCounts={folderCounts}
          />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Breadcrumb */}
          {selectedFolder !== 'all' && (
            <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
              <button
                onClick={() => setSelectedFolder('all')}
                className="hover:underline"
              >
                All Files
              </button>
              {selectedFolder !== '' && (
                <>
                  <span>/</span>
                  {selectedFolder.split('/').map((part, i, arr) => (
                    <span key={i} className="flex items-center">
                      <button
                        onClick={() => setSelectedFolder(arr.slice(0, i + 1).join('/'))}
                        className="hover:underline"
                      >
                        {part}
                      </button>
                      {i < arr.length - 1 && <span className="mx-1">/</span>}
                    </span>
                  ))}
                </>
              )}
              <span className="text-gray-400 ml-2">({filteredItems.length} items)</span>
            </div>
          )}

          {/* Search */}
          <div className="mb-6">
            <input
              type="text"
              placeholder={`Search ${activeTab} by filename...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-6 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 text-lg shadow-sm placeholder-gray-400"
            />
          </div>

          {/* Empty State */}
          {!isLoading && filteredItems.length === 0 && (
            <div className="text-center py-32 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-300">
              <div className="text-9xl mb-8 opacity-20">
                {activeTab === 'images' ? '🖼️' : '🎥'}
              </div>
              <h3 className="text-3xl font-bold text-gray-700 mb-3">
                No {activeTab} found
              </h3>
              <p className="text-xl text-gray-500 max-w-md mx-auto">
                {searchTerm
                  ? `No results for "${searchTerm}"`
                  : selectedFolder !== 'all'
                  ? `No ${activeTab} in this folder`
                  : `You haven't uploaded any ${activeTab} yet.`}
              </p>
              {!searchTerm && (
                <button
                  onClick={handleUploadClick}
                  className="mt-8 px-10 py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-2xl shadow-2xl hover:shadow-3xl hover:scale-105 transition-all text-xl"
                >
                  Upload Your First {activeTab === 'images' ? 'Image' : 'Video'}
                </button>
              )}
            </div>
          )}

          {/* Media Grid */}
          {!isLoading && filteredItems.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="group relative bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-200"
                >
                  <div className="aspect-square bg-gray-100 relative overflow-hidden">
                    {item.type.startsWith('image') ? (
                      <img
                        src={item.url}
                        alt={item.filename}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <video
                        src={item.url}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        muted
                        playsInline
                      />
                    )}

                    {item.type.startsWith('video') && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-black/60 backdrop-blur-sm rounded-full p-6">
                          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="absolute top-3 right-3 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <button
                      onClick={() => copyToClipboard(item.url)}
                      className="bg-white/95 backdrop-blur p-3.5 rounded-full shadow-2xl hover:scale-110 transition-all"
                      title="Copy URL"
                    >
                      <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Permanently delete "${item.filename}"?`)) {
                          deleteMutation.mutate(item.id);
                        }
                      }}
                      className="bg-red-500/95 text-white p-3.5 rounded-full shadow-2xl hover:scale-110 transition-all"
                      title="Delete"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {item.folder && (
                    <div className="absolute top-3 left-3">
                      <span className="bg-blue-600/90 text-white text-xs font-semibold px-3 py-1 rounded-full backdrop-blur">
                        {item.folder}
                      </span>
                    </div>
                  )}

                  <div className="p-4 bg-gradient-to-t from-gray-50 to-transparent">
                    <p className="text-sm font-medium text-gray-900 truncate" title={item.filename}>
                      {item.filename}
                    </p>
                    <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                      <span>{formatSize(item.size)}</span>
                      <span>{formatDate(item.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}