// apps/web/types/next-auth.d.ts
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
    role: string;
    roleId?: string;
    roleModel?: SessionRoleModel | null;
    mustChangePassword?: boolean;  // 🆕 PASSWORD TRACKING
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      roleId?: string;
      roleModel?: SessionRoleModel | null;
      mustChangePassword?: boolean;  // 🆕 PASSWORD TRACKING
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    roleId?: string;
    roleModel?: SessionRoleModel | null;
    mustChangePassword?: boolean;  // 🆕 PASSWORD TRACKING
  }
}