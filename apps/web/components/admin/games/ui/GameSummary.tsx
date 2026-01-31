// apps/web/components/admin/games/ui/GameSummary.tsx
'use client';

import React from 'react';

type SummaryItem = {
  label: string;
  value: string | number;
  highlight?: boolean;
  icon?: React.ReactNode;
};

type GameSummaryProps = {
  title?: string;
  items: SummaryItem[];
  emptyMessage?: string;
  showEmpty?: boolean;
  variant?: 'default' | 'compact';
};

export default function GameSummary({ 
  title = 'Game Summary',
  items,
  emptyMessage = '⚠️ Add game elements to calculate statistics.',
  showEmpty = false,
  variant = 'default'
}: GameSummaryProps) {
  
  const getGridCols = (count: number) => {
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-1 sm:grid-cols-2';
    if (count === 3) return 'grid-cols-1 sm:grid-cols-3';
    if (count === 4) return 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4';
    if (count === 5) return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5';
    if (count === 6) return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6';
    return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';
  };

  const isCompact = variant === 'compact';

  return (
    <div className={`mt-6 p-5 bg-blue-50 border border-blue-200 rounded-xl shadow-sm ${
      isCompact ? 'mt-4 p-3' : ''
    }`}>
      {/* Header */}
      <div className={`flex items-center gap-2.5 ${isCompact ? 'mb-2' : 'mb-4'}`}>
        <svg className={`${isCompact ? 'w-4 h-4' : 'w-5 h-5'} text-blue-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h3 className={`font-semibold text-gray-900 ${isCompact ? 'text-sm' : 'text-lg'}`}>{title}</h3>
      </div>

      {/* Content */}
      {showEmpty ? (
        <p className={`text-amber-700 italic font-medium ${isCompact ? 'text-xs' : 'text-sm'}`}>{emptyMessage}</p>
      ) : (
        <div className={`grid gap-4 ${isCompact ? 'gap-3 text-xs' : 'text-sm'} ${getGridCols(items.length)}`}>
          {items.map((item, index) => (
            <div key={index} className={`${isCompact ? 'space-y-0.5' : 'space-y-1'} p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-400 transition-all`}>
              <p className="text-gray-600 flex items-center gap-1.5 font-medium">
                {item.icon && <span className="flex-shrink-0 text-blue-600">{item.icon}</span>}
                <span>{item.label}</span>
              </p>
              <p className={`font-bold ${isCompact ? 'text-base' : 'text-xl'} ${
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