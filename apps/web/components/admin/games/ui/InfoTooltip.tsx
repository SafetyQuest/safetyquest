// apps/web/components/admin/games/ui/InfoTooltip.tsx
'use client';

import React from 'react';

type InfoTooltipProps = {
  title?: string;
  children: React.ReactNode;
  position?: 'left' | 'right' | 'top' | 'bottom';
  width?: 'sm' | 'md' | 'lg' | 'xl'; // Tooltip width
};

export default function InfoTooltip({ 
  title = '💡 Tips & Best Practices',
  children,
  position = 'right',
  width = 'md'
}: InfoTooltipProps) {
  
  // Width classes
  const widthClasses = {
    sm: 'w-56',
    md: 'w-72',
    lg: 'w-80',
    xl: 'w-96'
  };
  
  // Position classes for tooltip
  const positionClasses = {
    right: 'right-0 top-full mt-2',
    left: 'left-0 top-full mt-2',
    top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2'
  };
  
  // Arrow position classes
  const arrowClasses = {
    right: '-top-2 left-1/2 -translate-x-1/2 border-l-2 border-t-2',
    left: '-top-2 left-1/2 -translate-x-1/2 border-l-2 border-t-2',
    top: '-bottom-2 left-1/2 -translate-x-1/2 border-r-2 border-b-2',
    bottom: '-top-2 left-1/2 -translate-x-1/2 border-l-2 border-t-2'
  };

  return (
    <div className="flex justify-end mt-2">
      <div className="relative group inline-block">
        {/* Animated ping effect */}
        <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-75"></div>
        
        {/* Info button */}
        <button
          type="button"
          className="relative flex items-center justify-center w-9 h-9 bg-blue-500 text-white rounded-full shadow-md hover:bg-blue-600 transition-all duration-300 hover:scale-110"
          title="Tips & Instructions"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
        
        {/* Tooltip content */}
        <div className={`absolute ${positionClasses[position]} ${widthClasses[width]} bg-white border-2 border-blue-200 rounded-lg shadow-xl p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50`}>
          {/* Arrow */}
          <div className={`absolute ${arrowClasses[position]} w-4 h-4 bg-white transform rotate-45`}></div>
          
          {/* Title */}
          <p className="text-sm text-gray-700 font-medium mb-2">{title}</p>
          
          {/* Content */}
          <div className="text-xs text-gray-600">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}