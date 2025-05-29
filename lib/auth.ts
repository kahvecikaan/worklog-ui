import { User, Role } from './types';
import { authApi } from './api';

export async function getServerUser(): Promise<User | null> {
  try {
    const user = await authApi.getCurrentUser();
    return user;
  } catch (error) {
    return null;
  }
}

export function hasRole(user: User | null, roles: Role[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}

export function canViewTeamData(user: User | null): boolean {
  return hasRole(user, ['TEAM_LEAD', 'DIRECTOR']);
}

export function canViewDepartmentData(user: User | null): boolean {
  return hasRole(user, ['DIRECTOR']);
}

export function getRoleDisplayName(role: Role): string {
  const roleMap: Record<Role, string> = {
    EMPLOYEE: 'Employee',
    TEAM_LEAD: 'Team Lead',
    DIRECTOR: 'Director',
  };
  return roleMap[role] || role;
}