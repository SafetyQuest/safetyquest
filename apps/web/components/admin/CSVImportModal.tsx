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

  // Keyboard shortcuts
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
      <div className="bg-white rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Import Users from CSV</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            title="Close (ESC)"
          >
            ×
          </button>
        </div>

        {/* CSV Format Info - IMPROVED */}
        <div className="bg-blue-50 p-4 rounded mb-4 border border-blue-200">
          <h3 className="font-semibold mb-3 flex items-center gap-2 text-blue-900">
            <span>📋</span>
            <span>CSV Format Guide</span>
          </h3>
          
          <div className="space-y-3 text-sm">
            {/* Required Fields */}
            <div>
              <p className="font-medium text-blue-900 mb-1">Required columns:</p>
              <div className="bg-white p-2 rounded border border-blue-200">
                <code className="text-blue-700">email, name</code>
              </div>
            </div>
            
            {/* Optional Fields */}
            <div>
              <p className="font-medium text-blue-900 mb-1">Optional columns:</p>
              <div className="bg-white p-2 rounded border border-blue-200 space-y-1">
                <div><code className="text-gray-700">role</code> <span className="text-gray-600">- Must match existing role slug (e.g., "learner", "instructor")</span></div>
                <div><code className="text-gray-700">usertype</code> <span className="text-gray-600">- Must match existing user type slug (e.g., "new-hire")</span></div>
                <div><code className="text-gray-700">department, section, designation</code> <span className="text-gray-600">- Free text fields</span></div>
                <div><code className="text-gray-700">supervisor, manager</code> <span className="text-gray-600">- Free text fields</span></div>
              </div>
            </div>

            {/* Download Template */}
            <div className="pt-2 border-t border-blue-200">
              <button
                onClick={downloadTemplate}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
              >
                <span>⬇️</span>
                <span>Download CSV Template</span>
              </button>
            </div>

            {/* Example */}
            <div>
              <p className="font-medium text-blue-900 mb-1">Example:</p>
              <pre className="text-xs bg-white p-2 rounded border border-blue-200 overflow-x-auto font-mono">
