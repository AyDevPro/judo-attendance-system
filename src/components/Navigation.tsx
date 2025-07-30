"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "@/lib/auth-client";
import { type AuthUser, hasRole } from "@/lib/auth-utils";

export default function Navigation() {
  const { data: session, isPending } = useSession();
  const baseUser = session?.user;
  const isAuthenticated = !!session;
  const [fullUser, setFullUser] = useState<AuthUser | null>(null);
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Récupérer les données complètes de l'utilisateur
  useEffect(() => {
    if (isAuthenticated && baseUser && !fullUser) {
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
            role: undefined,
            blocked: false
          });
        });
    }
  }, [isAuthenticated, baseUser, fullUser]);

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
    <div className="flex items-center space-x-4">
      <a href="/sign-in" className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-blue-50">
        Se connecter
      </a>
      <a href="/sign-up" className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 font-medium shadow-sm hover:shadow-md transition-all duration-200">
        Créer un compte
      </a>
    </div>
  );

  // Menu déroulant utilisateur
  const renderUserDropdown = () => (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center space-x-3 text-gray-700 hover:text-gray-900 focus:outline-none bg-gray-50 hover:bg-gray-100 rounded-xl px-3 py-2 transition-all duration-200"
      >
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl flex items-center justify-center text-sm font-semibold shadow-md">
          {fullUser?.name?.charAt(0)?.toUpperCase() || fullUser?.email?.charAt(0)?.toUpperCase() || "U"}
        </div>
        <div className="hidden md:block text-left">
          <div className="font-semibold text-sm">{fullUser?.name || "Utilisateur"}</div>
          <div className="text-xs text-gray-500">
            {fullUser?.role === "ADMIN" ? "Administrateur" : 
             fullUser?.role === "TEACHER" ? "Enseignant" :
             fullUser?.role === "BUREAU" ? "Bureau" : "Utilisateur"}
          </div>
        </div>
        <svg className="w-4 h-4 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-3 w-64 bg-white rounded-xl shadow-xl border border-gray-200/50 z-50 overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200/50">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl flex items-center justify-center text-lg font-semibold shadow-md">
                {fullUser?.name?.charAt(0)?.toUpperCase() || fullUser?.email?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div>
                <div className="font-semibold text-gray-900">{fullUser?.name || "Utilisateur"}</div>
                <div className="text-sm text-gray-600">{fullUser?.email}</div>
                <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                  {fullUser?.role === "ADMIN" ? "Administrateur" : 
                   fullUser?.role === "TEACHER" ? "Enseignant" :
                   fullUser?.role === "BUREAU" ? "Bureau" : "Utilisateur"}
                </div>
              </div>
            </div>
          </div>
          
          <div className="py-2">
            <button
              onClick={handleProfileClick}
              className="flex items-center w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
            >
              <svg className="w-4 h-4 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Mon profil
            </button>
            
            <button
              onClick={handleSignOut}
              className="flex items-center w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
            >
              <svg className="w-4 h-4 mr-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
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

    // Dashboard toujours visible
    links.push(
      <a 
        key="dashboard"
        href="/dashboard" 
        className="flex items-center text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-blue-50"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
        Tableau de bord
      </a>
    );

    // Lien vers les cours (pour ADMIN et TEACHER)
    if (hasRole(fullUser, ["ADMIN", "TEACHER"])) {
      const linkText = fullUser?.role === "ADMIN" ? "Tous les cours" : "Mes cours";
      links.push(
        <a 
          key="courses"
          href="/courses" 
          className="flex items-center text-gray-700 hover:text-green-600 font-medium transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-green-50"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          {linkText}
        </a>
      );
    }

    // Liens spécifiques pour ADMIN et BUREAU
    if (hasRole(fullUser, ["ADMIN", "BUREAU"])) {
      links.push(
        <a 
          key="manage-licensees"
          href="/bureau/licensees" 
          className="flex items-center text-gray-700 hover:text-purple-600 font-medium transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-purple-50"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 515.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 919.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Licenciés
        </a>
      );
    }

    // Liens spécifiques pour ADMIN seulement
    if (hasRole(fullUser, "ADMIN")) {
      links.push(
        <a 
          key="manage-users"
          href="/admin/users" 
          className="flex items-center text-gray-700 hover:text-red-600 font-medium transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-red-50"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
          Utilisateurs
        </a>
      );
    }

    return (
      <div className="flex items-center space-x-2">
        <div className="hidden lg:flex items-center space-x-1">
          {links}
        </div>
        {renderUserDropdown()}
      </div>
    );
  };

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-lg sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto flex items-center justify-between p-4">
        {/* Logo modernisé */}
        <a href="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent group-hover:from-blue-700 group-hover:to-indigo-700 transition-all duration-200">
            Judo Attendance
          </span>
        </a>

        {/* Navigation */}
        {isPending ? (
          <div className="animate-pulse flex items-center space-x-4">
            <div className="h-8 w-24 bg-gray-200 rounded-lg"></div>
            <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
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