"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";

export default function HomePage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Si l'utilisateur est connecté, rediriger vers le dashboard
    if (!isPending && session) {
      router.replace("/dashboard");
    }
  }, [session, isPending, router]);

  // Affichage pendant le chargement
  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="space-y-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Si connecté, ne rien afficher (redirection en cours)
  if (session) {
    return null;
  }

  // Page d'accueil pour les utilisateurs non connectés
  return (
    <div className="min-h-[70vh] flex flex-col justify-center">
      <div className="text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-gray-900">
            Attendance
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Système de gestion des présences pour établissements scolaires.
            Suivez facilement les présences de vos étudiants et générez des rapports détaillés.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex justify-center space-x-4">
            <a
              href="/sign-in"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Se connecter
            </a>
            <a
              href="/sign-up"
              className="border border-blue-600 text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors"
            >
              Créer un compte
            </a>
          </div>
          
          <p className="text-sm text-gray-500">
            Commencez à gérer les présences de vos classes en quelques minutes
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mt-16">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900">Gestion des étudiants</h3>
            <p className="text-gray-600 text-sm">Organisez vos classes et suivez vos étudiants</p>
          </div>
          
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900">Suivi des présences</h3>
            <p className="text-gray-600 text-sm">Enregistrez facilement les présences à chaque cours</p>
          </div>
          
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900">Rapports détaillés</h3>
            <p className="text-gray-600 text-sm">Générez des statistiques et des rapports</p>
          </div>
        </div>
      </div>
    </div>
  );
}
