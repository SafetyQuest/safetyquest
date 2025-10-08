'use client';

import { useState } from 'react';
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Import Users from CSV</h2>

        {/* CSV Format Info */}
        <div className="bg-blue-50 p-4 rounded mb-4">
          <h3 className="font-semibold mb-2">CSV Format:</h3>
          <p className="text-sm mb-2">Required columns: <code>email, name</code></p>
          <p className="text-sm mb-2">Optional columns: <code>usertype, role, section, department, supervisor, manager, designation</code></p>
          <p className="text-sm text-gray-600">Example:</p>
          <pre className="text-xs bg-white p-2 rounded mt-1">
email,name,usertype,department,section{'\n'}
john@example.com,John Doe,contractor,Engineering,Production
          </pre>
        </div>

        {/* File Upload */}
        <div className="mb-4">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
        </div>

        {/* Preview Button */}
        {file && !preview && (
          <button
            onClick={handlePreview}
            disabled={previewMutation.isPending}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {previewMutation.isPending ? 'Validating...' : 'Preview Import'}
          </button>
        )}

        {/* Preview Results */}
        {preview && summary && (
          <>
            <div className="mb-4 p-4 bg-gray-50 rounded">
              <h3 className="font-semibold mb-2">Import Summary:</h3>
              <p className="text-sm">Total rows: {summary.total}</p>
              <p className="text-sm text-green-600">Valid: {summary.valid}</p>
              <p className="text-sm text-red-600">Invalid: {summary.invalid}</p>
            </div>

            <div className="max-h-96 overflow-y-auto mb-4">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="px-2 py-1 text-left">Row</th>
                    <th className="px-2 py-1 text-left">Email</th>
                    <th className="px-2 py-1 text-left">Name</th>
                    <th className="px-2 py-1 text-left">Status</th>
                    <th className="px-2 py-1 text-left">Errors</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row) => (
                    <tr key={row.rowNumber} className={row.status === 'valid' ? 'bg-green-50' : 'bg-red-50'}>
                      <td className="px-2 py-1">{row.rowNumber}</td>
                      <td className="px-2 py-1">{row.data.email}</td>
                      <td className="px-2 py-1">{row.data.name}</td>
                      <td className="px-2 py-1">
                        <span className={`px-2 py-1 rounded text-xs ${
                          row.status === 'valid' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-2 py-1 text-xs text-red-600">
                        {row.errors.join(', ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {summary.valid > 0 && (
              <button
                onClick={handleImport}
                disabled={importMutation.isPending}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {importMutation.isPending ? 'Importing...' : `Import ${summary.valid} Users`}
              </button>
            )}
          </>
        )}

        {/* Error Display */}
        {previewMutation.isError && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4">
            {previewMutation.error.message}
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="mt-4 text-gray-600 hover:text-gray-800"
        >
          Close
        </button>
      </div>
    </div>
  );
}