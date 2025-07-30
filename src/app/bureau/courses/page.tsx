"use client";
import { useEffect, useState } from "react";
import { withAuth } from "@/components/withAuth";
import { hasRole } from "@/lib/auth-utils";
import { useAuth } from "@/lib/auth-utils";

interface Teacher {
  id: number;
  userId: string;
  name: string | null;
  email: string;
  coursesCount: number;
}

interface Course {
  id: number;
  name: string;
  ageGroup: string;
  teacher: {
    id: number;
    user: {
      id: string;
      name: string | null;
      email: string;
    };
  };
  class: {
    id: number;
    name: string;
    _count: {
      students: number;
    };
  };
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    ageGroup: "POUSSIN",
    teacherId: "",
    weekday: "1",
    startsAt: "09:00",
    endsAt: "10:00",
    className: ""
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

  const ageGroups = [
    { value: "BABY_JUDO", label: "Baby Judo (4-5 ans)" },
    { value: "POUSSIN", label: "Poussin (6-7 ans)" },
    { value: "BENJAMIN", label: "Benjamin (8-9 ans)" },
    { value: "MINIME", label: "Minime (10-11 ans)" },
    { value: "CADET", label: "Cadet (12-13 ans)" },
    { value: "JUNIOR", label: "Junior (14-17 ans)" },
    { value: "SENIOR", label: "Senior (18+ ans)" }
  ];

  useEffect(() => {
    Promise.all([fetchCourses(), fetchTeachers()]);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch("/api/bureau/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create course");
      }

      // Reset form and refresh data
      setFormData({
        name: "",
        ageGroup: "POUSSIN",
        teacherId: "",
        weekday: "1",
        startsAt: "09:00",
        endsAt: "10:00",
        className: ""
      });
      setShowCreateForm(false);
      await fetchCourses();
      
      alert("Cours créé avec succès !");
    } catch (error: any) {
      alert("Erreur: " + error.message);
    }
  };

  const getAgeGroupLabel = (ageGroup: string) => {
    const group = ageGroups.find(g => g.value === ageGroup);
    return group ? group.label : ageGroup;
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Gestion des cours</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {showCreateForm ? "Annuler" : "Nouveau cours"}
        </button>
      </div>

      {/* Formulaire de création */}
      {showCreateForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Créer un nouveau cours</h2>
          
          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom du cours *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Judo débutant"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tranche d'âge *
              </label>
              <select
                required
                value={formData.ageGroup}
                onChange={(e) => setFormData({ ...formData, ageGroup: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ageGroups.map(group => (
                  <option key={group.value} value={group.value}>{group.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Professeur *
              </label>
              <select
                required
                value={formData.teacherId}
                onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sélectionner un professeur</option>
                {teachers.map(teacher => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name || teacher.email} ({teacher.coursesCount} cours)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jour de la semaine *
              </label>
              <select
                required
                value={formData.weekday}
                onChange={(e) => setFormData({ ...formData, weekday: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {weekDays.map(day => (
                  <option key={day.value} value={day.value}>{day.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Heure de début *
              </label>
              <input
                type="time"
                required
                value={formData.startsAt}
                onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Heure de fin *
              </label>
              <input
                type="time"
                required
                value={formData.endsAt}
                onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom de la classe (optionnel)
              </label>
              <input
                type="text"
                value={formData.className}
                onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Laissez vide pour générer automatiquement"
              />
            </div>

            <div className="md:col-span-2 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Créer le cours
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des cours */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Cours existants ({courses.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Professeur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Horaire
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Classe
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sessions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {courses.map((course) => (
                <tr key={course.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{course.name}</div>
                      <div className="text-sm text-gray-500">{getAgeGroupLabel(course.ageGroup)}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {course.teacher.user.name || course.teacher.user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {course.timetable.map((schedule) => (
                      <div key={schedule.id} className="text-sm text-gray-900">
                        {getWeekdayLabel(schedule.weekday)} {schedule.startsAt} - {schedule.endsAt}
                      </div>
                    ))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{course.class.name}</div>
                    <div className="text-sm text-gray-500">{course.class._count.students} étudiant(s)</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {course._count.sessions} session(s)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {courses.length === 0 && (
          <div className="px-6 py-8 text-center text-gray-500">
            Aucun cours créé pour le moment.
          </div>
        )}
      </div>
    </div>
  );
}

export default withAuth(BureauCoursesPage, { requiredRoles: ["ADMIN", "BUREAU"] });