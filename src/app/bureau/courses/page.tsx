"use client";
import { useEffect, useState } from "react";
import { withAuth } from "@/components/withAuth";
import { hasRole } from "@/lib/auth-utils";
import { useAuth } from "@/lib/auth-utils";
import { SimpleColumnFilter, type ColumnConfig } from "@/components/SimpleColumnFilter";

interface Teacher {
  id: number;
  userId: string;
  name: string | null;
  email: string;
  coursesCount: number;
}

interface Group {
  id: number;
  name: string;
  type: string;
  description: string | null;
}

interface Course {
  id: number;
  name: string;
  teachers: Array<{
    teacher: {
      id: number;
      user: {
        id: string;
        name: string | null;
        email: string;
      };
    };
  }>;
  groups: Array<{
    group: Group;
  }>;
  timetable: Array<{
    id: number;
    weekday: number;
    startsAt: string;
    endsAt: string;
  }>;
  _count: {
    sessions: number;
  };
}

function BureauCoursesPage() {
  const { user } = useAuth(["ADMIN", "BUREAU"]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);

  // Configuration des colonnes pour le filtre
  const columnConfig: ColumnConfig[] = [
    { key: 'course', label: 'Cours', defaultVisible: true },
    { key: 'schedule', label: 'Horaires', defaultVisible: true },
    { key: 'teachers', label: 'Professeurs', defaultVisible: true },
    { key: 'groups', label: 'Groupes', defaultVisible: true },
    { key: 'students', label: 'Étudiants', defaultVisible: false },
    { key: 'actions', label: 'Actions', defaultVisible: true }
  ];
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    selectedTeachers: [] as number[],
    selectedGroups: [] as number[],
    weekday: "1",
    startsAt: "09:00",
    endsAt: "10:00"
  });

  const weekDays = [
    { value: 1, label: "Lundi" },
    { value: 2, label: "Mardi" },
    { value: 3, label: "Mercredi" },
    { value: 4, label: "Jeudi" },
    { value: 5, label: "Vendredi" },
    { value: 6, label: "Samedi" },
    { value: 7, label: "Dimanche" }
  ];

  useEffect(() => {
    Promise.all([fetchCourses(), fetchTeachers(), fetchGroups()]);
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/bureau/courses");
      if (!response.ok) {
        throw new Error("Failed to fetch courses");
      }
      const data = await response.json();
      setCourses(data);
    } catch (error) {
      setError("Erreur lors du chargement des cours");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await fetch("/api/bureau/teachers");
      if (!response.ok) {
        throw new Error("Failed to fetch teachers");
      }
      const data = await response.json();
      setTeachers(data);
    } catch (error) {
      console.error("Error fetching teachers:", error);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await fetch("/api/bureau/groups");
      if (!response.ok) {
        throw new Error("Failed to fetch groups");
      }
      const data = await response.json();
      setGroups(data);
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.selectedGroups.length === 0) {
      alert("Veuillez sélectionner au moins un groupe");
      return;
    }
    
    if (formData.selectedTeachers.length === 0) {
      alert("Veuillez sélectionner au moins un professeur");
      return;
    }
    
    try {
      const response = await fetch("/api/bureau/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          groupIds: formData.selectedGroups,
          teacherIds: formData.selectedTeachers
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create course");
      }

      // Reset form and refresh data
      setFormData({
        name: "",
        selectedTeachers: [],
        selectedGroups: [],
        weekday: "1",
        startsAt: "09:00",
        endsAt: "10:00"
      });
      setShowCreateForm(false);
      await fetchCourses();
      
      alert("Cours créé avec succès !");
    } catch (error: any) {
      alert("Erreur: " + error.message);
    }
  };

  const handleGroupToggle = (groupId: number) => {
    setFormData(prev => ({
      ...prev,
      selectedGroups: prev.selectedGroups.includes(groupId)
        ? prev.selectedGroups.filter(id => id !== groupId)
        : [...prev.selectedGroups, groupId]
    }));
  };

  const handleTeacherToggle = (teacherId: number) => {
    setFormData(prev => ({
      ...prev,
      selectedTeachers: prev.selectedTeachers.includes(teacherId)
        ? prev.selectedTeachers.filter(id => id !== teacherId)
        : [...prev.selectedTeachers, teacherId]
    }));
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      name: course.name,
      selectedTeachers: course.teachers.map(ct => ct.teacher.id),
      selectedGroups: course.groups.map(cg => cg.group.id),
      weekday: course.timetable[0]?.weekday.toString() || "1",
      startsAt: course.timetable[0]?.startsAt || "09:00",
      endsAt: course.timetable[0]?.endsAt || "10:00"
    });
    setShowEditForm(true);
    setShowCreateForm(false);
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingCourse) return;
    
    if (formData.selectedGroups.length === 0) {
      alert("Veuillez sélectionner au moins un groupe");
      return;
    }
    
    if (formData.selectedTeachers.length === 0) {
      alert("Veuillez sélectionner au moins un professeur");
      return;
    }
    
    try {
      const response = await fetch("/api/bureau/courses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingCourse.id,
          ...formData,
          groupIds: formData.selectedGroups,
          teacherIds: formData.selectedTeachers
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update course");
      }

      // Reset form and refresh data
      setFormData({
        name: "",
        selectedTeachers: [],
        selectedGroups: [],
        weekday: "1",
        startsAt: "09:00",
        endsAt: "10:00"
      });
      setShowEditForm(false);
      setEditingCourse(null);
      await fetchCourses();
      
      alert("Cours modifié avec succès !");
    } catch (error: any) {
      alert("Erreur: " + error.message);
    }
  };

  const cancelEdit = () => {
    setShowEditForm(false);
    setEditingCourse(null);
    setFormData({
      name: "",
      selectedTeachers: [],
      selectedGroups: [],
      weekday: "1",
      startsAt: "09:00",
      endsAt: "10:00"
    });
  };

  const getWeekdayLabel = (weekday: number) => {
    const day = weekDays.find(d => d.value === weekday);
    return day ? day.label : `Jour ${weekday}`;
  };

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
        <button onClick={fetchCourses} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="w-full max-w-none mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestion des cours</h1>
              <p className="mt-2 text-sm text-gray-600">
                Créez et gérez les cours avec leurs groupes d'âge et horaires
              </p>
            </div>
            <button
              onClick={() => {
                setShowCreateForm(!showCreateForm);
                if (showEditForm) {
                  cancelEdit();
                }
              }}
              disabled={showEditForm}
              className={`inline-flex items-center px-4 py-2 text-white text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm transition-all duration-200 ${
                showEditForm 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
              }`}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {showCreateForm ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                )}
              </svg>
              {showCreateForm ? "Annuler" : "Nouveau cours"}
            </button>
          </div>
        </div>

        {/* Formulaire de création */}
        {showCreateForm && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Créer un nouveau cours
              </h2>
              <p className="text-sm text-gray-600 mt-1">Remplissez les informations du cours et sélectionnez les groupes</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        Nom du cours *
                      </span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Ex: Judo débutant"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Professeur(s) *
                      </span>
                    </label>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-48 overflow-y-auto">
                      <div className="space-y-3">
                        {teachers.map(teacher => (
                          <label key={teacher.id} className="relative flex items-center space-x-3 cursor-pointer group">
                            <div className="flex items-center h-5">
                              <input
                                type="checkbox"
                                checked={formData.selectedTeachers.includes(teacher.id)}
                                onChange={() => handleTeacherToggle(teacher.id)}
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={`text-sm font-medium transition-colors duration-200 ${
                                formData.selectedTeachers.includes(teacher.id)
                                  ? 'text-blue-700' 
                                  : 'text-gray-700 group-hover:text-gray-900'
                              }`}>
                                {teacher.name || teacher.email}
                              </div>
                              <div className="text-xs text-gray-500">
                                {teacher.coursesCount} cours assigné{teacher.coursesCount > 1 ? 's' : ''}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                      {formData.selectedTeachers.length === 0 && (
                        <p className="text-sm text-red-500 mt-3 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Au moins un professeur doit être sélectionné
                        </p>
                      )}
                      {formData.selectedTeachers.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {formData.selectedTeachers.map(teacherId => {
                            const teacher = teachers.find(t => t.id === teacherId);
                            return teacher ? (
                              <span key={teacherId} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {teacher.name || teacher.email}
                              </span>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Groupes affectés *
                    </span>
                  </label>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {groups.map(group => (
                        <label key={group.id} className="relative flex items-center space-x-3 cursor-pointer group">
                          <div className="flex items-center h-5">
                            <input
                              type="checkbox"
                              checked={formData.selectedGroups.includes(group.id)}
                              onChange={() => handleGroupToggle(group.id)}
                              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className={`text-sm font-medium transition-colors duration-200 ${
                              formData.selectedGroups.includes(group.id) 
                                ? 'text-blue-700' 
                                : 'text-gray-700 group-hover:text-gray-900'
                            }`}>
                              {group.name}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                    {formData.selectedGroups.length === 0 && (
                      <p className="text-sm text-red-500 mt-3 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Au moins un groupe doit être sélectionné
                      </p>
                    )}
                    {formData.selectedGroups.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {formData.selectedGroups.map(groupId => {
                          const group = groups.find(g => g.id === groupId);
                          return group ? (
                            <span key={groupId} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {group.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m-9 8h10m-5-5v3m0-3V7" />
                        </svg>
                        Jour de la semaine *
                      </span>
                    </label>
                    <select
                      required
                      value={formData.weekday}
                      onChange={(e) => setFormData({ ...formData, weekday: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                      {weekDays.map(day => (
                        <option key={day.value} value={day.value}>{day.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Heure de début *
                      </label>
                      <input
                        type="time"
                        required
                        value={formData.startsAt}
                        onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Heure de fin *
                      </label>
                      <input
                        type="time"
                        required
                        value={formData.endsAt}
                        onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-3 flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={formData.selectedGroups.length === 0 || formData.selectedTeachers.length === 0}
                  className={`px-6 py-3 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ${
                    formData.selectedGroups.length === 0 || formData.selectedTeachers.length === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 focus:ring-blue-500 shadow-sm'
                  }`}
                >
                  <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Créer le cours
                </button>
              </div>
          </form>
        </div>
      )}

        {/* Formulaire d'édition */}
        {showEditForm && editingCourse && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8 overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <svg className="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Modifier le cours: {editingCourse.name}
              </h2>
              <p className="text-sm text-gray-600 mt-1">Modifiez les informations du cours et ses assignations</p>
            </div>
            
            <form onSubmit={handleUpdateCourse} className="p-6">
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        Nom du cours *
                      </span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                      placeholder="Ex: Judo débutant"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Professeur(s) *
                      </span>
                    </label>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-48 overflow-y-auto">
                      <div className="space-y-3">
                        {teachers.map(teacher => (
                          <label key={teacher.id} className="relative flex items-center space-x-3 cursor-pointer group">
                            <div className="flex items-center h-5">
                              <input
                                type="checkbox"
                                checked={formData.selectedTeachers.includes(teacher.id)}
                                onChange={() => handleTeacherToggle(teacher.id)}
                                className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={`text-sm font-medium transition-colors duration-200 ${
                                formData.selectedTeachers.includes(teacher.id)
                                  ? 'text-green-700' 
                                  : 'text-gray-700 group-hover:text-gray-900'
                              }`}>
                                {teacher.name || teacher.email}
                              </div>
                              <div className="text-xs text-gray-500">
                                {teacher.coursesCount} cours assigné{teacher.coursesCount > 1 ? 's' : ''}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                      {formData.selectedTeachers.length === 0 && (
                        <p className="text-sm text-red-500 mt-3 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Au moins un professeur doit être sélectionné
                        </p>
                      )}
                      {formData.selectedTeachers.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {formData.selectedTeachers.map(teacherId => {
                            const teacher = teachers.find(t => t.id === teacherId);
                            return teacher ? (
                              <span key={teacherId} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {teacher.name || teacher.email}
                              </span>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Groupes affectés *
                    </span>
                  </label>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {groups.map(group => (
                        <label key={group.id} className="relative flex items-center space-x-3 cursor-pointer group">
                          <div className="flex items-center h-5">
                            <input
                              type="checkbox"
                              checked={formData.selectedGroups.includes(group.id)}
                              onChange={() => handleGroupToggle(group.id)}
                              className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className={`text-sm font-medium transition-colors duration-200 ${
                              formData.selectedGroups.includes(group.id) 
                                ? 'text-green-700' 
                                : 'text-gray-700 group-hover:text-gray-900'
                            }`}>
                              {group.name}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                    {formData.selectedGroups.length === 0 && (
                      <p className="text-sm text-red-500 mt-3 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Au moins un groupe doit être sélectionné
                      </p>
                    )}
                    {formData.selectedGroups.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {formData.selectedGroups.map(groupId => {
                          const group = groups.find(g => g.id === groupId);
                          return group ? (
                            <span key={groupId} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {group.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m-9 8h10m-5-5v3m0-3V7" />
                        </svg>
                        Jour de la semaine *
                      </span>
                    </label>
                    <select
                      required
                      value={formData.weekday}
                      onChange={(e) => setFormData({ ...formData, weekday: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    >
                      {weekDays.map(day => (
                        <option key={day.value} value={day.value}>{day.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Heure de début *
                      </label>
                      <input
                        type="time"
                        required
                        value={formData.startsAt}
                        onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Heure de fin *
                      </label>
                      <input
                        type="time"
                        required
                        value={formData.endsAt}
                        onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-3 flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-6 py-3 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={formData.selectedGroups.length === 0 || formData.selectedTeachers.length === 0}
                  className={`px-6 py-3 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ${
                    formData.selectedGroups.length === 0 || formData.selectedTeachers.length === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 focus:ring-green-500 shadow-sm'
                  }`}
                >
                  <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Sauvegarder les modifications
                </button>
              </div>
          </form>
        </div>
      )}

        {/* Filtre personnalisé */}
        <div className="mb-6 flex justify-end">
          <SimpleColumnFilter
            columns={columnConfig}
            onFilterChange={setVisibleColumns}
            storageKey="courses-filter-preferences"
          />
        </div>

        {/* Liste des cours */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Cours existants
              </h2>
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full">
                {courses.length} cours
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      Cours
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Professeur
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Horaire
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Groupes
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Sessions
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                      Actions
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {courses.map((course) => (
                  <tr key={course.id} className="hover:bg-blue-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900">{course.name}</div>
                          <div className="text-sm text-gray-500">
                            {course.groups.map(g => g.group.name).join(" + ")} • {getWeekdayLabel(course.timetable[0]?.weekday)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {course.teachers.map(({ teacher }) => (
                          <div key={teacher.id} className="flex items-center bg-gray-50 rounded-lg px-3 py-1">
                            <div className="flex-shrink-0 h-6 w-6">
                              <div className="h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center">
                                <svg className="h-3 w-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                            </div>
                            <div className="ml-2">
                              <div className="text-xs font-medium text-gray-900">
                                {teacher.user.name || teacher.user.email}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {course.teachers.length === 0 && (
                        <div className="text-sm text-gray-400 italic">Aucun professeur assigné</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {course.timetable.map((schedule) => (
                        <div key={schedule.id} className="text-sm">
                          <div className="text-gray-900 font-medium">
                            {getWeekdayLabel(schedule.weekday)}
                          </div>
                          <div className="text-gray-500">
                            {schedule.startsAt} - {schedule.endsAt}
                          </div>
                        </div>
                      ))}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {course.groups.map(({ group }) => (
                          <span
                            key={group.id}
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-200"
                          >
                            {group.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {course._count.sessions}
                        </div>
                        <div className="text-sm text-gray-500 ml-1">
                          session{course._count.sessions > 1 ? 's' : ''}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditCourse(course)}
                          disabled={showCreateForm}
                          className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            showCreateForm
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-blue-50 text-blue-700 hover:bg-blue-100 focus:ring-blue-500'
                          }`}
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Modifier
                        </button>
                        <a
                          href={`/bureau/courses/${course.id}/students`}
                          className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          Étudiants
                        </a>
                      </div>
                    </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          {courses.length === 0 && (
            <div className="px-6 py-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="mt-4 text-sm font-medium text-gray-900">Aucun cours</h3>
              <p className="mt-2 text-sm text-gray-500">
                Commencez par créer votre premier cours avec des groupes et un horaire.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Créer un cours
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default withAuth(BureauCoursesPage, { requiredRoles: ["ADMIN", "BUREAU"] });