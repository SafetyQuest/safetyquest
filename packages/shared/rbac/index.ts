// packages/shared/rbac/index.ts

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
}

export interface RoleModel {
  id: string;
  name: string;
  slug: string;
  permissions: Permission[];
}

// ✅ Define learner-only permissions (these don't grant admin access)
const LEARNER_ONLY_PERMISSIONS = [
  'programs.view',
  'courses.view',
  'lessons.view',
  'quizzes.view',
  'badges.view'
];

/**
 * Check if user has a specific permission
 * @param roleModel - The user's role model with permissions
 * @param resource - Resource name (e.g., 'users', 'programs')
 * @param action - Action type (e.g., 'view', 'create', 'edit', 'delete')
 */
export function hasPermission(
  roleModel: RoleModel | null | undefined,
  resource: string,
  action: string
): boolean {
  if (!roleModel?.permissions) return false;
  
  return roleModel.permissions.some(
    p => p.resource === resource && p.action === action
  );
}

/**
 * Check if user has ANY of the specified permissions
 * @param roleModel - The user's role model
 * @param permissions - Array of permission checks to perform
 */
export function hasAnyPermission(
  roleModel: RoleModel | null | undefined,
  permissions: Array<{ resource: string; action: string }>
): boolean {
  if (!roleModel?.permissions) return false;
  
  return permissions.some(({ resource, action }) =>
    hasPermission(roleModel, resource, action)
  );
}

/**
 * Check if user has ALL of the specified permissions
 * @param roleModel - The user's role model
 * @param permissions - Array of permission checks to perform
 */
export function hasAllPermissions(
  roleModel: RoleModel | null | undefined,
  permissions: Array<{ resource: string; action: string }>
): boolean {
  if (!roleModel?.permissions) return false;
  
  return permissions.every(({ resource, action }) =>
    hasPermission(roleModel, resource, action)
  );
}

/**
 * ✅ UPDATED: Check if user can access admin dashboard
 * Returns true if user has ANY permission BEYOND the learner-only permissions
 * @param roleModel - The user's role model
 */
export function canAccessAdmin(roleModel: RoleModel | null | undefined): boolean {
  if (!roleModel?.permissions || roleModel.permissions.length === 0) {
    return false;
  }
  
  // Get user's permission names
  const userPermissions = roleModel.permissions.map(p => p.name);
  
  // Check if user has ANY permission that's NOT in the learner-only list
  const hasNonLearnerPermission = userPermissions.some(
    perm => !LEARNER_ONLY_PERMISSIONS.includes(perm)
  );
  
  return hasNonLearnerPermission;
}

/**
 * Check if user has a specific role slug
 * Useful for backward compatible role checks
 * @param roleModel - The user's role model
 * @param slug - Role slug to check (e.g., 'admin', 'instructor')
 */
export function hasRoleSlug(
  roleModel: RoleModel | null | undefined,
  slug: string
): boolean {
  return roleModel?.slug === slug;
}

/**
 * Check if user is legacy ADMIN (for backward compatibility during migration)
 * @param legacyRole - The legacy role string field
 */
export function isLegacyAdmin(legacyRole: string | null | undefined): boolean {
  return legacyRole === 'ADMIN';
}

/**
 * Comprehensive admin check - supports both legacy and new system
 * This should be used during the migration period
 * @param legacyRole - The legacy role string
 * @param roleModel - The new RBAC role model
 */
export function isAdmin(
  legacyRole: string | null | undefined,
  roleModel: RoleModel | null | undefined
): boolean {
  // During migration, support both:
  // 1. Legacy role === 'ADMIN'
  // 2. New RBAC with any non-learner permission
  return isLegacyAdmin(legacyRole) || canAccessAdmin(roleModel);
}

/**
 * Get all permissions for a specific resource
 * @param roleModel - The user's role model
 * @param resource - Resource name to filter by
 */
export function getResourcePermissions(
  roleModel: RoleModel | null | undefined,
  resource: string
): Permission[] {
  if (!roleModel?.permissions) return [];
  
  return roleModel.permissions.filter(p => p.resource === resource);
}

/**
 * Get list of actions user can perform on a resource
 * @param roleModel - The user's role model
 * @param resource - Resource name
 */
export function getResourceActions(
  roleModel: RoleModel | null | undefined,
  resource: string
): string[] {
  const permissions = getResourcePermissions(roleModel, resource);
  return permissions.map(p => p.action);
}

/**
 * Check if user can perform any action on a resource
 * Useful for showing/hiding entire resource sections
 * @param roleModel - The user's role model
 * @param resource - Resource name
 */
export function canAccessResource(
  roleModel: RoleModel | null | undefined,
  resource: string
): boolean {
  const permissions = getResourcePermissions(roleModel, resource);
  return permissions.length > 0;
}