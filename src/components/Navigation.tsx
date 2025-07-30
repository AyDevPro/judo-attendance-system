"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { type AuthUser, hasRole, useAuth } from "@/lib/auth-utils";

export default function Navigation() {
  const { user, isAuthenticated, isPending } = useAuth();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fermer le dropdown quand on clique ailleurs
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    setIsDropdownOpen(false);
  };

  const handleProfileClick = () => {
    router.push("/profile");
    setIsDropdownOpen(false);
  };

  // Liens pour utilisateurs non connectés
  const renderGuestLinks = () => (
    <div className="space-x-3">
      <a href="/sign-in" className="text-blue-600 hover:text-blue-800 hover:underline">
        Se connecter
      </a>
      <a href="/sign-up" className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
        Créer un compte
      </a>
    </div>
  );

  // Menu déroulant utilisateur
  const renderUserDropdown = () => (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 focus:outline-none"
      >
        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
          {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"}
        </div>
        <span className="hidden md:block font-medium">{user?.name || user?.email}</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
          <div className="py-1">
            <div className="px-4 py-2 text-sm text-gray-500 border-b">
              <div className="font-medium">{user?.name || "Utilisateur"}</div>
              <div className="text-xs">{user?.email}</div>
              <div className="text-xs text-blue-600 font-medium">
                {user?.role === "ADMIN" ? "Administrateur" : 
                 user?.role === "TEACHER" ? "Enseignant" :
                 user?.role === "BUREAU" ? "Bureau" : "Utilisateur"}
              </div>
            </div>
            
            <button
              onClick={handleProfileClick}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Mon profil
            </button>
            
            <button
              onClick={handleSignOut}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Se déconnecter
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // Liens selon le rôle de l'utilisateur
  const renderAuthenticatedLinks = () => {
    const links = [];

    // Lien vers les cours (pour ADMIN et TEACHER)
    if (hasRole(user, ["ADMIN", "TEACHER"])) {
      const linkText = user?.role === "ADMIN" ? "Tous les cours" : "Mes cours";
      links.push(
        <a 
          key="courses"
          href="/courses" 
          className="text-gray-700 hover:text-gray-900 hover:underline"
        >
          {linkText}
        </a>
      );
    }

    // Liens spécifiques pour ADMIN
    if (hasRole(user, "ADMIN")) {
      links.push(
        <a 
          key="manage-courses"
          href="/bureau/courses" 
          className="text-gray-700 hover:text-gray-900 hover:underline"
        >
          Gérer les cours
        </a>
      );
      links.push(
        <a 
          key="manage-users"
          href="/admin/users" 
          className="text-gray-700 hover:text-gray-900 hover:underline"
        >
          Gérer les utilisateurs
        </a>
      );
    }

    // Tableaux de bord pour BUREAU
    if (hasRole(user, "BUREAU")) {
      links.push(
        <a 
          key="dashboard-bureau"
          href="/bureau/courses" 
          className="text-gray-700 hover:text-gray-900 hover:underline"
        >
          Gérer les cours
        </a>
      );
    }

    return (
      <div className="flex items-center space-x-4">
        <div className="hidden md:flex space-x-4">
          {links}
        </div>
        {renderUserDropdown()}
      </div>
    );
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <nav className="max-w-5xl mx-auto flex items-center justify-between p-4">
        {/* Logo */}
        <a href="/" className="font-bold text-xl text-gray-900 hover:text-blue-600">
          Attendance
        </a>

        {/* Navigation */}
        {isPending ? (
          <div className="animate-pulse">
            <div className="h-8 w-24 bg-gray-200 rounded"></div>
          </div>
        ) : isAuthenticated ? (
          renderAuthenticatedLinks()
        ) : (
          renderGuestLinks()
        )}
      </nav>
    </header>
  );
}