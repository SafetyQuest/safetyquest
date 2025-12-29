// packages/shared/rbac/api-helpers.ts
// ✅ FIXED: No dependency on next-auth

import { hasPermission, canAccessAdmin, isLegacyAdmin, RoleModel } from './index';

// Define our own Session type to avoid next-auth dependency
export interface AuthSession {
  user?: {
    id?: string;
    email?: string;
    name?: string;
    role?: string;
    roleId?: string;
    roleModel?: RoleModel | null;
  };
}

export interface AuthCheckResult {
  authorized: boolean;
  reason?: string;
}

/**
 * Check if user is authenticated
 */
export function checkAuthentication(session: AuthSession | null): AuthCheckResult {
  if (!session?.user) {
    return { authorized: false, reason: 'Not authenticated' };
  }
  return { authorized: true };
}

/**
 * Check if user is authorized for an admin API route
 * Supports both legacy role and new RBAC system
 * @param session - Auth session (compatible with NextAuth Session)
 */
export function checkAdminAuth(session: AuthSession | null): AuthCheckResult {
  const authCheck = checkAuthentication(session);
  if (!authCheck.authorized) {
    return authCheck;
  }

  const legacyAdmin = isLegacyAdmin(session!.user?.role);
  const newRbacAdmin = canAccessAdmin(session!.user?.roleModel as RoleModel);

  if (!legacyAdmin && !newRbacAdmin) {
    return { authorized: false, reason: 'Insufficient permissions' };
  }

  return { authorized: true };
}

/**
 * Check if user has a specific permission for an API route
 * Also checks for legacy admin role (which has all permissions)
 * @param session - Auth session
 * @param resource - Resource name (e.g., 'users', 'programs')
 * @param action - Action type (e.g., 'view', 'create', 'edit', 'delete')
 */
export function checkPermission(
  session: AuthSession | null,
  resource: string,
  action: string
): AuthCheckResult {
  const authCheck = checkAuthentication(session);
  if (!authCheck.authorized) {
    return authCheck;
  }

  // Legacy admin has all permissions
  if (isLegacyAdmin(session!.user?.role)) {
    return { authorized: true };
  }

  // Check specific permission in new RBAC system
  const hasPerms = hasPermission(
    session!.user?.roleModel as RoleModel,
    resource,
    action
  );
  
  if (!hasPerms) {
    return { 
      authorized: false, 
      reason: `Missing permission: ${resource}.${action}` 
    };
  }

  return { authorized: true };
}

/**
 * Check if user has ANY of the specified permissions
 * Useful for routes that can be accessed with multiple permissions
 * @param session - Auth session
 * @param permissions - Array of permission checks
 */
export function checkAnyPermission(
  session: AuthSession | null,
  permissions: Array<{ resource: string; action: string }>
): AuthCheckResult {
  const authCheck = checkAuthentication(session);
  if (!authCheck.authorized) {
    return authCheck;
  }

  // Legacy admin has all permissions
  if (isLegacyAdmin(session!.user?.role)) {
    return { authorized: true };
  }

  // Check if user has any of the required permissions
  const roleModel = session!.user?.roleModel as RoleModel;
  const hasAny = permissions.some(({ resource, action }) =>
    hasPermission(roleModel, resource, action)
  );

  if (!hasAny) {
    const permList = permissions
      .map(p => `${p.resource}.${p.action}`)
      .join(' OR ');
    return {
      authorized: false,
      reason: `Missing one of these permissions: ${permList}`
    };
  }

  return { authorized: true };
}

/**
 * Check if user has ALL of the specified permissions
 * Useful for routes that require multiple permissions
 * @param session - Auth session
 * @param permissions - Array of permission checks
 */
export function checkAllPermissions(
  session: AuthSession | null,
  permissions: Array<{ resource: string; action: string }>
): AuthCheckResult {
  const authCheck = checkAuthentication(session);
  if (!authCheck.authorized) {
    return authCheck;
  }

  // Legacy admin has all permissions
  if (isLegacyAdmin(session!.user?.role)) {
    return { authorized: true };
  }

  // Check if user has all required permissions
  const roleModel = session!.user?.roleModel as RoleModel;
  const missingPermissions: string[] = [];

  for (const { resource, action } of permissions) {
    if (!hasPermission(roleModel, resource, action)) {
      missingPermissions.push(`${resource}.${action}`);
    }
  }

  if (missingPermissions.length > 0) {
    return {
      authorized: false,
      reason: `Missing permissions: ${missingPermissions.join(', ')}`
    };
  }

  return { authorized: true };
}