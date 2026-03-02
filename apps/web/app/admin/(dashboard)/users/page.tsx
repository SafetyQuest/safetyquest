// apps/web/app/admin/users/page.tsx

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import UsersPage from './UsersPage'; // rename your current page to UsersPage.tsx

function hasPermission(session: any, permissionName: string): boolean {
  if (!session?.user) return false;
  if (session.user.role === 'ADMIN') return true;
  if (!session.user.roleModel?.permissions) return false;
  return session.user.roleModel.permissions.some(
    (p: any) => p.name === permissionName
  );
}

export default async function UsersPageWrapper() {
  const session = await getServerSession(authOptions);
  
  const permissions = {
    canView:   hasPermission(session, 'users.view'),
    canCreate: hasPermission(session, 'users.create'),
    canEdit:   hasPermission(session, 'users.edit'),
    canDelete: hasPermission(session, 'users.delete'),
    canBulk:   hasPermission(session, 'users.bulk'),
  };

  return <UsersPage permissions={permissions} />;
}