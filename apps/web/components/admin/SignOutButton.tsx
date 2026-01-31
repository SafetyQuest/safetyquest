// apps/web/components/admin/SignOutButton.tsx

'use client';

import { signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="
        w-full flex items-center justify-center gap-1.5 px-3 py-2
        bg-[var(--background)] border border-[var(--border)]
        text-[var(--danger)] hover:text-[var(--danger-dark)]
        hover:bg-[var(--danger-light)] hover:border-[var(--danger)]
        rounded font-medium text-[13px]
        transition-colors duration-[--transition-base]
        hover:scale-[1.02] active:scale-[0.98]
      "
    >
      <LogOut className="w-3.5 h-3.5" />
      <span>Sign Out</span>
    </button>
  );
}