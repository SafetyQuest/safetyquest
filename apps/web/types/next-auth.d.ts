// apps/web/types/next-auth.d.ts
// ⚠️ UPDATED FOR RBAC MIGRATION - Phase 1

import 'next-auth';

// Define Permission type for session
interface SessionPermission {
  id: string;
  name: string;
  resource: string;
  action: string;
}

// Define RoleModel type for session
interface SessionRoleModel {
  id: string;
  name: string;
  slug: string;
  permissions: SessionPermission[];
}

declare module 'next-auth' {
  interface User {
    id: string;
    role: string; // ⚠️ Legacy field - kept for backward compatibility
    roleId?: string;
    roleModel?: SessionRoleModel | null;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string; // ⚠️ Legacy field - kept for backward compatibility
      roleId?: string;
      roleModel?: SessionRoleModel | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string; // ⚠️ Legacy field - kept for backward compatibility
    roleId?: string;
    roleModel?: SessionRoleModel | null;
  }
}