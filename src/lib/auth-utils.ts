"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";

export type Role = "ADMIN" | "BUREAU" | "TEACHER" | "PENDING";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role?: Role;
  blocked?: boolean;
}

// Hook principal pour l'authentification avec protection de rôles
export function useAuth(requiredRoles?: Role[]) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [fullUser, setFullUser] = useState<AuthUser | null>(null);
  const [userLoading, setUserLoading] = useState(false);
  const [lastFetch, setLastFetch] = useState<number>(0);

  const baseUser = session?.user;
  const isAuthenticated = !!session && !!baseUser;

  // Reset user data when session changes
  useEffect(() => {
    if (!isAuthenticated && fullUser) {
      setFullUser(null);
    }
  }, [isAuthenticated, fullUser]);

  // Fonction pour forcer le rafraîchissement des données utilisateur
  const refreshUserData = () => {
    setFullUser(null);
    setLastFetch(0);
  };

  // Récupérer les données complètes de l'utilisateur depuis la base de données
  useEffect(() => {
    if (isAuthenticated && baseUser && !fullUser && !userLoading) {
      setUserLoading(true);
      fetch(`/api/user/me`)
        .then(res => res.json())
        .then(userData => {
          setFullUser({
            id: userData.id,
            email: userData.email,
            name: userData.name || baseUser.name,
            role: userData.role,
            blocked: userData.blocked
          });
          setLastFetch(Date.now());
        })
        .catch(error => {
          console.error('Error fetching user data:', error);
          // Fallback vers les données de session
          setFullUser({
            id: baseUser.id,
            email: baseUser.email,
            name: baseUser.name,
            role: undefined,
            blocked: false
          });
          setLastFetch(Date.now());
        })
        .finally(() => setUserLoading(false));
    }
  }, [isAuthenticated, baseUser, fullUser, userLoading]);

  const user = fullUser;
  const hasRequiredRole = !requiredRoles || (user?.role && requiredRoles.includes(user.role));
  const loading = isPending || (isAuthenticated && !user);

  useEffect(() => {
    if (!loading && user) {
      if (!isAuthenticated) {
        router.replace("/sign-in");
        return;
      }

      // Vérifier si l'utilisateur est bloqué
      if (user.blocked) {
        // Déconnecter l'utilisateur bloqué
        import("@/lib/auth-client").then(({ signOut }) => {
          signOut().then(() => {
            router.replace("/sign-in?blocked=true");
          });
        });
        return;
      }

      // Rediriger les utilisateurs PENDING vers la page d'attente
      if (user.role === "PENDING" && window.location.pathname !== "/pending") {
        router.replace("/pending");
        return;
      }
      
      if (requiredRoles && !hasRequiredRole) {
        router.replace("/dashboard"); // Rediriger vers dashboard si pas les droits
        return;
      }
    }
  }, [isAuthenticated, hasRequiredRole, loading, user, router, requiredRoles]);

  return {
    user,
    isAuthenticated,
    isPending: loading,
    hasRequiredRole,
    session,
    refreshUserData
  };
}

// Hook pour rediriger si déjà authentifié (pour sign-in/sign-up)
export function useRedirectIfAuthenticated(redirectTo: string = "/dashboard") {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [fullUser, setFullUser] = useState<AuthUser | null>(null);
  const [userLoading, setUserLoading] = useState(false);

  const baseUser = session?.user;
  const isAuthenticated = !!session && !!baseUser;

  // Récupérer les données complètes de l'utilisateur pour connaître son rôle
  useEffect(() => {
    if (isAuthenticated && baseUser && !fullUser && !userLoading) {
      setUserLoading(true);
      fetch(`/api/user/me`)
        .then(res => res.json())
        .then(userData => {
          setFullUser({
            id: userData.id,
            email: userData.email,
            name: userData.name || baseUser.name,
            role: userData.role,
            blocked: userData.blocked
          });
        })
        .catch(error => {
          console.error('Error fetching user data:', error);
          setFullUser({
            id: baseUser.id,
            email: baseUser.email,
            name: baseUser.name,
            role: "PENDING", // Par défaut en cas d'erreur
            blocked: false
          });
        })
        .finally(() => setUserLoading(false));
    }
  }, [isAuthenticated, baseUser, fullUser, userLoading]);

  useEffect(() => {
    if (!isPending && !userLoading && session && fullUser) {
      // Rediriger selon le rôle de l'utilisateur
      if (fullUser.role === "PENDING") {
        router.replace("/pending");
      } else {
        router.replace(redirectTo);
      }
    }
  }, [session, isPending, userLoading, fullUser, router, redirectTo]);

  return { isPending: isPending || userLoading, isAuthenticated: !!session };
}

// Vérifier si un utilisateur a un rôle spécifique
export function hasRole(user: AuthUser | undefined | null, roles: Role | Role[]): boolean {
  if (!user?.role) return false;
  
  const rolesArray = Array.isArray(roles) ? roles : [roles];
  return rolesArray.includes(user.role);
}

// Vérifier si un utilisateur peut accéder à un cours spécifique
export async function canAccessCourse(user: AuthUser | undefined, courseId: string): Promise<boolean> {
  if (!user) return false;
  
  // Les admins peuvent accéder à tous les cours
  if (user.role === "ADMIN") return true;
  
  // Pour les teachers, vérifier via l'API
  if (user.role === "TEACHER") {
    try {
      const response = await fetch(`/api/courses/${courseId}/students`);
      return response.ok;
    } catch {
      return false;
    }
  }
  
  return false;
}

// Types pour les niveaux d'accès des pages
export interface PagePermissions {
  requireAuth: boolean;
  allowedRoles?: Role[];
  redirectIfAuthenticated?: boolean;
  fallbackRoute?: string;
}

// Configuration des permissions par route
export const PAGE_PERMISSIONS: Record<string, PagePermissions> = {
  "/": { requireAuth: false },
  "/sign-in": { requireAuth: false, redirectIfAuthenticated: true },
  "/sign-up": { requireAuth: false },
  "/pending": { requireAuth: true, allowedRoles: ["PENDING"] },
  "/register": { requireAuth: false },
  "/dashboard": { requireAuth: true },
  "/profile": { requireAuth: true },
  "/courses": { requireAuth: true, allowedRoles: ["ADMIN", "TEACHER"] },
  "/courses/[id]": { requireAuth: true, allowedRoles: ["ADMIN", "TEACHER"] },
  "/admin": { requireAuth: true, allowedRoles: ["ADMIN"] }
};

// Obtenir les permissions pour une route
export function getPagePermissions(pathname: string): PagePermissions {
  // Vérifier les routes exactes d'abord
  if (PAGE_PERMISSIONS[pathname]) {
    return PAGE_PERMISSIONS[pathname];
  }
  
  // Vérifier les routes dynamiques
  for (const [route, permissions] of Object.entries(PAGE_PERMISSIONS)) {
    if (route.includes("[") && matchesPattern(pathname, route)) {
      return permissions;
    }
  }
  
  // Par défaut, requireAuth: true pour les routes non définies
  return { requireAuth: true };
}

// Vérifier si un pathname correspond à un pattern de route dynamique
function matchesPattern(pathname: string, pattern: string): boolean {
  const patternParts = pattern.split("/");
  const pathParts = pathname.split("/");
  
  if (patternParts.length !== pathParts.length) return false;
  
  return patternParts.every((part, index) => {
    if (part.startsWith("[") && part.endsWith("]")) return true;
    return part === pathParts[index];
  });
}