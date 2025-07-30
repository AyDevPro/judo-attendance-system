"use client";
import { ComponentType, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth, useRedirectIfAuthenticated, getPagePermissions, type Role } from "@/lib/auth-utils";

// Interface pour les props du HOC
interface WithAuthOptions {
  requiredRoles?: Role[];
  fallbackRoute?: string;
  redirectIfAuthenticated?: boolean;
}

// Composant de chargement
const LoadingPage = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="space-y-4 text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      <p className="text-gray-600">Chargement...</p>
    </div>
  </div>
);

// Composant d'accès refusé
const AccessDeniedPage = ({ requiredRoles, userRole }: { requiredRoles?: Role[], userRole?: Role }) => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="max-w-md text-center space-y-4">
      <h1 className="text-2xl font-bold text-red-600">Accès refusé</h1>
      <p className="text-gray-600">
        Vous n'avez pas les permissions nécessaires pour accéder à cette page.
      </p>
      {requiredRoles && (
        <p className="text-sm text-gray-500">
          Rôles requis : {requiredRoles.join(", ")}
          {userRole && <><br />Votre rôle : {userRole}</>}
        </p>
      )}
      <div className="space-x-4">
        <a href="/dashboard" className="text-blue-600 hover:underline">
          Retour au tableau de bord
        </a>
        <a href="/" className="text-blue-600 hover:underline">
          Accueil
        </a>
      </div>
    </div>
  </div>
);

// HOC principal pour la protection des pages
export function withAuth<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: WithAuthOptions = {}
) {
  const AuthProtectedComponent = (props: P) => {
    const pathname = usePathname();
    const router = useRouter();
    
    // Obtenir les permissions pour cette page
    const pagePermissions = getPagePermissions(pathname);
    const effectiveOptions = { ...pagePermissions, ...options };
    
    // Si la page redirige les utilisateurs connectés (sign-in, sign-up)
    if (effectiveOptions.redirectIfAuthenticated) {
      const { isPending, isAuthenticated } = useRedirectIfAuthenticated(
        effectiveOptions.fallbackRoute || "/dashboard"
      );
      
      if (isPending) return <LoadingPage />;
      if (isAuthenticated) return null; // Redirection en cours
      
      return <WrappedComponent {...props} />;
    }
    
    // Si la page ne nécessite pas d'authentification
    if (!effectiveOptions.requireAuth) {
      return <WrappedComponent {...props} />;
    }
    
    // Pour les pages protégées
    const { user, isAuthenticated, isPending, hasRequiredRole } = useAuth(
      effectiveOptions.allowedRoles
    );
    
    // Affichage pendant le chargement
    if (isPending) {
      return <LoadingPage />;
    }
    
    // Redirection si pas authentifié (géré par useAuth)
    if (!isAuthenticated) {
      return null;
    }
    
    // Vérification des rôles si spécifiés
    if (effectiveOptions.allowedRoles && !hasRequiredRole) {
      return (
        <AccessDeniedPage 
          requiredRoles={effectiveOptions.allowedRoles}
          userRole={user?.role}
        />
      );
    }
    
    // Tout est bon, afficher le composant
    return <WrappedComponent {...props} />;
  };
  
  // Préserver le nom du composant pour le debugging
  AuthProtectedComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return AuthProtectedComponent;
}

// HOC spécialisé pour les pages publiques qui redirigent si connecté
export function withRedirectIfAuth<P extends object>(
  WrappedComponent: ComponentType<P>,
  redirectTo: string = "/dashboard"
) {
  return withAuth(WrappedComponent, {
    redirectIfAuthenticated: true,
    fallbackRoute: redirectTo
  });
}

// HOC spécialisé pour les pages admin uniquement
export function withAdminAuth<P extends object>(WrappedComponent: ComponentType<P>) {
  return withAuth(WrappedComponent, {
    requiredRoles: ["ADMIN"]
  });
}

// HOC spécialisé pour les pages teacher/admin
export function withTeacherAuth<P extends object>(WrappedComponent: ComponentType<P>) {
  return withAuth(WrappedComponent, {
    requiredRoles: ["ADMIN", "TEACHER"]
  });
}