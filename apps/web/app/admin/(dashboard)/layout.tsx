// apps/web/app/admin/(dashboard)/layout.tsx
// ⚠️ UPDATED FOR RBAC MIGRATION - Phase 3 & 4

import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '../../../app/api/auth/[...nextauth]/route';
import AdminSidebar from '@/components/admin/AdminSidebar';
// import DashboardSwitcher from '@/components/shared/DashboardSwitcher';

// Simple inline version of canAccessAdmin
// In production, import from @safetyquest/shared/rbac
function canAccessAdmin(roleModel: any): boolean {
  if (!roleModel?.permissions) return false;
  return roleModel.permissions.length > 0;
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // ✅ UPDATED: Check admin access using both legacy and new RBAC
  const legacyAdmin = session?.user?.role === 'ADMIN';
  const newRbacAdmin = canAccessAdmin(session?.user?.roleModel);
  const hasAdminAccess = legacyAdmin || newRbacAdmin;

  // Redirect if user doesn't have admin access
  if (!hasAdminAccess) {
    redirect('/learn');
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <AdminSidebar session={session} />
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      
      {/* ✅ NEW: Dashboard Switcher for users with admin access. NOT USING ANYMORE*/}
      {/* <DashboardSwitcher /> */}
    </div>
  );
}