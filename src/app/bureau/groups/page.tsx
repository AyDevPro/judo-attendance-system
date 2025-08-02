"use client";
import { useEffect, useState } from "react";
import { withAuth } from "@/components/withAuth";
import { hasRole } from "@/lib/auth-utils";
import { useAuth } from "@/lib/auth-utils";
import { SimpleColumnFilter, type ColumnConfig } from "@/components/SimpleColumnFilter";
import { useToast } from "@/components/ToastProvider";
import { useConfirm } from "@/components/ConfirmDialog";
import { useTableSort } from "@/hooks/useTableSort";

interface Group {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    licensees: number;
    courses: number;
  };
}

function GroupsPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: ""
  });
  const { toast } = useToast();
  const { confirm } = useConfirm();

  // Configuration des colonnes
  const defaultColumns = [
    { id: 'name', label: 'Nom', visible: true },
    { id: 'description', label: 'Description', visible: true },
    { id: 'licensees', label: 'Licenciés', visible: true },
    { id: 'courses', label: 'Cours', visible: true },
    { id: 'actions', label: 'Actions', visible: true }
  ];

  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    defaultColumns.filter(col => col.visible).map(col => col.id)
  );

  // Système de tri
  const { sortedData, sortConfig, handleSort, SortableHeader } = useTableSort(groups);

  const columnConfigs: ColumnConfig[] = defaultColumns.map(col => ({
    id: col.id,
    label: col.label,
    visible: visibleColumns.includes(col.id)
  }));

  const handleColumnVisibilityChange = (columnId: string, visible: boolean) => {
    setVisibleColumns(prev => 
      visible 
        ? [...prev, columnId]
        : prev.filter(id => id !== columnId)
    );
  };

  const canEdit = hasRole(user, ['ADMIN', 'BUREAU']);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/bureau/groups');
      if (response.ok) {
        const data = await response.json();
        setGroups(data);
      } else {
        toast('Erreur lors du chargement des groupes', 'error');
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast('Erreur lors du chargement des groupes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast('Nom du groupe requis', 'error');
      return;
    }

    try {
      const url = editingGroup ? '/api/bureau/groups' : '/api/bureau/groups';
      const method = editingGroup ? 'PUT' : 'POST';
      const payload = editingGroup 
        ? { id: editingGroup.id, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast(editingGroup ? 'Groupe modifié avec succès' : 'Groupe créé avec succès', 'success');
        fetchGroups();
        resetForm();
      } else {
        const error = await response.json();
        toast(error.error || 'Erreur lors de la sauvegarde', 'error');
      }
    } catch (error) {
      console.error('Error saving group:', error);
      toast('Erreur lors de la sauvegarde', 'error');
    }
  };

  const handleEdit = (group: Group) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      description: group.description || ""
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (group: Group) => {
    const confirmed = await confirm(
      'Supprimer le groupe',
      `Êtes-vous sûr de vouloir supprimer le groupe "${group.name}" ?\n\nCela retirera le groupe de ${group._count.licensees} licencié(s) et ${group._count.courses} cours.\n\nCette action est irréversible.`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/bureau/groups?id=${group.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const result = await response.json();
        toast(`Groupe supprimé avec succès (${result.affectedLicensees} licenciés et ${result.affectedCourses} cours affectés)`, 'success');
        fetchGroups();
      } else {
        const error = await response.json();
        toast(error.error || 'Erreur lors de la suppression', 'error');
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      toast('Erreur lors de la suppression', 'error');
    }
  };

  const resetForm = () => {
    setFormData({ name: "", description: "" });
    setEditingGroup(null);
    setShowCreateForm(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Gestion des Groupes
          </h1>
          {canEdit && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              + Nouveau Groupe
            </button>
          )}
        </div>

        {/* Formulaire de création/modification */}
        {showCreateForm && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              {editingGroup ? 'Modifier le groupe' : 'Créer un nouveau groupe'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du groupe *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: Prima Avancé, Compétition, Baby Judo..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Description optionnelle du groupe"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                >
                  {editingGroup ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filtres de colonnes */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <SimpleColumnFilter
            columns={columnConfigs}
            onColumnVisibilityChange={handleColumnVisibilityChange}
          />
        </div>

        {/* Tableau des groupes */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">
              Groupes ({groups.length})
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  {visibleColumns.includes('name') && (
                    <SortableHeader column="name" label="Nom" />
                  )}
                  {visibleColumns.includes('description') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                  )}
                  {visibleColumns.includes('licensees') && (
                    <SortableHeader column="_count.licensees" label="Licenciés" />
                  )}
                  {visibleColumns.includes('courses') && (
                    <SortableHeader column="_count.courses" label="Cours" />
                  )}
                  {visibleColumns.includes('actions') && canEdit && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedData.map((group) => (
                  <tr key={group.id} className="hover:bg-gray-50">
                    {visibleColumns.includes('name') && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{group.name}</div>
                      </td>
                    )}
                    {visibleColumns.includes('description') && (
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate" title={group.description || ''}>
                          {group.description || '-'}
                        </div>
                      </td>
                    )}
                    {visibleColumns.includes('licensees') && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{group._count.licensees}</div>
                      </td>
                    )}
                    {visibleColumns.includes('courses') && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{group._count.courses}</div>
                      </td>
                    )}
                    {visibleColumns.includes('actions') && canEdit && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEdit(group)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(group)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                        >
                          Supprimer
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            
            {groups.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">Aucun groupe trouvé</p>
                {canEdit && (
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="mt-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                  >
                    Créer le premier groupe
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default withAuth(GroupsPage, ['ADMIN', 'BUREAU']);