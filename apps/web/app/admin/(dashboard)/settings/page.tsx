'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to user-types tab by default
    router.replace('/admin/settings/user-types');
  }, [router]);

  return (
    <div className="text-center py-8">
      <p className="text-gray-600">Redirecting to settings...</p>
    </div>
  );
}