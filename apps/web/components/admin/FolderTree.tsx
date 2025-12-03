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

export default function FolderTree({
  nodes,
  selectedFolder,
  onSelectFolder,
  onDeleteFolder,
  onCreateFolder,
  folderCounts
}: FolderTreeProps) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
      <h3 className="font-semibold text-gray-800 mb-3">Folders</h3>
      
      <div className="space-y-1">
        <button
          onClick={() => onSelectFolder('all')}
          className={clsx(
            'w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium',
            selectedFolder === 'all' 
              ? 'bg-blue-100 text-blue-800' 
              : 'text-gray-700 hover:bg-gray-100'
          )}
        >
          All Files
        </button>
        
        <button
          onClick={() => onSelectFolder('')}
          className={clsx(
            'w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium',
            selectedFolder === '' 
              ? 'bg-blue-100 text-blue-800' 
              : 'text-gray-700 hover:bg-gray-100'
          )}
        >
          Unorganized {folderCounts[''] > 0 && <span className="text-gray-500">({folderCounts['']})</span>}
        </button>

        {nodes.map((node) => (
          <RecursiveFolder
            key={node.path}
            node={node}
            selectedFolder={selectedFolder}
            onSelectFolder={onSelectFolder}
            onDeleteFolder={onDeleteFolder}
            onCreateFolder={onCreateFolder}
            folderCounts={folderCounts}
            depth={0}
          />
        ))}
      </div>
    </div>
  );
}

function RecursiveFolder({
  node,
  selectedFolder,
  onSelectFolder,
  onDeleteFolder,
  onCreateFolder,
  folderCounts,
  depth
}: {
  node: FolderNode;
  selectedFolder: string;
  onSelectFolder: (path: string) => void;
  onDeleteFolder: (path: string) => void;
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
      <div className="flex items-center gap-2 group">
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-800"
          >
            {expanded ? '▾' : '▸'}
          </button>
        )}
        {!hasChildren && <div className="w-6" />}

        <button
          onClick={() => onSelectFolder(node.path)}
          className={clsx(
            'flex-1 text-left px-2 py-2.5 rounded-lg text-sm font-medium truncate',
            isSelected
              ? 'bg-blue-100 text-blue-800'
              : 'text-gray-700 hover:bg-gray-100'
          )}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          {node.name}
          {count > 0 && <span className="text-gray-500 ml-1">({count})</span>}
        </button>

        {/* Create Subfolder Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCreateFolder(node.path);
          }}
          className="p-1.5 text-blue-600 opacity-0 group-hover:opacity-100 hover:bg-blue-50 rounded"
          title="Create subfolder"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>

        {/* Delete Folder Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`Delete folder "${node.path}" and all its contents? This cannot be undone.`)) {
              onDeleteFolder(node.path);
            }
          }}
          className="p-1.5 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded"
          title="Delete folder"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {hasChildren && expanded && (
        <div className="ml-2 border-l-2 border-gray-100 pl-2">
          {node.children.map((child) => (
            <RecursiveFolder
              key={child.path}
              node={child}
              selectedFolder={selectedFolder}
              onSelectFolder={onSelectFolder}
              onDeleteFolder={onDeleteFolder}
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