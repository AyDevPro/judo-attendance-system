"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { signOut } from "@/lib/auth-client";
import { useAuth } from "@/lib/auth-utils";

export default function PendingPage() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { user, refreshUserData } = useAuth(["PENDING"]);

  // Vérifier périodiquement si le rôle a changé
  useEffect(() => {
    const interval = setInterval(() => {
      if (user && user.role === "PENDING") {
        refreshUserData();
      }
    }, 10000); // Vérifier toutes les 10 secondes

    return () => clearInterval(interval);
  }, [user?.role, refreshUserData]);

  // Rediriger si le rôle n'est plus PENDING
  useEffect(() => {
    if (user && user.role !== "PENDING") {
      router.push("/dashboard");
    }
  }, [user?.role, router]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    router.push("/sign-in");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 via-white to-orange-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Compte en attente
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Votre inscription a été reçue avec succès
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="px-8 py-6">
            <div className="text-center space-y-4">
              {/* Status Icon */}
              <div className="mx-auto w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              {/* Message */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  Validation en cours
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Votre compte a été créé mais nécessite une validation par un administrateur avant de pouvoir accéder aux fonctionnalités.
                </p>
              </div>

              {/* Steps */}
              <div className="bg-gray-50 rounded-lg p-4 text-left">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Prochaines étapes
                </h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <svg className="w-4 h-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Votre inscription a été envoyée
                  </li>
                  <li className="flex items-start">
                    <svg className="w-4 h-4 mr-2 mt-0.5 text-yellow-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Un administrateur va valider votre compte
                  </li>
                  <li className="flex items-start">
                    <svg className="w-4 h-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                    Vous recevrez un accès selon votre rôle
                  </li>
                </ul>
              </div>

              {/* Contact Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-400 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-left">
                    <p className="text-sm font-medium text-blue-800">
                      Besoin d'aide ?
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      Contactez l'administration du club pour toute question concernant votre inscription.
                    </p>
                  </div>
                </div>
              </div>

              {/* Auto-refresh indicator */}
              <div className="flex items-center justify-center text-xs text-gray-500">
                <svg className="w-3 h-3 mr-1 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Vérification automatique du statut...
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-4 bg-gray-50 border-t border-gray-200">
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className={`w-full flex justify-center items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                isSigningOut
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-600 text-white hover:bg-gray-700 shadow-sm'
              }`}
            >
              {isSigningOut ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Déconnexion...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Se déconnecter
                </>
              )}
            </button>
          </div>
        </div>

        {/* Additional Info */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Système de Gestion des Présences Judo
          </p>
        </div>
      </div>
    </div>
  );
}