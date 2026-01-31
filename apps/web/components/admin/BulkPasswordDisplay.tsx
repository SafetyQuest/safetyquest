"use client";

import { useState } from "react";
import { X, Copy, CheckCircle, Download, Mail } from "lucide-react";

interface BulkPasswordDisplayProps {
  users: Array<{
    email: string;
    name: string;
    temporaryPassword: string;
  }>;
  emailResults?: {
    sent: number;
    failed: number;
  };
  onClose: () => void;
}

export default function BulkPasswordDisplay({
  users,
  emailResults,
  onClose
}: BulkPasswordDisplayProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const copyToClipboard = (text: string, index?: number) => {
    navigator.clipboard.writeText(text);
    
    if (index !== undefined) {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } else {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    }
  };

  const copyAllData = () => {
    const allData = users.map(user => 
      `${user.name}\t${user.email}\t${user.temporaryPassword}`
    ).join('\n');
    
    const header = 'Name\tEmail\tTemporary Password\n';
    copyToClipboard(header + allData);
  };

  const downloadCSV = () => {
    const csvContent = [
      ['Name', 'Email', 'Temporary Password'].join(','),
      ...users.map(user => 
        [user.name, user.email, user.temporaryPassword].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user-credentials-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--background)] rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-[var(--border)]">
        {/* Header - UPDATED WITH BRAND COLORS */}
        <div className="p-6 border-b border-[var(--border)]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                Users Created Successfully! 🎉
              </h2>
              <p className="text-[var(--text-secondary)] mt-1">
                {users.length} user{users.length > 1 ? 's' : ''} imported
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--surface-hover)] rounded-full transition-colors duration-[--transition-base]"
            >
              <X className="w-6 h-6 text-[var(--text-muted)]" />
            </button>
          </div>
        </div>

        {/* Email Status Banner - UPDATED WITH BRAND COLORS */}
        {emailResults && (
          <div className={`p-4 ${emailResults.failed > 0 ? 'bg-[var(--warning-light)]' : 'bg-[var(--success-light)]'}`}>
            <div className="flex items-center">
              <Mail className={`w-5 h-5 mr-2 ${emailResults.failed > 0 ? 'text-[var(--warning-dark)]' : 'text-[var(--success-dark)]'}`} />
              <div className="text-sm">
                {emailResults.failed === 0 ? (
                  <span className="text-[var(--success-dark)]">
                    ✅ All {emailResults.sent} welcome emails sent successfully!
                  </span>
                ) : (
                  <span className="text-[var(--warning-dark)]">
                    ⚠️ {emailResults.sent} emails sent, {emailResults.failed} failed
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Warning Notice - UPDATED WITH BRAND COLORS */}
        <div className="p-4 bg-[var(--warning-light)] border-l-4 border-[var(--warning)]">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-[var(--warning-dark)]" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-[var(--warning-dark)]">
                <strong>Important:</strong> Save these passwords now. They won't be shown again!
                Users have been emailed their credentials, but you can copy or download them as backup.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons - UPDATED WITH BRAND COLORS */}
        <div className="p-4 bg-[var(--surface)] border-b border-[var(--border)] flex gap-3">
          <button
            onClick={copyAllData}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-[var(--text-inverse)] rounded-lg hover:bg-[var(--primary-dark)] transition-colors duration-[--transition-base]"
          >
            {copiedAll ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy All
              </>
            )}
          </button>
          
          <button
            onClick={downloadCSV}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--success)] text-[var(--text-inverse)] rounded-lg hover:bg-[var(--success-dark)] transition-colors duration-[--transition-base]"
          >
            <Download className="w-4 h-4" />
            Download CSV
          </button>
        </div>

        {/* User List - UPDATED WITH BRAND COLORS */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-3">
            {users.map((user, index) => (
              <div
                key={index}
                className="bg-[var(--surface)] rounded-lg p-4 border border-[var(--border)] hover:border-[var(--primary-light)] transition-colors duration-[--transition-base]"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Name */}
                  <div>
                    <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">Name</label>
                    <p className="text-sm font-medium text-[var(--text-primary)] mt-1">{user.name}</p>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">Email</label>
                    <p className="text-sm text-[var(--text-primary)] mt-1">{user.email}</p>
                  </div>

                  {/* Password with Copy Button */}
                  <div>
                    <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">
                      Temporary Password
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 text-sm font-mono bg-[var(--background)] px-3 py-2 rounded border border-[var(--border)]">
                        {user.temporaryPassword}
                      </code>
                      <button
                        onClick={() => copyToClipboard(user.temporaryPassword, index)}
                        className="p-2 hover:bg-[var(--surface-hover)] rounded transition-colors duration-[--transition-base]"
                        title="Copy password"
                      >
                        {copiedIndex === index ? (
                          <CheckCircle className="w-4 h-4 text-[var(--success)]" />
                        ) : (
                          <Copy className="w-4 h-4 text-[var(--text-muted)]" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer - UPDATED WITH BRAND COLORS */}
        <div className="p-6 bg-[var(--surface)] border-t border-[var(--border)]">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--text-secondary)]">
              Users must change their password on first login
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-[var(--primary)] text-[var(--text-inverse)] rounded-lg hover:bg-[var(--primary-dark)] transition-colors duration-[--transition-base] font-medium"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}