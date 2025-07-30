"use client";
import { useEffect, useState } from "react";
import { withAuth } from "@/components/withAuth";
import { useAuth } from "@/lib/auth-utils";
import Link from "next/link";

type Teacher = {
  teacher: {
    user: {
      id: string;
      name: string | null;
      email: string;
    };
  };
};

type Group = {
  group: {
    id: number;
    name: string;
    type: string;
  };
};

type Timetable = {
  id: number;
  weekday: number;
  startsAt: string;
  endsAt: string;
};

type Course = {
  id: number;
  name: string;
  teachers: Teacher[];
  groups: Group[];
  timetable: Timetable;
  _count: {
    sessions: number;
  };
};

function CoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const isBureau = user?.role === "BUREAU";

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch("/api/courses/my");
        if (res.ok) {
          const data = await res.json();
          setCourses(data);
        } else {
          const errorData = await res.json();
          setError(errorData.error || "Erreur lors du chargement des cours");
        }
      } catch (err) {
        setError("Erreur de connexion");
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const getWeekdayName = (weekday: number) => {
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    return days[weekday] || 'Inconnu';
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5); // HH:MM
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-lg p-6">
                  <div className="h-6 bg-gray-300 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                  <div className="h-10 bg-gray-300 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <div className="text-red-600 text-lg font-medium mb-2">Erreur</div>
            <div className="text-red-500">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Mes Cours
          </h1>
          <p className="text-gray-600 text-lg">
            {isBureau ? "Supervisez tous les cours du système et accédez aux présences" : "Gérez vos cours et les présences des étudiants"}
          </p>
        </div>

        {/* Contenu */}
        {courses.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {isBureau ? "Aucun cours dans le système" : "Aucun cours assigné"}
            </h3>
            <p className="text-gray-500">
              {isBureau 
                ? "Il n'y a actuellement aucun cours créé dans le système. Utilisez 'Gestion des cours' pour créer des cours."
                : "Vous n'avez actuellement aucun cours assigné. Contactez un administrateur pour vous assigner des cours."
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden group"
              >
                {/* Header coloré */}
                <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 p-6 text-white">
                  <h3 className="text-xl font-bold mb-2">{course.name}</h3>
                  <div className="flex items-center text-blue-100">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm">
                      {getWeekdayName(course.timetable.weekday)} {formatTime(course.timetable.startsAt)} - {formatTime(course.timetable.endsAt)}
                    </span>
                  </div>
                </div>

                {/* Contenu */}
                <div className="p-6">
                  {/* Professeurs */}
                  <div className="mb-4">
                    <div className="flex items-center text-gray-600 mb-2">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-sm font-medium">
                        Professeur{course.teachers.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {course.teachers.map((teacherRelation, index) => (
                        <div key={index} className="text-sm text-gray-700">
                          {teacherRelation.teacher.user.name || teacherRelation.teacher.user.email}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Groupes */}
                  <div className="mb-4">
                    <div className="flex items-center text-gray-600 mb-2">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span className="text-sm font-medium">Groupes</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {course.groups.map((groupRelation, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium"
                        >
                          {groupRelation.group.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Statistiques */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Sessions créées</span>
                      <span className="font-semibold text-gray-900">{course._count.sessions}</span>
                    </div>
                  </div>

                  {/* Action */}
                  <Link
                    href={`/courses/${course.id}`}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform group-hover:scale-105 flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2H9l-5-5 5-5z" />
                    </svg>
                    Gérer les présences
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default withAuth(CoursesPage, { requiredRoles: ["BUREAU", "TEACHER"] });