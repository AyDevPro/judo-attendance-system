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
        totalStudents: courses.reduce((sum: number, course: any) => sum + (course.groups?.reduce((groupSum: number, group: any) => groupSum + (group.licensees?.length || 0), 0) || 0), 0)
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
        totalStudents: courses.reduce((sum: number, course: any) => sum + (course.groups?.reduce((groupSum: number, group: any) => groupSum + (group.licensees?.length || 0), 0) || 0), 0)
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
    // Convert new group types to display labels
    switch (ageGroup) {
      case "PRIMA": return "Prima";
      case "J2": return "J2";
      case "J3": return "J3";
      case "J4": return "J4";
      case "J5_JUDO": return "J5 Judo";
      case "J5_JUJITSU": return "J5 Jujitsu";
      case "JUJITSU_JEUNE": return "Jujitsu Jeune";
      case "NE_WAZA": return "Ne waza";
      case "TAISO": return "Taiso";
      case "SELF_DEFENSE": return "Self-Défense";
      case "YOGA": return "Yoga";
      // Legacy support for old age groups
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-xl shadow-lg p-8 text-white overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                Bienvenue, {user?.name || "utilisateur"} 👋
              </h1>
              <p className="text-blue-100 text-lg">
                Connecté en tant que {getRoleLabel(user?.role)}
              </p>
              <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 text-white">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Dernière connexion: {new Date().toLocaleDateString('fr-FR')}
              </div>
            </div>
            <div className="hidden md:block">
              <div className="h-24 w-24 bg-white/10 rounded-full flex items-center justify-center">
                <svg className="h-12 w-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Dashboard */}
        {hasRole(user, "ADMIN") && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <svg className="w-8 h-8 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Tableau de bord Administrateur
              </h2>
              <div className="text-sm text-gray-500 bg-blue-50 px-3 py-1 rounded-full">
                Accès complet
              </div>
            </div>
            
            {/* Admin Stats */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalUsers || 0}</div>
                    <div className="text-sm font-medium text-gray-600">Utilisateurs</div>
                    <div className="text-xs text-green-600 mt-1">↗ Actifs</div>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalCourses || 0}</div>
                    <div className="text-sm font-medium text-gray-600">Cours</div>
                    <div className="text-xs text-green-600 mt-1">↗ Organisés</div>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalStudents || 0}</div>
                    <div className="text-sm font-medium text-gray-600">Licenciés</div>
                    <div className="text-xs text-green-600 mt-1">↗ Inscrits</div>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 515.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 919.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Actions */}
            <div className="grid md:grid-cols-2 gap-6">
              <Link href="/admin/users" className="group bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl hover:border-blue-300 transition-all duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Gestion des utilisateurs</h3>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">Gérer les rôles, bloquer ou supprimer des utilisateurs</p>
                    <div className="flex items-center text-blue-600 text-sm font-medium group-hover:text-blue-700">
                      Accéder
                      <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
              
              <Link href="/bureau/courses" className="group bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl hover:border-green-300 transition-all duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Gestion des cours</h3>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">Créer et organiser les cours et leurs horaires</p>
                    <div className="flex items-center text-green-600 text-sm font-medium group-hover:text-green-700">
                      Accéder
                      <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>

              <Link href="/bureau/licensees" className="group bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl hover:border-purple-300 transition-all duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 515.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 919.288 0M15 7a3 3 0 11-6 0 3 3 0 616 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Gestion des licenciés</h3>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">Ajouter et gérer les licenciés du club</p>
                    <div className="flex items-center text-purple-600 text-sm font-medium group-hover:text-purple-700">
                      Accéder
                      <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        )}

      {/* Bureau Dashboard */}
      {hasRole(user, "BUREAU") && !hasRole(user, "ADMIN") && (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <svg className="w-8 h-8 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Tableau de bord Bureau
            </h2>
            <div className="text-sm text-gray-500 bg-green-50 px-3 py-1 rounded-full">
              Gestion académique
            </div>
          </div>
          
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
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900">Actions rapides</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Link href="/profile" className="group flex items-center p-4 bg-gray-50 rounded-lg hover:bg-blue-50 hover:border-blue-200 border border-transparent transition-all duration-200">
            <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-lg flex items-center justify-center mr-3 group-hover:from-blue-500 group-hover:to-blue-600 transition-all duration-200">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600">Mon profil</div>
              <div className="text-xs text-gray-500">Modifier mes informations</div>
            </div>
          </Link>
          {hasRole(user, ["ADMIN", "TEACHER"]) && (
            <Link href="/courses" className="group flex items-center p-4 bg-gray-50 rounded-lg hover:bg-green-50 hover:border-green-200 border border-transparent transition-all duration-200">
              <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-lg flex items-center justify-center mr-3 group-hover:from-green-500 group-hover:to-green-600 transition-all duration-200">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900 group-hover:text-green-600">Mes cours</div>
                <div className="text-xs text-gray-500">Accéder aux cours</div>
              </div>
            </Link>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}

export default withAuth(DashboardPage);
