// apps/web/components/admin/games/ui/GameSummary.tsx
'use client';

import React from 'react';

type SummaryItem = {
  label: string;
  value: string | number;
  highlight?: boolean; // Whether to highlight this value (e.g., in blue)
  icon?: React.ReactNode; // Optional custom icon for this item
};

type GameSummaryProps = {
  title?: string;
  items: SummaryItem[];
  emptyMessage?: string;
  showEmpty?: boolean; // Whether to show empty state
  variant?: 'default' | 'compact'; // Style variant
};

export default function GameSummary({ 
  title = 'Game Summary',
  items,
  emptyMessage = '⚠️ Add game elements to calculate statistics.',
  showEmpty = false,
  variant = 'default'
}: GameSummaryProps) {
  
  // Dynamic grid layout based on item count
  const getGridCols = (count: number) => {
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-1 sm:grid-cols-2';
    if (count === 3) return 'grid-cols-1 sm:grid-cols-3';
    if (count === 4) return 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4';
    if (count === 5) return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5';
    if (count === 6) return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6';
    // For 7+ items, use a flexible grid
    return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';
  };

  const isCompact = variant === 'compact';

  return (
    <div className={`mt-6 p-4 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl shadow-sm ${
      isCompact ? 'mt-4 p-3' : ''
    }`}>
      {/* Header */}
      <div className={`flex items-center gap-2 ${isCompact ? 'mb-2' : 'mb-3'}`}>
        <svg className={`${isCompact ? 'w-4 h-4' : 'w-5 h-5'} text-gray-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h3 className={`font-semibold text-gray-800 ${isCompact ? 'text-sm' : ''}`}>{title}</h3>
      </div>

      {/* Content */}
      {showEmpty ? (
        <p className={`text-amber-600 italic ${isCompact ? 'text-xs' : 'text-sm'}`}>{emptyMessage}</p>
      ) : (
        <div className={`grid gap-4 ${isCompact ? 'gap-3 text-xs' : 'text-sm'} ${getGridCols(items.length)}`}>
          {items.map((item, index) => (
            <div key={index} className={isCompact ? 'space-y-0.5' : ''}>
              <p className="text-gray-600 flex items-center gap-1.5">
                {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                <span>{item.label}</span>
              </p>
              <p className={`font-bold ${isCompact ? 'text-base' : 'text-lg'} ${
                item.highlight ? 'text-blue-600' : 'text-gray-900'
              }`}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}