email,name,role,usertype,department,section{'\n'}
john@example.com,John Doe,learner,new-hire,Engineering,Production{'\n'}
mary@example.com,Mary Johnson,instructor,permanent,Safety,Training
              </pre>
            </div>
          </div>
        </div>

        {/* File Upload */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Select CSV File</label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100 cursor-pointer"
          />
        </div>

        {/* File Info - NEW */}
        {file && (
          <div className="mb-4 p-3 bg-gray-50 rounded border text-sm">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">File:</span> {file.name}
              </div>
              <div className="text-gray-600">
                {(file.size / 1024).toFixed(1)} KB
              </div>
            </div>
            {file.size > 1024 * 1024 && (
              <div className="mt-2 text-yellow-600 text-xs flex items-center gap-1">
                <span>⚠️</span>
                <span>Large file detected. Processing may take longer.</span>
              </div>
            )}
          </div>
        )}

        {/* Preview Button */}
        {file && !preview && (
          <button
            onClick={handlePreview}
            disabled={previewMutation.isPending}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {previewMutation.isPending ? 'Validating...' : 'Preview Import'}
          </button>
        )}

        {/* Loading State - IMPROVED */}
        {previewMutation.isPending && (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <div className="text-center">
              <p className="font-medium text-gray-700">Validating CSV...</p>
              <p className="text-sm text-gray-500">This may take a moment for large files</p>
            </div>
          </div>
        )}

        {/* Preview Results */}
        {preview && summary && (
          <>
            {/* Summary */}
            <div className="mb-4 p-4 bg-gray-50 rounded border">
              <h3 className="font-semibold mb-2">Import Summary:</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total rows:</span>
                  <span className="ml-2 font-medium">{summary.total}</span>
                </div>
                <div>
                  <span className="text-green-600">✓ Valid:</span>
                  <span className="ml-2 font-medium text-green-700">{summary.valid}</span>
                </div>
                <div>
                  <span className="text-red-600">✗ Invalid:</span>
                  <span className="ml-2 font-medium text-red-700">{summary.invalid}</span>
                </div>
              </div>
            </div>

            {/* Column Toggle - NEW */}
            <div className="mb-2 flex justify-between items-center">
              <button
                onClick={() => setShowAllColumns(!showAllColumns)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                {showAllColumns ? '📋 Show Essential Columns' : '📋 Show All Columns'}
              </button>
              <span className="text-xs text-gray-500">
                Showing {preview.length} rows
              </span>
            </div>

            {/* Preview Table - IMPROVED */}
            <div className="max-h-96 overflow-y-auto mb-4 border rounded">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold border-b">Row</th>
                    <th className="px-3 py-2 text-left font-semibold border-b">Email</th>
                    <th className="px-3 py-2 text-left font-semibold border-b">Name</th>
                    {showAllColumns && (
                      <>
                        <th className="px-3 py-2 text-left font-semibold border-b">Role</th>
                        <th className="px-3 py-2 text-left font-semibold border-b">User Type</th>
                        <th className="px-3 py-2 text-left font-semibold border-b">Department</th>
                      </>
                    )}
                    <th className="px-3 py-2 text-left font-semibold border-b">Status</th>
                    <th className="px-3 py-2 text-left font-semibold border-b">Issues</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {preview.map((row) => (
                    <tr 
                      key={row.rowNumber} 
                      className={row.status === 'valid' ? 'hover:bg-green-50' : 'hover:bg-red-50'}
                    >
                      <td className="px-3 py-2 border-b text-gray-600">{row.rowNumber}</td>
                      <td className="px-3 py-2 border-b font-mono text-xs">{row.data.email}</td>
                      <td className="px-3 py-2 border-b">{row.data.name}</td>
                      {showAllColumns && (
                        <>
                          <td className="px-3 py-2 border-b">{row.data.role || '—'}</td>
                          <td className="px-3 py-2 border-b">{row.data.usertype || '—'}</td>
                          <td className="px-3 py-2 border-b">{row.data.department || '—'}</td>
                        </>
                      )}
                      <td className="px-3 py-2 border-b">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          row.status === 'valid' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {row.status === 'valid' ? '✓ Valid' : '✗ Invalid'}
                        </span>
                      </td>
                      <td className="px-3 py-2 border-b">
                        {row.errors.length > 0 ? (
                          <div className="space-y-1">
                            {row.errors.map((error, idx) => (
                              <div key={idx} className="text-xs text-red-600 flex items-start gap-1">
                                <span className="text-red-500 mt-0.5">•</span>
                                <span>{error}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Warning Before Import - NEW */}
            {summary.valid > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded mb-4">
                <div className="flex gap-3">
                  <span className="text-yellow-600 text-xl">⚠️</span>
                  <div className="text-sm flex-1">
                    <p className="font-medium text-yellow-900 mb-2">Before importing:</p>
                    <ul className="list-disc list-inside text-yellow-800 space-y-1">
                      <li>Users will be created with random temporary passwords</li>
                      <li>Invitation emails will be sent (if email is configured)</li>
                      <li>Programs will be auto-assigned based on user type</li>
                      <li>This action cannot be undone</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Import Button */}
            {summary.valid > 0 && (
              <button
                onClick={handleImport}
                disabled={importMutation.isPending}
                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {importMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Importing...</span>
                  </span>
                ) : (
                  `✓ Import ${summary.valid} Valid User${summary.valid !== 1 ? 's' : ''}`
                )}
              </button>
            )}
          </>
        )}

        {/* Error Display */}
        {previewMutation.isError && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded mb-4">
            <div className="flex gap-2">
              <span className="text-red-500 font-bold">✗</span>
              <div>
                <p className="font-medium">Import Failed</p>
                <p className="text-sm mt-1">{previewMutation.error.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Failed Rows Download - NEW */}
        {importMutation.isSuccess && importMutation.data.failed > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-sm text-red-800 mb-2">
              {importMutation.data.failed} row(s) failed to import.
            </p>
            <button
              onClick={downloadFailedRows}
              className="text-sm text-red-600 hover:text-red-800 font-medium underline flex items-center gap-1"
            >
              <span>⬇️</span>
              <span>Download Failed Rows CSV</span>
            </button>
          </div>
        )}

        {/* Close Button */}
        <div className="mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}