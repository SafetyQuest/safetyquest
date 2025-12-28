// apps/web/components/shared/DashboardSwitcher.tsx
// ⚠️ NEW COMPONENT - Phase 4

'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Building2, GraduationCap } from 'lucide-react';

// Simple inline version of canAccessAdmin
// In production, import from @safetyquest/shared/rbac
function canAccessAdmin(roleModel: any): boolean {
  if (!roleModel?.permissions) return false;
  return roleModel.permissions.length > 0;
}

export default function DashboardSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  if (!session?.user) return null;

  // ✅ Check if user has admin access using both legacy and new RBAC
  const legacyAdmin = session.user.role === 'ADMIN';
  const newRbacAdmin = canAccessAdmin(session.user.roleModel);
  const hasAdminAccess = legacyAdmin || newRbacAdmin;

  // Don't show switcher if user doesn't have admin access
  if (!hasAdminAccess) return null;

  const isOnAdminDashboard = pathname?.startsWith('/admin');
  const isOnLearnerDashboard = pathname?.startsWith('/learn');

  // Don't show if not on either dashboard
  if (!isOnAdminDashboard && !isOnLearnerDashboard) return null;

  const handleSwitch = () => {
    if (isOnAdminDashboard) {
      router.push('/learn/dashboard');
    } else {
      router.push('/admin');
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={handleSwitch}
        className="flex items-center gap-2 px-4 py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-lg shadow-lg hover:bg-blue-50 transition-colors font-medium"
        title={isOnAdminDashboard ? 'Switch to My Training' : 'Switch to Admin Portal'}
        aria-label={isOnAdminDashboard ? 'Switch to My Training' : 'Switch to Admin Portal'}
      >
        {isOnAdminDashboard ? (
          <>
            <GraduationCap className="w-5 h-5" />
            <span className="hidden sm:inline">My Training</span>
          </>
        ) : (
          <>
            <Building2 className="w-5 h-5" />
            <span className="hidden sm:inline">Admin Portal</span>
          </>
        )}
      </button>
    </div>
  );
}