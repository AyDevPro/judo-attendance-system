// Utilitaires d'authentification côté serveur
export type Role = "ADMIN" | "BUREAU" | "TEACHER";

export interface ServerUser {
  id: string;
  role?: Role;
  blocked?: boolean;
}

// Vérifier si un utilisateur a un rôle spécifique (version serveur)
export function hasRole(user: ServerUser | undefined | null, roles: Role | Role[]): boolean {
  if (!user?.role) return false;
  
  const rolesArray = Array.isArray(roles) ? roles : [roles];
  return rolesArray.includes(user.role);
}

// Vérifier si un utilisateur est admin
export function isAdmin(user: ServerUser | undefined | null): boolean {
  return hasRole(user, "ADMIN");
}

// Vérifier si un utilisateur est bureau ou admin
export function canManageLicensees(user: ServerUser | undefined | null): boolean {
  return hasRole(user, ["ADMIN", "BUREAU"]);
}

// Vérifier si un utilisateur est enseignant, bureau ou admin
export function canAccessCourses(user: ServerUser | undefined | null): boolean {
  return hasRole(user, ["ADMIN", "BUREAU", "TEACHER"]);
}