'use client';

import { signOut } from 'next-auth/react';

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="mt-2 text-sm text-red-600 hover:text-red-800"
    >
      Sign Out
    </button>
  );
}