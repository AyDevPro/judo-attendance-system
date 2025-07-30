"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { withAuth } from "@/components/withAuth";
import { useAuth, hasRole } from "@/lib/auth-utils";

interface DashboardStats {
  totalUsers?: number;
  totalCourses?: number;
  totalStudents?: number;
  myCourses?: Array<{
    id: number;
    name: string;
    ageGroup: string;
    studentsCount: number;
    nextSession?: string;
  }>;
  recentSessions?: Array<{
    id: number;
    courseName: string;
    date: string;
    attendanceRate: number;
  }>;
}

function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role) {
      loadDashboardStats();
    }
  }, [user?.role]);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      // Load different stats based on role
      if (hasRole(user, "ADMIN")) {
        await loadAdminStats();
      } else if (hasRole(user, "BUREAU")) {
        await loadBureauStats();
      } else if (hasRole(user, "TEACHER")) {
        await loadTeacherStats();
      }
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAdminStats = async () => {
    try {
      const [usersRes, coursesRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/bureau/courses")
      ]);

      const users = usersRes.ok ? await usersRes.json() : [];
      const courses = coursesRes.ok ? await coursesRes.json() : [];

      setStats({
        totalUsers: users.length,
        totalCourses: courses.length,
        totalStudents: courses.reduce((sum: number, course: any) => sum + (course.class?._count?.students || 0), 0)
      });
    } catch (error) {
      console.error("Error loading admin stats:", error);
    }
  };

  const loadBureauStats = async () => {
    try {
      const coursesRes = await fetch("/api/bureau/courses");
      const courses = coursesRes.ok ? await coursesRes.json() : [];

      setStats({
        totalCourses: courses.length,
        totalStudents: courses.reduce((sum: number, course: any) => sum + (course.class?._count?.students || 0), 0)
      });
    } catch (error) {
      console.error("Error loading bureau stats:", error);
    }
  };

  const loadTeacherStats = async () => {
    try {
      const coursesRes = await fetch("/api/courses/my");
      if (coursesRes.ok) {
        const courses = await coursesRes.json();
        setStats({
          myCourses: courses.slice(0, 5) // Show only first 5 courses
        });
      }
    } catch (error) {
      console.error("Error loading teacher stats:", error);
    }
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case "ADMIN": return "Administrateur";
      case "BUREAU": return "Bureau";
      case "TEACHER": return "Enseignant";
      default: return "Non défini";
    }
  };

  const getAgeGroupLabel = (ageGroup: string) => {
    switch (ageGroup) {
      case "BABY_JUDO": return "Baby Judo (4-5 ans)";
      case "POUSSIN": return "Poussin (6-7 ans)";
      case "BENJAMIN": return "Benjamin (8-9 ans)";
      case "MINIME": return "Minime (10-11 ans)";
      case "CADET": return "Cadet (12-13 ans)";
      case "JUNIOR": return "Junior (14-17 ans)";
      case "SENIOR": return "Senior (18+ ans)";
      default: return ageGroup;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Bienvenue, {user?.name || "utilisateur"}
            </h1>
            <p className="text-gray-600 mt-1">
              Connecté en tant que {getRoleLabel(user?.role)}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Dernière connexion</div>
            <div className="text-sm font-medium text-gray-900">
              {new Date().toLocaleDateString('fr-FR')}
            </div>
          </div>
        </div>
      </div>

      {/* Admin Dashboard */}
      {hasRole(user, "ADMIN") && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Tableau de bord Administrateur</h2>
          
          {/* Admin Stats */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">{stats.totalUsers || 0}</div>
                  <div className="text-sm text-gray-500">Utilisateurs</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">{stats.totalCourses || 0}</div>
                  <div className="text-sm text-gray-500">Cours</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">{stats.totalStudents || 0}</div>
                  <div className="text-sm text-gray-500">Étudiants</div>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Actions */}
          <div className="grid md:grid-cols-2 gap-6">
            <Link href="/admin/users" className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Gestion des utilisateurs</h3>
              <p className="text-gray-600 text-sm">Gérer les rôles, bloquer ou supprimer des utilisateurs</p>
            </Link>
            <Link href="/bureau/courses" className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Gestion des cours</h3>
              <p className="text-gray-600 text-sm">Créer et organiser les cours et leurs horaires</p>
            </Link>
          </div>
        </div>
      )}

      {/* Bureau Dashboard */}
      {hasRole(user, "BUREAU") && !hasRole(user, "ADMIN") && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Tableau de bord Bureau</h2>
          
          {/* Bureau Stats */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">{stats.totalCourses || 0}</div>
                  <div className="text-sm text-gray-500">Cours organisés</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">{stats.totalStudents || 0}</div>
                  <div className="text-sm text-gray-500">Étudiants inscrits</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bureau Actions */}
          <Link href="/bureau/courses" className="block bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Gestion des cours</h3>
            <p className="text-gray-600 text-sm">Créer de nouveaux cours, gérer les horaires et les tranches d'âge</p>
          </Link>
        </div>
      )}

      {/* Teacher Dashboard */}
      {hasRole(user, "TEACHER") && !hasRole(user, ["ADMIN", "BUREAU"]) && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Mes cours</h2>
          
          {stats.myCourses && stats.myCourses.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {stats.myCourses.map((course) => (
                <Link key={course.id} href={`/courses/${course.id}`} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-gray-900 mb-2">{course.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{getAgeGroupLabel(course.ageGroup)}</p>
                  <div className="text-xs text-gray-500">
                    {course.studentsCount} étudiant(s)
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
              <p className="text-gray-500">Aucun cours assigné pour le moment.</p>
            </div>
          )}
          
          <Link href="/courses" className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            Voir tous mes cours →
          </Link>
        </div>
      )}

      {/* Common Actions */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Actions rapides</h3>
        <div className="space-y-2">
          <Link href="/profile" className="block text-sm text-blue-600 hover:text-blue-800">
            → Modifier mon profil
          </Link>
          {hasRole(user, ["ADMIN", "TEACHER"]) && (
            <Link href="/courses" className="block text-sm text-blue-600 hover:text-blue-800">
              → Accéder aux cours
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default withAuth(DashboardPage);
