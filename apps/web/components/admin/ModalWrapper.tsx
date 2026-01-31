'use client';

import { useState, useEffect } from 'react';

type ModalWrapperProps = {
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  hasUnsavedChanges?: boolean;        // Enable unsaved changes protection
  closeOnBackgroundClick?: boolean;   // Default: true
  closeOnEscape?: boolean;            // Default: true
  confirmMessage?: string;            // Custom message for confirmation
  showCloseButton?: boolean;          // Show × button (default: true)
  showFooter?: boolean;               // Show footer with buttons (default: false)
  onConfirmClose?: () => void;        // Custom handler for confirmed close
};

export function ModalWrapper({
  onClose,
  children,
  title,
  hasUnsavedChanges = false,
  closeOnBackgroundClick = true,
  closeOnEscape = true,
  confirmMessage = 'You have unsaved changes. Are you sure you want to leave without saving?',
  showCloseButton = true,
  showFooter = false,
  onConfirmClose,
}: ModalWrapperProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const requestClose = () => {
    if (!hasUnsavedChanges) {
      onClose();
      return;
    }
    
    setShowConfirmDialog(true);
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (closeOnBackgroundClick && e.target === e.currentTarget) {
      requestClose();
    }
  };

  // Escape key handler
  useEffect(() => {
    if (!closeOnEscape) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        requestClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [closeOnEscape, hasUnsavedChanges]);

  return (
    <>
      {/* Main Modal */}
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={handleBackgroundClick}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        ref={(node) => node?.focus()}
      >
        <div
          className="bg-[var(--background)] rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-[var(--border)] relative"
          onClick={(e) => e.stopPropagation()} // Prevent inside clicks from closing
        >
          {/* Close Button */}
          {showCloseButton && (
            <button
              onClick={requestClose}
              className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)] text-2xl leading-none transition-colors duration-[--transition-base]"
              title="Close (ESC)"
            >
              ×
            </button>
          )}

          {/* Title */}
          {title && (
            <div className="px-6 py-4 border-b border-[var(--border)]">
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">{title}</h2>
            </div>
          )}

          {/* Content */}
          <div className={title ? 'p-6' : ''}>
            {children}
          </div>

          {/* Footer */}
          {showFooter && (
            <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
              <button
                onClick={requestClose}
                className="bg-[var(--surface)] text-[var(--text-primary)] px-6 py-2 rounded-md hover:bg-[var(--surface-hover)] transition-colors duration-[--transition-base]"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[99999] p-4">
          <div className="bg-[var(--background)] rounded-xl p-8 max-w-md w-full border border-[var(--border)] animate-in fade-in zoom-in-95">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--danger-light)]">
                <svg className="h-7 w-7 text-[var(--danger-dark)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[var(--text-primary)]">Unsaved Changes</h3>
            </div>

            <p className="mb-8 text-[var(--text-secondary)]">
              {confirmMessage}
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="rounded-lg border border-[var(--border)] px-5 py-2.5 text-[var(--text-primary)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-colors duration-[--transition-base]"
              >
                Stay
              </button>
              <button
                onClick={() => {
                  setShowConfirmDialog(false);
                  if (onConfirmClose) {
                    onConfirmClose();
                  } else {
                    onClose();
                  }
                }}
                className="rounded-lg bg-[var(--danger)] px-6 py-2.5 font-medium text-[var(--text-inverse)] hover:bg-[var(--danger-dark)] transition-colors duration-[--transition-base]"
              >
                Leave without Saving
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}