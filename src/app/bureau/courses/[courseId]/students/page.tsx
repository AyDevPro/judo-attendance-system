"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { withAuth } from "@/components/withAuth";

interface Student {
  id: number;
  firstName: string;
  lastName: string;
  externalId: string | null;
}

interface Exclusion {
  id: number;
  licenseeId: number;
  excludedAt: string;
  reason: string | null;
  licensee: Student;
  excludedByUser: {
    id: string;
    name: string | null;
    email: string;
  };
}

function CourseStudentsPage() {
  const params = useParams<{ courseId: string }>();
  const router = useRouter();
  const courseId = params.courseId;
  
  const [students, setStudents] = useState<Student[]>([]);
  const [excludedStudents, setExcludedStudents] = useState<Exclusion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courseName, setCourseName] = useState<string>("");
  const [showExclusionModal, setShowExclusionModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [exclusionReason, setExclusionReason] = useState("");

  useEffect(() => {
    if (courseId) {
      loadData();
    }
  }, [courseId]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadActiveStudents(),
        loadExcludedStudents(),
        loadCourseInfo()
      ]);
    } catch (error) {
      console.error("Error loading data:", error);
      setError("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const loadActiveStudents = async () => {
    const response = await fetch(`/api/courses/${courseId}/students`);
    if (!response.ok) {
      throw new Error("Failed to load students");
    }
    const data = await response.json();
    setStudents(data);
  };

  const loadExcludedStudents = async () => {
    const response = await fetch(`/api/courses/${courseId}/exclusions`);
    if (!response.ok) {
      throw new Error("Failed to load exclusions");
    }
    const data = await response.json();
    setExcludedStudents(data);
  };

  const loadCourseInfo = async () => {
    // Get course name from sessions endpoint which includes course info
    const response = await fetch(`/api/courses/${courseId}/sessions`);
    if (response.ok) {
      const data = await response.json();
      setCourseName(data.courseName || `Cours ${courseId}`);
    }
  };

  const handleExcludeStudent = async (student: Student) => {
    setSelectedStudent(student);
    setShowExclusionModal(true);
  };

  const confirmExclusion = async () => {
    if (!selectedStudent) return;

    try {
      const response = await fetch(`/api/courses/${courseId}/exclusions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          licenseeId: selectedStudent.id,
          reason: exclusionReason.trim() || null
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to exclude student");
      }

      // Refresh data
      await loadData();
      
      // Reset modal
      setShowExclusionModal(false);
      setSelectedStudent(null);
      setExclusionReason("");
      
      alert(`${selectedStudent.firstName} ${selectedStudent.lastName} a été exclu(e) du cours.`);
    } catch (error: any) {
      alert("Erreur: " + error.message);
    }
  };

  const handleReintegrateStudent = async (exclusion: Exclusion) => {
    const student = exclusion.licensee;
    const confirmReintegration = confirm(
      `Êtes-vous sûr de vouloir réintégrer ${student.firstName} ${student.lastName} dans ce cours ?`
    );

    if (!confirmReintegration) return;

    try {
      const response = await fetch(`/api/courses/${courseId}/exclusions/${student.id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to reintegrate student");
      }

      // Refresh data
      await loadData();
      
      alert(`${student.firstName} ${student.lastName} a été réintégré(e) dans le cours.`);
    } catch (error: any) {
      alert("Erreur: " + error.message);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
        <button onClick={loadData} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => router.back()}
                className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Retour
              </button>
              <h1 className="text-3xl font-bold text-gray-900">Gestion des licenciés</h1>
              <p className="mt-2 text-sm text-gray-600">
                {courseName} • {students.length} actifs • {excludedStudents.length} exclus
              </p>
            </div>
          </div>
        </div>

        {/* Licenciés actifs */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <svg className="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Licenciés actifs
              </h2>
              <span className="bg-green-100 text-green-800 text-xs font-medium px-3 py-1 rounded-full">
                {students.length} licencié{students.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Licencié
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Licence
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-green-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900">
                            {student.firstName} {student.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {student.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {student.externalId ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {student.externalId}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleExcludeStudent(student)}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg bg-red-50 text-red-700 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                        </svg>
                        Exclure
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {students.length === 0 && (
            <div className="px-6 py-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="mt-4 text-sm font-medium text-gray-900">Aucun licencié actif</h3>
              <p className="mt-2 text-sm text-gray-500">
                Tous les licenciés de ce cours ont été exclus ou il n'y a pas de licenciés assignés.
              </p>
            </div>
          )}
        </div>

        {/* Licenciés exclus */}
        {excludedStudents.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-red-50 to-pink-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <svg className="w-6 h-6 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                  </svg>
                  Licenciés exclus
                </h2>
                <span className="bg-red-100 text-red-800 text-xs font-medium px-3 py-1 rounded-full">
                  {excludedStudents.length} exclus
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Licencié
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Licence
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Exclu le
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Raison
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {excludedStudents.map((exclusion) => (
                    <tr key={exclusion.id} className="hover:bg-red-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center">
                              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900">
                              {exclusion.licensee.firstName} {exclusion.licensee.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              Par: {exclusion.excludedByUser.name || exclusion.excludedByUser.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {exclusion.licensee.externalId ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {exclusion.licensee.externalId}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(exclusion.excludedAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {exclusion.reason ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              {exclusion.reason}
                            </span>
                          ) : (
                            <span className="text-gray-400">Aucune raison spécifiée</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleReintegrateStudent(exclusion)}
                          className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg bg-green-50 text-green-700 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Réintégrer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal d'exclusion */}
        {showExclusionModal && selectedStudent && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center mb-4">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                    <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 text-center mb-4">
                  Exclure {selectedStudent.firstName} {selectedStudent.lastName}
                </h3>
                <p className="text-sm text-gray-500 text-center mb-4">
                  Cette action masquera ce licencié des listes de présence et des statistiques du cours.
                </p>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Raison de l'exclusion (optionnel)
                  </label>
                  <textarea
                    value={exclusionReason}
                    onChange={(e) => setExclusionReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    rows={3}
                    placeholder="Ex: Absence prolongée, suspension disciplinaire..."
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowExclusionModal(false);
                      setSelectedStudent(null);
                      setExclusionReason("");
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={confirmExclusion}
                    className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    Confirmer l'exclusion
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default withAuth(CourseStudentsPage, { requiredRoles: ["ADMIN", "BUREAU"] });