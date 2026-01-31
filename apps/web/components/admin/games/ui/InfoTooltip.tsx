// apps/web/components/admin/games/ui/InfoTooltip.tsx
'use client';

import React from 'react';

type InfoTooltipProps = {
  title?: string;
  children: React.ReactNode;
  position?: 'left' | 'right' | 'top' | 'bottom';
  width?: 'sm' | 'md' | 'lg' | 'xl';
};

export default function InfoTooltip({ 
  title = '💡 Tips & Best Practices',
  children,
  position = 'right',
  width = 'md'
}: InfoTooltipProps) {
  
  const widthClasses = {
    sm: 'w-56',
    md: 'w-72',
    lg: 'w-80',
    xl: 'w-96'
  };
  
  const positionClasses = {
    right: 'right-0 top-full mt-2',
    left: 'left-0 top-full mt-2',
    top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2'
  };
  
  const arrowClasses = {
    right: '-top-2 left-1/2 -translate-x-1/2 border-l-2 border-t-2',
    left: '-top-2 left-1/2 -translate-x-1/2 border-l-2 border-t-2',
    top: '-bottom-2 left-1/2 -translate-x-1/2 border-r-2 border-b-2',
    bottom: '-top-2 left-1/2 -translate-x-1/2 border-l-2 border-t-2'
  };

  return (
    <div className="flex justify-end mt-2">
      <div className="relative group inline-block">
        {/* VISIBLE GLOW EFFECT - WORKS EVERYWHERE */}
        <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-75"></div>
        
        {/* HIGH-CONTRAST BUTTON - WHITE BORDER GUARANTEES VISIBILITY */}
        <button
          type="button"
          className="relative flex items-center justify-center w-9 h-9 bg-blue-600 text-white rounded-full border-2 border-white shadow-md hover:bg-blue-700 hover:shadow-lg transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          title="Tips & Instructions"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
        
        {/* BRIGHT BLUE TOOLTIP BORDER */}
        <div className={`absolute ${positionClasses[position]} ${widthClasses[width]} bg-white border-2 border-blue-500 rounded-lg shadow-xl p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50`}>
          {/* Arrow with matching border */}
          <div className={`absolute ${arrowClasses[position]} w-4 h-4 bg-white border-blue-500 transform rotate-45`}></div>
          
          {/* Title with blue icon */}
          <p className="text-sm text-gray-900 font-semibold mb-2 flex items-center gap-1.5">
            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            {title}
          </p>
          
          {/* Content */}
          <div className="text-sm text-gray-600 leading-relaxed">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}