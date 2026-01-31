'use client';
import { useState, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import FolderTree from './FolderTree';
import ConfirmDialog from '../shared/ConfirmDialog';

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
type SortOption = 'name-asc' | 'name-desc' | 'date-asc' | 'date-desc' | 'size-asc' | 'size-desc';

type FolderNode = {
  name: string;
  path: string;
  children: FolderNode[];
};

type ConfirmAction = {
  type: 'delete-file' | 'delete-folder' | 'bulk-delete' | 'bulk-move';
  data?: any;
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
  const [creatingInFolder, setCreatingInFolder] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [uploadingCount, setUploadingCount] = useState(0);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renamingItem, setRenamingItem] = useState<MediaItem | null>(null);
  const [newFilename, setNewFilename] = useState('');
  const [moveTargetFolder, setMoveTargetFolder] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [isDragging, setIsDragging] = useState(false);
  
  // ✅ NEW: Confirmation dialog state
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

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
  const folders: string[] = data?.folders || [];
  const folderTree = useMemo(() => buildFolderTree(folders), [folders]);

  const countFilesInFolder = (folderPath: string, items: MediaItem[]): number => {
    return items.filter(item =>
      item.folder === folderPath ||
      (folderPath && item.folder.startsWith(folderPath + '/'))
    ).length;
  };

  const images = media.filter(m => m.type.startsWith('image'));
  const videos = media.filter(m => m.type.startsWith('video'));
  const currentItems = activeTab === 'images' ? images : videos;

  const folderCounts = useMemo(() =>
    folders.reduce((acc, path) => {
      acc[path] = countFilesInFolder(path, currentItems);
      return acc;
    }, {} as Record<string, number>),
    [folders, currentItems]
  );

  const filteredAndSortedItems = useMemo(() => {
    let items = currentItems.filter(item => {
      const folderMatch = selectedFolder === 'all'
        ? true
        : selectedFolder === ''
        ? item.folder === ''
        : item.folder === selectedFolder || item.folder.startsWith(selectedFolder + '/');
      
      const searchLower = searchTerm.toLowerCase();
      const searchMatch = item.filename.toLowerCase().includes(searchLower) ||
        item.folder.toLowerCase().includes(searchLower);
      
      return folderMatch && searchMatch;
    });

    items.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.filename.localeCompare(b.filename);
        case 'name-desc':
          return b.filename.localeCompare(a.filename);
        case 'date-asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'date-desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'size-asc':
          return a.size - b.size;
        case 'size-desc':
          return b.size - a.size;
        default:
          return 0;
      }
    });

    return items;
  }, [currentItems, selectedFolder, searchTerm, sortBy]);

  const moveFilesMutation = useMutation({
    mutationFn: async ({ blobNames, targetFolder }: { blobNames: string[], targetFolder: string }) => {
      const res = await fetch('/api/admin/media/move', {
        method: 'POST',
        body: JSON.stringify({ type: 'files', blobNames, targetFolder }),
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Move failed');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-media'] });
      toast.success(`Moved ${data.movedCount} files successfully`);
      setSelectedItems(new Set());
      setShowMoveModal(false);
      setConfirmAction(null);
    },
    onError: () => toast.error('Failed to move files'),
  });

  const renameFileMutation = useMutation({
    mutationFn: async ({ blobName, newFilename }: { blobName: string, newFilename: string }) => {
      const res = await fetch('/api/admin/media/rename', {
        method: 'PATCH',
        body: JSON.stringify({ blobName, newFilename }),
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Rename failed');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-media'] });
      toast.success('File renamed successfully');
      setShowRenameModal(false);
      setRenamingItem(null);
      setNewFilename('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to rename file');
    },
  });

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
      setConfirmAction(null);
    },
    onError: () => toast.error('Failed to delete'),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (blobNames: string[]) => {
      const promises = blobNames.map(blobName =>
        fetch('/api/admin/media', {
          method: 'DELETE',
          body: JSON.stringify({ blobName }),
          headers: { 'Content-Type': 'application/json' },
        })
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-media'] });
      toast.success(`Deleted ${selectedItems.size} files successfully`);
      setSelectedItems(new Set());
      setConfirmAction(null);
    },
    onError: () => toast.error('Failed to delete files'),
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
      setConfirmAction(null);
    },
    onError: () => toast.error('Failed to delete folder'),
  });

  const createFolderMutation = useMutation({
    mutationFn: async ({ path, name }: { path: string; name: string }) => {
      const res = await fetch('/api/admin/media/folders', {
        method: 'POST',
        body: JSON.stringify({ path, name }),
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create folder');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-media'] });
      toast.success('Folder created successfully!');
      setShowCreateFolderModal(false);
      setCreatingInFolder(null);
      setNewFolderName('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create folder');
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
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
    onMutate: () => {
      setUploadingCount(prev => prev + 1);
    },
    onSuccess: (data, file) => {
      toast.success(`${file.name} uploaded successfully!`);
      refetch();
    },
    onError: (error: any, file) => {
      toast.error(`${file.name}: ${error.message || 'Upload failed'}`);
    },
    onSettled: () => {
      setUploadingCount(prev => Math.max(0, prev - 1));
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  });

  // Handlers
  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedItems(new Set(filteredAndSortedItems.map(item => item.id)));
  };

  const deselectAll = () => {
    setSelectedItems(new Set());
  };

  const handleBulkDelete = () => {
    if (selectedItems.size === 0) return;
    const selectedFiles = filteredAndSortedItems.filter(item => selectedItems.has(item.id));
    setConfirmAction({
      type: 'bulk-delete',
      data: { count: selectedItems.size, files: selectedFiles }
    });
  };

  const handleBulkMove = () => {
    if (selectedItems.size === 0) return;
    setMoveTargetFolder('');
    setShowMoveModal(true);
  };

  const confirmBulkMove = () => {
    if (!moveTargetFolder && moveTargetFolder !== 'root') return;
    setConfirmAction({
      type: 'bulk-move',
      data: {
        blobNames: Array.from(selectedItems),
        targetFolder: moveTargetFolder === 'root' ? '' : moveTargetFolder,
        count: selectedItems.size
      }
    });
  };

  const handleRename = (item: MediaItem) => {
    setRenamingItem(item);
    setNewFilename(item.filename);
    setShowRenameModal(true);
  };

  const confirmRename = () => {
    if (!renamingItem || !newFilename.trim()) return;
    renameFileMutation.mutate({
      blobName: renamingItem.id,
      newFilename: newFilename.trim()
    });
  };

  const handleDeleteFile = (item: MediaItem) => {
    setConfirmAction({
      type: 'delete-file',
      data: item
    });
  };

  const handleDeleteFolder = (folder: string) => {
    const count = countFilesInFolder(folder, media);
    setConfirmAction({
      type: 'delete-folder',
      data: { folder, count }
    });
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach(file => {
      uploadFile(file);
    });
  };

  const uploadFile = (file: File) => {
    const validTypes = activeTab === 'images'
      ? ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp']
      : ['video/mp4', 'video/webm'];

    if (!validTypes.some(type => file.type.startsWith(type.split('/')[0]))) {
      toast.error(`${file.name}: Please upload a valid ${activeTab === 'images' ? 'image' : 'video'} file.`);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error(`${file.name}: File too large. Maximum size: 10MB`);
      return;
    }

    uploadMutation.mutate(file);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;
    files.forEach(file => {
      uploadFile(file);
    });
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

    createFolderMutation.mutate({
      path: fullPath,
      name: sanitized
    });
  };

  // ✅ NEW: Confirmation dialog handlers
  const handleConfirm = () => {
    if (!confirmAction) return;
    switch (confirmAction.type) {
      case 'delete-file':
        deleteMutation.mutate(confirmAction.data.id);
        break;
      case 'delete-folder':
        deleteFolderMutation.mutate(confirmAction.data.folder);
        break;
      case 'bulk-delete':
        bulkDeleteMutation.mutate(Array.from(selectedItems));
        break;
      case 'bulk-move':
        moveFilesMutation.mutate({
          blobNames: confirmAction.data.blobNames,
          targetFolder: confirmAction.data.targetFolder
        });
        setShowMoveModal(false);
        break;
    }
  };

  const handleCancelConfirm = () => {
    setConfirmAction(null);
  };

  // ✅ NEW: Get confirmation dialog content
  const getConfirmContent = () => {
    if (!confirmAction) return { title: '', message: '' };
    switch (confirmAction.type) {
      case 'delete-file':
        return {
          title: 'Delete File',
          message: (
            <div>
              <p className="mb-2">Are you sure you want to delete:</p>
              <p className="font-semibold text-[var(--text-primary)]">📷 {confirmAction.data.filename}</p>
              <p className="mt-3 text-sm text-[var(--text-muted)]">This action cannot be undone.</p>
            </div>
          ),
          confirmText: 'Delete',
          variant: 'danger' as const
        };
      case 'delete-folder':
        return {
          title: 'Delete Folder',
          message: (
            <div>
              <p className="mb-2">Delete <span className="font-semibold">"{confirmAction.data.folder}"</span> and all contents?</p>
              <div className="mt-3 p-3 bg-[var(--danger-light)] border border-[var(--danger-light)] rounded-lg">
                <p className="font-semibold text-[var(--danger-dark)] mb-1">This will permanently delete:</p>
                <p className="text-[var(--danger-dark)]">• {confirmAction.data.count} files</p>
              </div>
              <p className="mt-3 text-sm text-[var(--text-muted)]">This action cannot be undone.</p>
            </div>
          ),
          confirmText: 'Delete Folder',
          variant: 'danger' as const
        };
      case 'bulk-delete':
        return {
          title: 'Delete Multiple Files',
          message: (
            <div>
              <p className="mb-2">Delete {confirmAction.data.count} selected files?</p>
              <div className="mt-3 p-3 bg-[var(--danger-light)] border border-[var(--danger-light)] rounded-lg max-h-48 overflow-y-auto">
                <p className="font-semibold text-[var(--danger-dark)] mb-2">Files to be deleted:</p>
                <ul className="text-sm text-[var(--danger-dark)] space-y-1">
                  {confirmAction.data.files.slice(0, 10).map((file: MediaItem) => (
                    <li key={file.id}>• {file.filename}</li>
                  ))}
                  {confirmAction.data.files.length > 10 && (
                    <li className="font-semibold">... and {confirmAction.data.files.length - 10} more</li>
                  )}
                </ul>
              </div>
              <p className="mt-3 text-sm text-[var(--text-muted)]">This action cannot be undone.</p>
            </div>
          ),
          confirmText: 'Delete All',
          variant: 'danger' as const
        };
      case 'bulk-move':
        const targetName = confirmAction.data.targetFolder || 'root';
        return {
          title: 'Move Files',
          message: (
            <div>
              <p className="mb-2">Move {confirmAction.data.count} files to <span className="font-mono font-semibold text-[var(--primary-dark)]">/{targetName}</span>?</p>
              <p className="mt-3 text-sm text-[var(--text-muted)]">Files will be moved to the selected folder.</p>
            </div>
          ),
          confirmText: 'Move Files',
          variant: 'primary' as const
        };
      default:
        return { title: '', message: '', confirmText: 'Confirm', variant: 'primary' as const };
    }
  };

  const confirmContent = getConfirmContent();
  const uploadButtonText = `Upload ${activeTab === 'images' ? 'Image' : 'Video'}`;

  return (
    <div
      className="p-8 max-w-7xl mx-auto"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag & Drop Overlay - UPDATED WITH BRAND COLORS */}
      {isDragging && (
        <div className="fixed inset-0 bg-[var(--primary-light)] bg-opacity-20 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-[var(--background)] rounded-3xl p-12 shadow-2xl border-4 border-dashed border-[var(--primary-light)]">
            <div className="text-6xl mb-4 text-center">📁</div>
            <p className="text-2xl font-bold text-[var(--text-primary)] text-center">
              Drop files here to upload
            </p>
            <p className="text-lg text-[var(--text-secondary)] text-center mt-2">
              to {selectedFolder === 'all' ? 'root' : selectedFolder || 'root'} folder
            </p>
            <p className="text-sm text-[var(--text-muted)] text-center mt-2">
              You can drop multiple files at once
            </p>
          </div>
        </div>
      )}
      
      {/* ✅ NEW: Confirmation Dialog */}
      <ConfirmDialog
        open={confirmAction !== null}
        title={confirmContent.title}
        message={confirmContent.message}
        confirmText={confirmContent.confirmText}
        confirmVariant={confirmContent.variant}
        onConfirm={handleConfirm}
        onCancel={handleCancelConfirm}
        isLoading={
          deleteMutation.isPending ||
          deleteFolderMutation.isPending ||
          bulkDeleteMutation.isPending ||
          moveFilesMutation.isPending
        }
      />
      
      {/* Header - UPDATED WITH BRAND COLORS */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-2">Media Library</h1>
          <p className="text-lg text-[var(--text-secondary)]">Upload and manage images and videos</p>
        </div>
        <button
          onClick={handleUploadClick}
          disabled={uploadingCount > 0}
          className="px-8 py-4 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] text-[var(--text-inverse)] font-bold rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all text-lg disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {uploadingCount > 0 ? `Uploading ${uploadingCount} file${uploadingCount > 1 ? 's' : ''}...` : uploadButtonText}
        </button>
        <input
          type="file"
          ref={fileInputRef}
          accept={activeTab === 'images' ? 'image/*' : 'video/*'}
          onChange={handleFileChange}
          multiple
          className="hidden"
        />
      </div>
      
      {/* Tabs - UPDATED WITH BRAND COLORS */}
      <div className="flex gap-1 bg-[var(--surface)] p-1 rounded-xl mb-8 w-fit">
        <button
          onClick={() => {
            setActiveTab('images');
            setSearchTerm('');
            setSelectedItems(new Set());
          }}
          className={clsx(
            'px-10 py-4 rounded-lg font-semibold text-lg transition-all flex items-center gap-3',
            activeTab === 'images'
              ? 'bg-[var(--background)] text-[var(--primary)] shadow-lg'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          )}
        >
          Images ({images.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('videos');
            setSearchTerm('');
            setSelectedItems(new Set());
          }}
          className={clsx(
            'px-10 py-4 rounded-lg font-semibold text-lg transition-all flex items-center gap-3',
            activeTab === 'videos'
              ? 'bg-[var(--background)] text-[var(--highlight-dark)] shadow-lg'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          )}
        >
          Videos ({videos.length})
        </button>
      </div>
      
      {/* Bulk Actions Bar - UPDATED WITH BRAND COLORS */}
      {selectedItems.size > 0 && (
        <div className="mb-6 bg-[var(--primary-surface)] border-2 border-[var(--primary-light)] rounded-xl p-4 flex items-center justify-between animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-[var(--primary-dark)]">{selectedItems.size} selected</span>
            <button
              onClick={deselectAll}
              className="text-sm text-[var(--primary)] hover:underline"
            >
              Deselect All
            </button>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleBulkMove}
              className="px-4 py-2 bg-[var(--primary)] text-[var(--text-inverse)] rounded-lg hover:bg-[var(--primary-dark)] flex items-center gap-2 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Move to...
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-4 py-2 bg-[var(--danger)] text-[var(--text-inverse)] rounded-lg hover:bg-[var(--danger-dark)] flex items-center gap-2 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Folder Tree Sidebar */}
        <div className="lg:col-span-1">
          {/* Modals - UPDATED WITH BRAND COLORS */}
          {showCreateFolderModal && creatingInFolder !== null && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-[var(--background)] rounded-xl p-6 w-full max-w-md animate-in fade-in zoom-in duration-200">
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Create New Folder</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-4">
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
                    className="w-full px-4 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)]"
                    autoFocus
                    disabled={createFolderMutation.isPending}
                  />
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateFolderModal(false);
                        setCreatingInFolder(null);
                      }}
                      className="px-4 py-2 border border-[var(--border)] rounded-lg text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
                      disabled={createFolderMutation.isPending}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateFolderSubmit}
                      disabled={createFolderMutation.isPending}
                      className="px-4 py-2 bg-[var(--primary)] text-[var(--text-inverse)] rounded-lg hover:bg-[var(--primary-dark)] disabled:opacity-70 flex items-center gap-2"
                    >
                      {createFolderMutation.isPending && (
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                      {createFolderMutation.isPending ? 'Creating...' : 'Create Folder'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {showMoveModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-[var(--background)] rounded-xl p-6 w-full max-w-md animate-in fade-in zoom-in duration-200">
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Move {selectedItems.size} Files</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-4">Select destination folder:</p>
                <select
                  value={moveTargetFolder}
                  onChange={(e) => setMoveTargetFolder(e.target.value)}
                  className="w-full px-4 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] mb-4"
                >
                  <option value="">-- Select Folder --</option>
                  <option value="root">Root (/)</option>
                  {folders.map(folder => (
                    <option key={folder} value={folder}>/{folder}</option>
                  ))}
                </select>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowMoveModal(false)}
                    className="px-4 py-2 border border-[var(--border)] rounded-lg text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmBulkMove}
                    disabled={moveTargetFolder === ''}
                    className="px-4 py-2 bg-[var(--primary)] text-[var(--text-inverse)] rounded-lg hover:bg-[var(--primary-dark)] disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {showRenameModal && renamingItem && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-[var(--background)] rounded-xl p-6 w-full max-w-md animate-in fade-in zoom-in duration-200">
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Rename File</h3>
                <input
                  type="text"
                  value={newFilename}
                  onChange={(e) => setNewFilename(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && confirmRename()}
                  className="w-full px-4 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] mb-4"
                  autoFocus
                  disabled={renameFileMutation.isPending}
                />
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowRenameModal(false);
                      setRenamingItem(null);
                    }}
                    className="px-4 py-2 border border-[var(--border)] rounded-lg text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
                    disabled={renameFileMutation.isPending}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmRename}
                    disabled={renameFileMutation.isPending}
                    className="px-4 py-2 bg-[var(--primary)] text-[var(--text-inverse)] rounded-lg hover:bg-[var(--primary-dark)] disabled:opacity-70 flex items-center gap-2"
                  >
                    {renameFileMutation.isPending && (
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    {renameFileMutation.isPending ? 'Renaming...' : 'Rename'}
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <FolderTree
            nodes={folderTree}
            selectedFolder={selectedFolder}
            onSelectFolder={setSelectedFolder}
            onDeleteFolder={handleDeleteFolder}
            onCreateFolder={handleCreateSubfolder}
            folderCounts={folderCounts}
          />
        </div>
        
        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Breadcrumb - UPDATED WITH BRAND COLORS */}
          {selectedFolder !== 'all' && (
            <div className="mb-4 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <button onClick={() => setSelectedFolder('all')} className="hover:underline">
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
              <span className="text-[var(--text-muted)] ml-2">({filteredAndSortedItems.length} items)</span>
            </div>
          )}
          
          {/* Search & Sort Controls - UPDATED WITH BRAND COLORS */}
          <div className="mb-6 flex gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder={`Search ${activeTab} by filename or folder...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-6 py-4 pr-12 border border-[var(--border)] rounded-2xl focus:outline-none focus:ring-4 focus:ring-[var(--primary-surface)] focus:border-[var(--primary-light)] text-lg shadow-sm placeholder-[var(--text-muted)]"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  title="Clear search"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-6 py-4 border border-[var(--border)] rounded-2xl focus:outline-none focus:ring-4 focus:ring-[var(--primary-surface)] focus:border-[var(--primary-light)] text-lg shadow-sm bg-[var(--background)] font-medium text-[var(--text-primary)]"
            >
              <option value="date-desc">📅 Newest First</option>
              <option value="date-asc">📅 Oldest First</option>
              <option value="name-asc">🔤 Name (A-Z)</option>
              <option value="name-desc">🔤 Name (Z-A)</option>
              <option value="size-asc">📏 Smallest First</option>
              <option value="size-desc">📏 Largest First</option>
            </select>
            {filteredAndSortedItems.length > 0 && (
              <button
                onClick={selectAll}
                className="px-6 py-4 border-2 border-[var(--primary)] text-[var(--primary)] rounded-2xl hover:bg-[var(--primary-surface)] font-semibold whitespace-nowrap transition-colors"
              >
                Select All
              </button>
            )}
          </div>
          
          {/* ✅ NEW: Loading Skeleton - UPDATED WITH BRAND COLORS */}
          {isLoading && (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-[var(--background)] rounded-2xl shadow-lg overflow-hidden border border-[var(--border)] animate-pulse">
                  <div className="aspect-square bg-[var(--surface)]"></div>
                  <div className="p-4">
                    <div className="h-4 bg-[var(--surface-hover)] rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-[var(--surface-hover)] rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Empty State - UPDATED WITH BRAND COLORS */}
          {!isLoading && filteredAndSortedItems.length === 0 && (
            <div className="text-center py-32 bg-[var(--surface)] rounded-3xl border-2 border-dashed border-[var(--border)]">
              <div className="text-9xl mb-8 opacity-20">
                {activeTab === 'images' ? '🖼️' : '🎥'}
              </div>
              <h3 className="text-3xl font-bold text-[var(--text-primary)] mb-3">No {activeTab} found</h3>
              <p className="text-xl text-[var(--text-secondary)] max-w-md mx-auto">
                {searchTerm
                  ? `No results for "${searchTerm}"`
                  : selectedFolder !== 'all'
                  ? `No ${activeTab} in this folder`
                  : `You haven't uploaded any ${activeTab} yet.`}
              </p>
              {!searchTerm && (
                <button
                  onClick={handleUploadClick}
                  className="mt-8 px-10 py-5 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] text-[var(--text-inverse)] font-bold rounded-2xl shadow-2xl hover:shadow-3xl hover:scale-105 transition-all text-xl"
                >
                  Upload Your First {activeTab === 'images' ? 'Image' : 'Video'}
                </button>
              )}
            </div>
          )}
          
          {/* Media Grid - UPDATED WITH BRAND COLORS */}
          {!isLoading && filteredAndSortedItems.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredAndSortedItems.map((item) => {
                const isSelected = selectedItems.has(item.id);
                return (
                  <div
                    key={item.id}
                    className={clsx(
                      'group relative bg-[var(--background)] rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border-2',
                      isSelected ? 'border-[var(--primary)] ring-2 ring-[var(--primary-surface)]' : 'border-[var(--border)]'
                    )}
                  >
                    <div className="absolute top-3 left-3 z-10">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleItemSelection(item.id)}
                        className="w-5 h-5 rounded border-2 border-[var(--background)] cursor-pointer"
                      />
                    </div>
                    <div className="aspect-square bg-[var(--surface)] relative overflow-hidden">
                      {item.type.startsWith('image') ? (
                        <img
                          src={item.url}
                          alt={item.filename}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          loading="lazy"
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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 00-2-2V6a2 2 0 002-2h8a2 2 0 002 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleRename(item)}
                        className="bg-white/95 backdrop-blur p-3.5 rounded-full shadow-2xl hover:scale-110 transition-all"
                        title="Rename"
                      >
                        <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteFile(item)}
                        className="bg-[var(--danger)]/95 text-white p-3.5 rounded-full shadow-2xl hover:scale-110 transition-all"
                        title="Delete"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    {item.folder && (
                      <div className="absolute bottom-20 left-3">
                        <span className="bg-[var(--primary)]/90 text-white text-xs font-semibold px-3 py-1 rounded-full backdrop-blur">
                          {item.folder}
                        </span>
                      </div>
                    )}
                    <div className="p-4 bg-gradient-to-t from-[var(--surface)] to-transparent">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate" title={item.filename}>
                        {item.filename}
                      </p>
                      <div className="flex justify-between items-center mt-2 text-xs text-[var(--text-muted)]">
                        <span>{formatSize(item.size)}</span>
                        <span>{formatDate(item.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}