// apps/web/components/admin/FolderTree.tsx
'use client';

import { useState } from 'react';
import clsx from 'clsx';

type FolderNode = {
  name: string;
  path: string;
  children: FolderNode[];
};

type FolderTreeProps = {
  nodes: FolderNode[];
  selectedFolder: string;
  onSelectFolder: (path: string) => void;
  onDeleteFolder: (path: string) => void;
  onCreateFolder: (parentPath: string) => void;
  folderCounts: Record<string, number>;
};

function RecursiveFolder({
  node,
  selectedFolder,
  onSelectFolder,
  onCreateFolder,
  onDeleteFolder,
  folderCounts,
  depth
}: {
  node: FolderNode;
  selectedFolder: string;
  onSelectFolder: (path: string) => void;
  onCreateFolder: (parentPath: string) => void;
  onDeleteFolder: (path: string) => void;
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
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="w-5 h-5 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors duration-[--transition-base]"
          >
            {expanded ? '▾' : '▸'}
          </button>
        )}
        {!hasChildren && <div className="w-5" />}

        <button
          type="button"
          onClick={() => onSelectFolder(node.path)}
          className={clsx(
            'flex-1 text-left px-2 py-1.5 rounded text-sm font-medium truncate transition-colors duration-[--transition-base]',
            isSelected
              ? 'bg-[var(--primary-surface)] text-[var(--primary-dark)]'
              : 'text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          📁 {node.name}
          {count > 0 && <span className="text-[var(--text-muted)] ml-1">({count})</span>}
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCreateFolder(node.path);
          }}
          className="p-1 text-[var(--primary)] opacity-0 group-hover:opacity-100 hover:bg-[var(--primary-surface)] rounded transition-opacity duration-[--transition-base]"
          title="Create subfolder"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteFolder(node.path);
          }}
          className="p-1 text-[var(--danger)] opacity-0 group-hover:opacity-100 hover:bg-[var(--danger-light)] rounded transition-opacity duration-[--transition-base]"
          title="Delete folder"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {hasChildren && expanded && (
        <div className="ml-2 border-l border-[var(--border)] pl-2">
          {node.children.map((child) => (
            <RecursiveFolder
              key={child.path}
              node={child}
              selectedFolder={selectedFolder}
              onSelectFolder={onSelectFolder}
              onCreateFolder={onCreateFolder}
              onDeleteFolder={onDeleteFolder}
              folderCounts={folderCounts}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FolderTree({
  nodes,
  selectedFolder,
  onSelectFolder,
  onDeleteFolder,
  onCreateFolder,
  folderCounts
}: FolderTreeProps) {
  return (
    <div className="space-y-1">
      {/* All Files - UPDATED WITH BRAND COLORS */}
      <button
        type="button"
        onClick={() => onSelectFolder('all')}
        className={clsx(
          'w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors duration-[--transition-base]',
          selectedFolder === 'all' 
            ? 'bg-[var(--primary-surface)] text-[var(--primary-dark)]' 
            : 'text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
        )}
      >
        📂 All Files
      </button>

      {/* Unorganized - UPDATED WITH BRAND COLORS */}
      <button
        type="button"
        onClick={() => onSelectFolder('')}
        className={clsx(
          'w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors duration-[--transition-base]',
          selectedFolder === '' 
            ? 'bg-[var(--primary-surface)] text-[var(--primary-dark)]' 
            : 'text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
        )}
      >
        📄 Unorganized
        {folderCounts[''] > 0 && (
          <span className="text-[var(--text-muted)] ml-1">({folderCounts['']})</span>
        )}
      </button>

      {/* Divider - UPDATED WITH BRAND COLORS */}
      <div className="border-t border-[var(--border)] my-2"></div>

      {/* Root-level "Create Folder" Button - UPDATED WITH BRAND COLORS */}
      <button
        type="button"
        onClick={() => onCreateFolder('')}
        className="w-full text-left px-3 py-2 rounded text-sm font-semibold text-[var(--primary)] hover:bg-[var(--primary-surface)] border-2 border-dashed border-[var(--primary-light)] hover:border-[var(--primary)] transition-all duration-[--transition-base] flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Create New Folder
      </button>

      {/* Folder Tree - UPDATED WITH BRAND COLORS */}
      {nodes.length > 0 ? (
        <div className="mt-2">
          {nodes.map((node) => (
            <RecursiveFolder
              key={node.path}
              node={node}
              selectedFolder={selectedFolder}
              onSelectFolder={onSelectFolder}
              onCreateFolder={onCreateFolder}
              onDeleteFolder={onDeleteFolder}
              folderCounts={folderCounts}
              depth={0}
            />
          ))}
        </div>
      ) : (
        <div className="px-3 py-4 text-center text-sm text-[var(--text-secondary)]">
          <p className="mb-2">No folders yet</p>
          <p className="text-xs">Click "Create New Folder" above to start organizing your media</p>
        </div>
      )}
    </div>
  );
}