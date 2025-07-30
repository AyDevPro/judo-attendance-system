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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-blue-600/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative min-h-screen flex flex-col justify-center px-6 py-12">
          <div className="max-w-6xl mx-auto text-center space-y-12">
            {/* Hero Section */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  JudoPresence
                </h1>
                <p className="text-2xl md:text-3xl text-gray-700 font-light">
                  Système de Gestion des Présences
                </p>
              </div>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Solution complète pour la gestion des présences dans votre club de judo.
                Suivez facilement les présences de vos judokas par groupe d'âge et générez des rapports détaillés.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <a
                  href="/sign-in"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Se connecter
                </a>
                <a
                  href="/sign-up"
                  className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-blue-600 hover:text-white transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Créer un compte
                </a>
              </div>
              
              <p className="text-gray-500 text-lg">
                Commencez à gérer les présences de vos groupes en quelques minutes
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-20">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 text-center space-y-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900">Gestion par Groupes</h3>
                <p className="text-gray-600">Organisez vos judokas par groupes d'âge (Prima, J2, J3, J4, J5) et suivez leurs progrès</p>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 text-center space-y-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900">Suivi Intelligent</h3>
                <p className="text-gray-600">Système de présences en 3 clics : absent → présent → justifié avec historique complet</p>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 text-center space-y-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900">Multi-Professeurs</h3>
                <p className="text-gray-600">Assignez plusieurs professeurs par cours et gérez les permissions par rôle</p>
              </div>
            </div>

            {/* Additional Features */}
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 max-w-4xl mx-auto mt-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Spécialement conçu pour le Judo</h2>
              <div className="grid md:grid-cols-2 gap-6 text-left">
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                    Groupes d'âge spécialisés
                  </h4>
                  <p className="text-gray-600 ml-5">Prima, J2, J3, J4, J5 Judo/Jujitsu, Ne-waza, Taiso, Self-Défense, Yoga</p>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 flex items-center">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                    Gestion hiérarchique
                  </h4>
                  <p className="text-gray-600 ml-5">Rôles Admin, Bureau et Professeur avec permissions adaptées</p>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    Interface moderne
                  </h4>
                  <p className="text-gray-600 ml-5">Design responsive et intuitive pour tous les appareils</p>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 flex items-center">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>
                    Sécurisé et fiable
                  </h4>
                  <p className="text-gray-600 ml-5">Authentification sécurisée et sauvegarde automatique</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
