// packages/shared/types/index.ts
export const UserRole = {
  ADMIN: 'ADMIN',
  INSTRUCTOR: 'INSTRUCTOR',
  LEARNER: 'LEARNER'
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Validation helper
export function isValidRole(role: string): role is UserRole {
  return Object.values(UserRole).includes(role as UserRole);
}