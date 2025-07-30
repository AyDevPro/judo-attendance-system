"use client";
import { useEffect, useState } from "react";
import { withAdminAuth } from "@/components/withAuth";
import { useAuth } from "@/lib/auth-utils";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: "ADMIN" | "BUREAU" | "TEACHER";
  blocked: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    sessions: number;
  };
}

function AdminUsersPage() {
  const { user: currentUser } = useAuth(["ADMIN"]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "blocked" | "active">("all");
  const [roleFilter, setRoleFilter] = useState<"all" | "ADMIN" | "BUREAU" | "TEACHER">("all");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/users");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      setError("Erreur lors du chargement des utilisateurs");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userId: string, updates: Partial<Pick<User, "role" | "blocked" | "name">>) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update user");
      }

      const updatedUser = await response.json();
      setUsers(users.map(user => user.id === userId ? { ...user, ...updatedUser } : user));
    } catch (error: any) {
      alert("Erreur: " + error.message);
    }
  };

  const deleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${userEmail} ? Cette action est irréversible.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete user");
      }

      setUsers(users.filter(user => user.id !== userId));
    } catch (error: any) {
      alert("Erreur: " + error.message);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "ADMIN": return "Administrateur";
      case "BUREAU": return "Bureau";
      case "TEACHER": return "Enseignant";
      default: return role;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN": return "bg-purple-100 text-purple-800";
      case "BUREAU": return "bg-green-100 text-green-800";
      case "TEACHER": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const filteredUsers = users.filter(user => {
    if (filter === "blocked" && !user.blocked) return false;
    if (filter === "active" && user.blocked) return false;
    if (roleFilter !== "all" && user.role !== roleFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
        <button onClick={fetchUsers} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Gestion des utilisateurs</h1>
        <button
          onClick={fetchUsers}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Actualiser
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous</option>
              <option value="active">Actifs</option>
              <option value="blocked">Bloqués</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rôle</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les rôles</option>
              <option value="ADMIN">Administrateur</option>
              <option value="BUREAU">Bureau</option>
              <option value="TEACHER">Enseignant</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des utilisateurs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Utilisateurs ({filteredUsers.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rôle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sessions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Créé le
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {user.name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name || "Sans nom"}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {currentUser?.id === user.id ? (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                        {user.role === "ADMIN" ? "Administrateur" : 
                         user.role === "BUREAU" ? "Bureau" : "Enseignant"} (Vous)
                      </span>
                    ) : (
                      <select
                        value={user.role}
                        onChange={(e) => updateUser(user.id, { role: e.target.value as any })}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border-0 ${getRoleBadgeColor(user.role)}`}
                      >
                        <option value="ADMIN">Administrateur</option>
                        <option value="BUREAU">Bureau</option>
                        <option value="TEACHER">Enseignant</option>
                      </select>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {currentUser?.id === user.id ? (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.blocked 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {user.blocked ? 'Bloqué' : 'Actif'}
                      </span>
                    ) : (
                      <button
                        onClick={() => updateUser(user.id, { blocked: !user.blocked })}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.blocked 
                            ? 'bg-red-100 text-red-800 hover:bg-red-200' 
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                      >
                        {user.blocked ? 'Bloqué' : 'Actif'}
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user._count.sessions} session(s)
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {currentUser?.id === user.id ? (
                      <span className="text-gray-400 ml-3">
                        -
                      </span>
                    ) : (
                      <button
                        onClick={() => deleteUser(user.id, user.email)}
                        className="text-red-600 hover:text-red-900 ml-3"
                      >
                        Supprimer
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="px-6 py-8 text-center text-gray-500">
            Aucun utilisateur ne correspond aux filtres sélectionnés.
          </div>
        )}
      </div>
    </div>
  );
}

export default withAdminAuth(AdminUsersPage);