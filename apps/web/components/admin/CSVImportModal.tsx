'use client';

import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';

type ImportPreview = {
  rowNumber: number;
  data: any;
  status: 'valid' | 'invalid';
  errors: string[];
};

export function CSVImportModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview[] | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [showAllColumns, setShowAllColumns] = useState(false);

  // Keyboard shortcuts (LOGIC PRESERVED)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && file && !preview) {
        handlePreview();
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [file, preview, onClose]);

  const previewMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('preview', 'true');

      const res = await fetch('/api/admin/users/import', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }

      return res.json();
    },
    onSuccess: (data) => {
      setPreview(data.preview);
      setSummary(data.summary);
    }
  });

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('preview', 'false');

      const res = await fetch('/api/admin/users/import', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }

      return res.json();
    },
    onSuccess: (data) => {
      alert(`Import complete! Created: ${data.created}, Failed: ${data.failed}`);
      onSuccess();
      onClose();
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(null);
      setSummary(null);
    }
  };

  const handlePreview = () => {
    if (file) {
      previewMutation.mutate(file);
    }
  };

  const handleImport = () => {
    if (file && confirm(`Import ${summary.valid} valid users?`)) {
      importMutation.mutate(file);
    }
  };

  const downloadTemplate = () => {
    const template = `email,name,role,usertype,department,section,designation,supervisor,manager
example@company.com,John Doe,learner,new-hire,Engineering,Production,Operator,Jane Smith,Bob Johnson`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'safetyquest_user_import_template.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadFailedRows = () => {
    if (!importMutation.data?.errors) return;
    
    const failedRows = importMutation.data.errors.map((err: any) => ({
      row: err.row,
      email: err.email,
      errors: err.errors.join('; ')
    }));
    
    const csv = [
      'Row,Email,Errors',
      ...failedRows.map((r: any) => `${r.row},${r.email},"${r.errors}"`)
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'failed_imports.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--background)] rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-[var(--border)]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Import Users from CSV</h2>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-2xl leading-none transition-colors duration-[--transition-base]"
            title="Close (ESC)"
          >
            ×
          </button>
        </div>

        {/* CSV Format Info - UPDATED WITH BRAND COLORS */}
        <div className="bg-[var(--primary-surface)] p-4 rounded mb-4 border border-[var(--primary-light)]">
          <h3 className="font-semibold mb-3 flex items-center gap-2 text-[var(--primary-dark)]">
            <span>📋</span>
            <span>CSV Format Guide</span>
          </h3>
          
          <div className="space-y-3 text-sm">
            {/* Required Fields */}
            <div>
              <p className="font-medium text-[var(--primary-dark)] mb-1">Required columns:</p>
              <div className="bg-[var(--background)] p-2 rounded border border-[var(--primary-light)]">
                <code className="text-[var(--primary)]">email, name</code>
              </div>
            </div>
            
            {/* Optional Fields */}
            <div>
              <p className="font-medium text-[var(--primary-dark)] mb-1">Optional columns:</p>
              <div className="bg-[var(--background)] p-2 rounded border border-[var(--primary-light)] space-y-1">
                <div><code className="text-[var(--text-primary)]">role</code> <span className="text-[var(--text-secondary)]">- Must match existing role slug (e.g., "learner", "instructor")</span></div>
                <div><code className="text-[var(--text-primary)]">usertype</code> <span className="text-[var(--text-secondary)]">- Must match existing user type slug (e.g., "new-hire")</span></div>
                <div><code className="text-[var(--text-primary)]">department, section, designation</code> <span className="text-[var(--text-secondary)]">- Free text fields</span></div>
                <div><code className="text-[var(--text-primary)]">supervisor, manager</code> <span className="text-[var(--text-secondary)]">- Free text fields</span></div>
              </div>
            </div>

            {/* Download Template */}
            <div className="pt-2 border-t border-[var(--primary-light)]">
              <button
                onClick={downloadTemplate}
                className="text-sm text-[var(--primary)] hover:text-[var(--primary-dark)] font-medium flex items-center gap-1 transition-colors duration-[--transition-base]"
              >
                <span>⬇️</span>
                <span>Download CSV Template</span>
              </button>
            </div>

            {/* Example */}
            <div>
              <p className="font-medium text-[var(--primary-dark)] mb-1">Example:</p>
              <pre className="text-xs bg-[var(--background)] p-2 rounded border border-[var(--primary-light)] overflow-x-auto font-mono">
email,name,role,usertype,department,section{'\n'}
john@example.com,John Doe,learner,new-hire,Engineering,Production{'\n'}
mary@example.com,Mary Johnson,instructor,permanent,Safety,Training
              </pre>
            </div>
          </div>
        </div>

        {/* File Upload - UPDATED WITH BRAND COLORS */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Select CSV File</label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-[var(--text-muted)]
              file:mr-4 file:py-2 file:px-4
              file:rounded file:border-0
              file:text-sm file:font-semibold
              file:bg-[var(--primary-surface)] file:text-[var(--primary-dark)]
              hover:file:bg-[var(--primary-light)] file:hover:text-[var(--text-inverse)]
              cursor-pointer"
          />
        </div>

        {/* File Info - UPDATED WITH BRAND COLORS */}
        {file && (
          <div className="mb-4 p-3 bg-[var(--surface)] rounded border border-[var(--border)] text-sm">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-[var(--text-primary)]">File:</span> <span className="text-[var(--text-primary)]">{file.name}</span>
              </div>
              <div className="text-[var(--text-muted)]">
                {(file.size / 1024).toFixed(1)} KB
              </div>
            </div>
            {file.size > 1024 * 1024 && (
              <div className="mt-2 text-[var(--warning-dark)] text-xs flex items-center gap-1">
                <span>⚠️</span>
                <span>Large file detected. Processing may take longer.</span>
              </div>
            )}
          </div>
        )}

        {/* Preview Button - UPDATED WITH BRAND COLORS */}
        {file && !preview && (
          <button
            onClick={handlePreview}
            disabled={previewMutation.isPending}
            className="bg-[var(--primary)] text-[var(--text-inverse)] px-6 py-2 rounded-md hover:bg-[var(--primary-dark)] disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors duration-[--transition-base]"
          >
            {previewMutation.isPending ? 'Validating...' : 'Preview Import'}
          </button>
        )}

        {/* Loading State - UPDATED WITH BRAND COLORS */}
        {previewMutation.isPending && (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]"></div>
            <div className="text-center">
              <p className="font-medium text-[var(--text-primary)]">Validating CSV...</p>
              <p className="text-sm text-[var(--text-secondary)]">This may take a moment for large files</p>
            </div>
          </div>
        )}

        {/* Preview Results - UPDATED WITH BRAND COLORS */}
        {preview && summary && (
          <>
            {/* Summary */}
            <div className="mb-4 p-4 bg-[var(--surface)] rounded border border-[var(--border)]">
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">Import Summary:</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-[var(--text-secondary)]">Total rows:</span>
                  <span className="ml-2 font-medium text-[var(--text-primary)]">{summary.total}</span>
                </div>
                <div>
                  <span className="text-[var(--success-dark)]">✓ Valid:</span>
                  <span className="ml-2 font-medium text-[var(--success)]">{summary.valid}</span>
                </div>
                <div>
                  <span className="text-[var(--danger-dark)]">✗ Invalid:</span>
                  <span className="ml-2 font-medium text-[var(--danger)]">{summary.invalid}</span>
                </div>
              </div>
            </div>

            {/* Column Toggle - UPDATED WITH BRAND COLORS */}
            <div className="mb-2 flex justify-between items-center">
              <button
                onClick={() => setShowAllColumns(!showAllColumns)}
                className="text-sm text-[var(--primary)] hover:text-[var(--primary-dark)] font-medium transition-colors duration-[--transition-base]"
              >
                {showAllColumns ? '📋 Show Essential Columns' : '📋 Show All Columns'}
              </button>
              <span className="text-xs text-[var(--text-muted)]">
                Showing {preview.length} rows
              </span>
            </div>

            {/* Preview Table - UPDATED WITH BRAND COLORS */}
            <div className="max-h-96 overflow-y-auto mb-4 border border-[var(--border)] rounded">
              <table className="w-full text-sm">
                <thead className="bg-[var(--surface)] sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-[var(--text-primary)] border-b border-[var(--border)]">Row</th>
                    <th className="px-3 py-2 text-left font-semibold text-[var(--text-primary)] border-b border-[var(--border)]">Email</th>
                    <th className="px-3 py-2 text-left font-semibold text-[var(--text-primary)] border-b border-[var(--border)]">Name</th>
                    {showAllColumns && (
                      <>
                        <th className="px-3 py-2 text-left font-semibold text-[var(--text-primary)] border-b border-[var(--border)]">Role</th>
                        <th className="px-3 py-2 text-left font-semibold text-[var(--text-primary)] border-b border-[var(--border)]">User Type</th>
                        <th className="px-3 py-2 text-left font-semibold text-[var(--text-primary)] border-b border-[var(--border)]">Department</th>
                      </>
                    )}
                    <th className="px-3 py-2 text-left font-semibold text-[var(--text-primary)] border-b border-[var(--border)]">Status</th>
                    <th className="px-3 py-2 text-left font-semibold text-[var(--text-primary)] border-b border-[var(--border)]">Issues</th>
                  </tr>
                </thead>
                <tbody className="bg-[var(--background)]">
                  {preview.map((row) => (
                    <tr 
                      key={row.rowNumber} 
                      className={row.status === 'valid' ? 'hover:bg-[var(--success-light)]' : 'hover:bg-[var(--danger-light)]'}
                    >
                      <td className="px-3 py-2 border-b border-[var(--border)] text-[var(--text-muted)]">{row.rowNumber}</td>
                      <td className="px-3 py-2 border-b border-[var(--border)] font-mono text-xs text-[var(--text-primary)]">{row.data.email}</td>
                      <td className="px-3 py-2 border-b border-[var(--border)] text-[var(--text-primary)]">{row.data.name}</td>
                      {showAllColumns && (
                        <>
                          <td className="px-3 py-2 border-b border-[var(--border)] text-[var(--text-primary)]">{row.data.role || '—'}</td>
                          <td className="px-3 py-2 border-b border-[var(--border)] text-[var(--text-primary)]">{row.data.usertype || '—'}</td>
                          <td className="px-3 py-2 border-b border-[var(--border)] text-[var(--text-primary)]">{row.data.department || '—'}</td>
                        </>
                      )}
                      <td className="px-3 py-2 border-b border-[var(--border)]">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          row.status === 'valid' 
                            ? 'bg-[var(--success-light)] text-[var(--success-dark)]' 
                            : 'bg-[var(--danger-light)] text-[var(--danger-dark)]'
                        }`}>
                          {row.status === 'valid' ? '✓ Valid' : '✗ Invalid'}
                        </span>
                      </td>
                      <td className="px-3 py-2 border-b border-[var(--border)]">
                        {row.errors.length > 0 ? (
                          <div className="space-y-1">
                            {row.errors.map((error, idx) => (
                              <div key={idx} className="text-xs text-[var(--danger-dark)] flex items-start gap-1">
                                <span className="text-[var(--danger)] mt-0.5">•</span>
                                <span>{error}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-[var(--text-muted)]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Warning Before Import - UPDATED WITH BRAND COLORS */}
            {summary.valid > 0 && (
              <div className="bg-[var(--warning-light)] border border-[var(--warning)] p-4 rounded mb-4">
                <div className="flex gap-3">
                  <span className="text-[var(--warning-dark)] text-xl">⚠️</span>
                  <div className="text-sm flex-1">
                    <p className="font-medium text-[var(--warning-dark)] mb-2">Before importing:</p>
                    <ul className="list-disc list-inside text-[var(--warning-dark)] space-y-1">
                      <li>Users will be created with random temporary passwords</li>
                      <li>Invitation emails will be sent (if email is configured)</li>
                      <li>Programs will be auto-assigned based on user type</li>
                      <li>This action cannot be undone</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Import Button - UPDATED WITH BRAND COLORS */}
            {summary.valid > 0 && (
              <button
                onClick={handleImport}
                disabled={importMutation.isPending}
                className="bg-[var(--success)] text-[var(--text-inverse)] px-6 py-2 rounded-md hover:bg-[var(--success-dark)] disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors duration-[--transition-base]"
              >
                {importMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[var(--text-inverse)]"></div>
                    <span>Importing...</span>
                  </span>
                ) : (
                  `✓ Import ${summary.valid} Valid User${summary.valid !== 1 ? 's' : ''}`
                )}
              </button>
            )}
          </>
        )}

        {/* Error Display - UPDATED WITH BRAND COLORS */}
        {previewMutation.isError && (
          <div className="bg-[var(--danger-light)] border border-[var(--danger-light)] text-[var(--danger-dark)] p-4 rounded mb-4">
            <div className="flex gap-2">
              <span className="text-[var(--danger)] font-bold">✗</span>
              <div>
                <p className="font-medium">Import Failed</p>
                <p className="text-sm mt-1">{previewMutation.error.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Failed Rows Download - UPDATED WITH BRAND COLORS */}
        {importMutation.isSuccess && importMutation.data.failed > 0 && (
          <div className="mb-4 p-3 bg-[var(--danger-light)] border border-[var(--danger-light)] rounded">
            <p className="text-sm text-[var(--danger-dark)] mb-2">
              {importMutation.data.failed} row(s) failed to import.
            </p>
            <button
              onClick={downloadFailedRows}
              className="text-sm text-[var(--danger)] hover:text-[var(--danger-dark)] font-medium underline flex items-center gap-1 transition-colors duration-[--transition-base]"
            >
              <span>⬇️</span>
              <span>Download Failed Rows CSV</span>
            </button>
          </div>
        )}

        {/* Close Button - UPDATED WITH BRAND COLORS */}
        <div className="mt-6 pt-4 border-t border-[var(--border)]">
          <button
            onClick={onClose}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium transition-colors duration-[--transition-base]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}