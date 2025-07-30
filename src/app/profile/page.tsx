"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { withAuth } from "@/components/withAuth";
import { useAuth } from "@/lib/auth-utils";

function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      // Note: Il faudrait créer une API route pour mettre à jour le profil
      // Pour l'instant, simulation d'un délai
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMessage({ type: 'success', text: 'Profil mis à jour avec succès' });
      setIsEditing(false);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la mise à jour' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case "ADMIN": return "Administrateur";
      case "TEACHER": return "Enseignant";
      case "BUREAU": return "Bureau";
      default: return "Utilisateur";
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto">
          {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"}
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Mon profil</h1>
      </div>

      {/* Messages */}
      {message && (
        <div className={`p-4 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Informations du profil */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Informations personnelles</h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Modifier
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nom complet
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={isLoading}
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Enregistrement..." : "Enregistrer"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setName(user?.name || "");
                  setMessage(null);
                }}
                disabled={isLoading}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
              >
                Annuler
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">Nom complet</label>
              <p className="text-gray-900 font-medium">{user?.name || "Non défini"}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">Adresse email</label>
              <p className="text-gray-900">{user?.email}</p>
              <p className="text-xs text-gray-500 mt-1">L'email ne peut pas être modifié</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">Rôle</label>
              <p className="text-gray-900">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user?.role === "ADMIN" ? "bg-purple-100 text-purple-800" :
                  user?.role === "TEACHER" ? "bg-blue-100 text-blue-800" :
                  user?.role === "BUREAU" ? "bg-green-100 text-green-800" :
                  "bg-gray-100 text-gray-800"
                }`}>
                  {getRoleLabel(user?.role)}
                </span>
              </p>
              <p className="text-xs text-gray-500 mt-1">Le rôle est défini par un administrateur</p>
            </div>
          </div>
        )}
      </div>

      {/* Actions du compte */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions du compte</h2>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b border-gray-200">
            <div>
              <h3 className="font-medium text-gray-900">Tableau de bord</h3>
              <p className="text-sm text-gray-500">Retourner au tableau de bord principal</p>
            </div>
            <a
              href="/dashboard"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Accéder →
            </a>
          </div>

          <div className="flex justify-between items-center py-3">
            <div>
              <h3 className="font-medium text-gray-900">Se déconnecter</h3>
              <p className="text-sm text-gray-500">Fermer votre session en cours</p>
            </div>
            <button
              onClick={handleSignOut}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(ProfilePage);