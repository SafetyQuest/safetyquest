// apps/web/components/admin/MediaSelector.tsx
'use client';

import { useState, useRef, useEffect } from 'react';  // ✅ Added useEffect
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import clsx from 'clsx';

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

type MediaSelectorProps = {
  onSelect: (url: string, fileInfo: MediaItem) => void;
  onClose: () => void;
  accept?: 'image/*' | 'video/*';
};

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

export default function MediaSelector({
  onSelect,
  onClose,
  accept = 'image/*'
}: MediaSelectorProps) {
  const isImageSelector = accept.startsWith('image');
  const [activeTab, setActiveTab] = useState<Tab>(isImageSelector ? 'images' : 'videos');
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [creatingInFolder, setCreatingInFolder] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [customFolders, setCustomFolders] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ✅ Add requestClose function
  const requestClose = () => {
    if (showCreateFolderModal) {
      // Don't close main modal if nested folder modal is open
      return;
    }
    onClose();
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-media-selector', activeTab],
    queryFn: async () => {
      const typeParam = activeTab === 'images' ? 'image' : 'video';
      const res = await fetch(`/api/admin/media?type=${typeParam}`);
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

  const folderCounts = allFolderPaths.reduce((acc, path) => {
    acc[path] = countFilesInFolder(path, media);
    return acc;
  }, {} as Record<string, number>);

  const filteredItems = media.filter(item => {
    if (selectedFolder === 'all') return true;
    if (selectedFolder === '') return item.folder === '';
    return item.folder === selectedFolder || item.folder.startsWith(selectedFolder + '/');
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      // ✅ Upload to currently selected folder (same as MediaLibrary)
      const uploadFolder = (selectedFolder === 'all' || selectedFolder === '') ? '' : selectedFolder;
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
    onSuccess: (data) => {
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = activeTab === 'images' 
      ? ['image/jpg', 'image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp']
      : ['video/mp4', 'video/webm'];
    
    if (!validTypes.some(type => file.type.startsWith(type.split('/')[0]))) {
      toast.error(`Please upload a valid ${activeTab === 'images' ? 'image' : 'video'} file.`);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Maximum size: 10MB');
      return;
    }

    setIsUploading(true);
    uploadMutation.mutate(file);
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleSelectMedia = () => {
    if (!selectedMedia) return;
    
    const selectedItem = media.find(item => item.url === selectedMedia);
    if (!selectedItem) return;
  
    // Enforce media type consistency
    const expectedTypePrefix = isImageSelector ? 'image' : 'video';
    if (!selectedItem.type.startsWith(expectedTypePrefix)) {
      toast.error(`Please select a ${expectedTypePrefix} file`);
      return;
    }
  
    onSelect(selectedMedia, selectedItem);
    onClose();
  };

  const handleCreateSubfolder = (parentPath: string) => {
    setCreatingInFolder(parentPath);
    setNewFolderName('');
    setShowCreateFolderModal(true);
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
    setShowCreateFolderModal(false);
  };

  // Recursive folder component for sidebar
  function RecursiveFolder({
    node,
    selectedFolder,
    onSelectFolder,
    onCreateFolder,
    folderCounts,
    depth
  }: {
    node: FolderNode;
    selectedFolder: string;
    onSelectFolder: (path: string) => void;
    onCreateFolder: (parentPath: string) => void;
    folderCounts: Record<string, number>;
    depth: number;
  }) {
    const [expanded, setExpanded] = useState(true);
    const hasChildren = node.children.length > 0;
    const isSelected = selectedFolder === node.path;
    const count = folderCounts[node.path] || 0;

    return (
      <div>
        <div className="flex items-center gap-2 group py-1">
          {hasChildren && (
            <button
              type='button'
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              className="w-5 h-5 flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
            >
              {expanded ? '▾' : '▸'}
            </button>
          )}
          {!hasChildren && <div className="w-5" />}

          <button
            type='button'
            onClick={() => onSelectFolder(node.path)}
            className={clsx(
              'flex-1 text-left px-2 py-1.5 rounded text-sm font-medium truncate transition-colors',
              isSelected
                ? 'bg-primary-surface text-primary-dark'
                : 'text-text-secondary hover:bg-surface'
            )}
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
          >
            {node.name}
            {count > 0 && <span className="text-text-muted ml-1">({count})</span>}
          </button>

          <button
            type='button'
            onClick={(e) => {
              e.stopPropagation();
              onCreateFolder(node.path);
            }}
            className="p-1 text-primary opacity-0 group-hover:opacity-100 hover:bg-primary-surface rounded transition-opacity"
            title="Create subfolder"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </div>

        {hasChildren && expanded && (
          <div className="ml-2 border-l border-border pl-2">
            {node.children.map((child) => (
              <RecursiveFolder
                key={child.path}
                node={child}
                selectedFolder={selectedFolder}
                onSelectFolder={onSelectFolder}
                onCreateFolder={onCreateFolder}
                folderCounts={folderCounts}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

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

  const mediaType = activeTab === 'images' ? 'image' : 'video';
  const isVideo = activeTab === 'videos';

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !showCreateFolderModal) {
          requestClose();
        }
      }}
      onKeyDown={(e) => !showCreateFolderModal && e.key === 'Escape' && requestClose()}
      tabIndex={-1}
    >
      <div className="card w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-border pb-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-heading-3">
              Select {isImageSelector ? 'Image' : 'Video'}
            </h2>
            <button
              type='button'
              onClick={requestClose}
              className="text-text-muted hover:text-text-primary transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-1 bg-surface p-1 rounded-xl w-fit">
            <button
              type='button'
              onClick={() => setActiveTab('images')}
              className={clsx(
                'px-6 py-2 rounded-lg font-medium text-sm transition-all',
                activeTab === 'images'
                  ? 'bg-white text-primary shadow-md'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              Images ({media.filter(m => m.type.startsWith('image')).length})
            </button>
            <button
              type='button'
              onClick={() => setActiveTab('videos')}
              className={clsx(
                'px-6 py-2 rounded-lg font-medium text-sm transition-all',
                activeTab === 'videos'
                  ? 'bg-white text-highlight shadow-md'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              Videos ({media.filter(m => m.type.startsWith('video')).length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Folder Sidebar */}
          <div className="w-64 border-r border-border overflow-y-auto p-4">
            {/* Folder Creation Modal */}
            {showCreateFolderModal && creatingInFolder !== null && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]">
                <div className="card w-full max-w-md">
                <h3 className="text-heading-4 text-text-primary mb-4">Create New Folder</h3>
                
                <p className="text-sm text-text-secondary mb-4">
                    Create folder inside: 
                    <span className="font-mono font-semibold ml-1">
                    {creatingInFolder === '' ? '/' : `/${creatingInFolder}/`}
                    </span>
                </p>
                
                <div className="space-y-4">
                    <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateFolderSubmit()}
                    placeholder="Folder name..."
                    className="w-full"
                    autoFocus
                    />
                    
                    <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => {
                        setShowCreateFolderModal(false);
                        setCreatingInFolder(null);
                        }}
                        className="btn btn-secondary px-4 py-2"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleCreateFolderSubmit}
                        className="btn btn-primary px-4 py-2"
                    >
                        Create Folder
                    </button>
                    </div>
                </div>
                </div>
            </div>
            )}

            <div className="space-y-1">
              <button
                type='button'
                onClick={() => setSelectedFolder('all')}
                className={clsx(
                  'w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors',
                  selectedFolder === 'all' ? 'bg-primary-surface text-primary-dark' : 'text-text-secondary hover:bg-surface'
                )}
              >
                <span className="font-medium">📁</span> All Files
              </button>
              <button
                type='button'
                onClick={() => setSelectedFolder('')}
                className={clsx(
                  'w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors',
                  selectedFolder === '' ? 'bg-primary-surface text-primary-dark' : 'text-text-secondary hover:bg-surface'
                )}
              >
                <span className="font-medium">📦</span> Unorganized {folderCounts[''] > 0 && <span className="text-text-muted">({folderCounts['']})</span>}
              </button>

              {folderTree.map((node) => (
                <RecursiveFolder
                  key={node.path}
                  node={node}
                  selectedFolder={selectedFolder}
                  onSelectFolder={setSelectedFolder}
                  onCreateFolder={handleCreateSubfolder}
                  folderCounts={folderCounts}
                  depth={0}
                />
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Upload Button */}
            <div className="mb-4 flex justify-end">
              <button
                type='button'
                onClick={handleUploadClick}
                disabled={isUploading}
                className="btn btn-primary whitespace-nowrap"
              >
                {isUploading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Uploading...
                  </span>
                ) : (
                  `📤 Upload ${activeTab === 'images' ? 'Image' : 'Video'}`
                )}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                accept={activeTab === 'images' ? 'image/*' : 'video/*'}
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Breadcrumb */}
            {selectedFolder !== 'all' && (
              <div className="mb-4 flex items-center gap-2 text-sm text-text-secondary">
                <button
                  type='button'
                  onClick={() => setSelectedFolder('all')}
                  className="hover:text-primary transition-colors"
                >
                  All Files
                </button>
                {selectedFolder !== '' && (
                  <>
                    <span>/</span>
                    {selectedFolder.split('/').map((part, i, arr) => (
                      <span key={i} className="flex items-center">
                        <button
                          type='button'
                          onClick={() => setSelectedFolder(arr.slice(0, i + 1).join('/'))}
                          className="hover:text-primary transition-colors"
                        >
                          {part}
                        </button>
                        {i < arr.length - 1 && <span className="mx-1">/</span>}
                      </span>
                    ))}
                  </>
                )}
                <span className="text-text-muted ml-2">({filteredItems.length} items)</span>
              </div>
            )}

            {isLoading ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4 opacity-20">
                  {activeTab === 'images' ? '🖼️' : '🎥'}
                </div>
                <p className="text-text-secondary">
                  {selectedFolder === 'all'
                    ? `No ${activeTab} in library`
                    : selectedFolder === ''
                    ? `No unorganized ${activeTab}`
                    : `No ${activeTab} in this folder`}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedMedia(item.url)}
                    className={clsx(
                      'group relative bg-white rounded-lg overflow-hidden border-2 cursor-pointer transition-all hover:shadow-md',
                      selectedMedia === item.url
                        ? 'border-primary shadow-lg scale-[1.02]'
                        : 'border-border hover:border-primary-light'
                    )}
                  >
                    <div className={`aspect-square ${isVideo ? 'bg-black' : 'bg-surface'} relative`}>
                      {item.type.startsWith('image') ? (
                        <img
                          src={item.url}
                          alt={item.filename}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <video
                          src={item.url}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                        />
                      )}

                      {isVideo && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="bg-black/60 backdrop-blur-sm rounded-full p-2">
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                            </svg>
                          </div>
                        </div>
                      )}

                      {selectedMedia === item.url && (
                        <div className="absolute top-2 right-2 bg-success rounded-full p-1 shadow-lg">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Folder Badge */}
                    {item.folder && (
                      <div className="absolute top-2 left-2">
                        <span className="bg-primary/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur">
                          {item.folder}
                        </span>
                      </div>
                    )}

                    <div className="p-2">
                      <p className="text-[11px] font-medium text-text-primary truncate" title={item.filename}>
                        {item.filename}
                      </p>
                      <div className="flex justify-between items-center mt-1 text-[9px] text-text-muted">
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

        {/* Footer */}
        <div className="border-t border-border pt-4 flex flex-col sm:flex-row justify-end gap-3">
          <button
            type='button'
            onClick={requestClose}
            className="btn btn-secondary px-4 py-2 w-full sm:w-auto"
          >
            Cancel
          </button>
          <button
            type='button'
            onClick={handleSelectMedia}
            disabled={!selectedMedia}
            className="btn btn-primary px-4 py-2 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✅ Select {activeTab === 'images' ? 'Image' : 'Video'}
          </button>
        </div>
      </div>
    </div>
  );
}