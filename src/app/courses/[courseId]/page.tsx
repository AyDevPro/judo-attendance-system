"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { withAuth } from "@/components/withAuth";

interface Student {
  id: number;
  firstName: string;
  lastName: string;
}

interface AttendanceData {
  sessionId: number | null;
  attendance: Record<number, {
    student: Student;
    status: "PRESENT" | "JUSTIFIED" | null;
    remark: string | null;
  }>;
  students: Student[];
}

interface SessionHistory {
  id: number;
  date: string;
  locked: boolean;
  stats: {
    totalStudents: number;
    presentCount: number;
    justifiedCount: number;
    absentCount: number;
    attendanceRate: number;
  };
  attendance: Array<{
    student: Student;
    status: "PRESENT" | "JUSTIFIED" | null;
    remark: string | null;
  }>;
}

type AttendanceStatus = "PRESENT" | "JUSTIFIED" | null;

function CourseDetailPage() {
  const params = useParams<{ courseId: string }>();
  const router = useRouter();
  const courseId = params.courseId;
  
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null);
  const [sessionHistory, setSessionHistory] = useState<SessionHistory[]>([]);
  const [date, setDate] = useState<string>("");
  const [attendance, setAttendance] = useState<Record<number, AttendanceStatus>>({});
  const [remarks, setRemarks] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionHistory | null>(null);

  // Set date to today by default
  useEffect(() => {
    const today = new Date();
    const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000);
    setDate(localDate.toISOString().slice(0, 16));
  }, []);

  // Load attendance data when date changes
  useEffect(() => {
    if (date && courseId) {
      loadAttendanceData();
    }
  }, [date, courseId]);

  // Load session history
  useEffect(() => {
    if (courseId) {
      loadSessionHistory();
    }
  }, [courseId]);

  const loadAttendanceData = async () => {
    try {
      setLoading(true);
      const dateOnly = date.split('T')[0]; // Get just the date part
      const response = await fetch(`/api/courses/${courseId}/attendance?date=${dateOnly}`);
      
      if (!response.ok) {
        if (response.status === 403) {
          setError("Accès interdit");
          return;
        } else if (response.status === 401) {
          router.replace("/sign-in");
          return;
        }
        throw new Error("Failed to load attendance data");
      }

      const data: AttendanceData = await response.json();
      setAttendanceData(data);
      
      // Initialize attendance and remarks state
      const initialAttendance: Record<number, AttendanceStatus> = {};
      const initialRemarks: Record<number, string> = {};
      
      Object.entries(data.attendance).forEach(([studentId, record]) => {
        initialAttendance[parseInt(studentId)] = record.status;
        initialRemarks[parseInt(studentId)] = record.remark || "";
      });
      
      setAttendance(initialAttendance);
      setRemarks(initialRemarks);
    } catch (error) {
      console.error("Error loading attendance:", error);
      setError("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const loadSessionHistory = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}/sessions`);
      if (response.ok) {
        const data = await response.json();
        setSessionHistory(data.sessions || []);
      }
    } catch (error) {
      console.error("Error loading session history:", error);
    }
  };

  const getNextStatus = (currentStatus: AttendanceStatus): AttendanceStatus => {
    switch (currentStatus) {
      case null: return "PRESENT";
      case "PRESENT": return "JUSTIFIED";
      case "JUSTIFIED": return null;
    }
  };

  const getStatusDisplay = (status: AttendanceStatus) => {
    switch (status) {
      case "PRESENT": return { label: "Présent", color: "bg-green-100 text-green-800", icon: "✓" };
      case "JUSTIFIED": return { label: "Absence justifiée", color: "bg-yellow-100 text-yellow-800", icon: "J" };
      case null: return { label: "Absent", color: "bg-red-100 text-red-800", icon: "✗" };
    }
  };

  const handleAttendanceClick = (studentId: number) => {
    const currentStatus = attendance[studentId] || null;
    const nextStatus = getNextStatus(currentStatus);
    setAttendance(prev => ({ ...prev, [studentId]: nextStatus }));
  };

  const handleRemarkChange = (studentId: number, remark: string) => {
    setRemarks(prev => ({ ...prev, [studentId]: remark }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/courses/${courseId}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: date.split('T')[0], // Send just the date part
          attendance,
          remarks
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save attendance");
      }

      alert("Présences enregistrées avec succès !");
      // Reload data to reflect changes
      await loadAttendanceData();
    } catch (error: any) {
      setError("Erreur: " + error.message);
    } finally {
      setSaving(false);
    }
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
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (!attendanceData) {
    return <div>Aucune donnée disponible</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Feuille de présence</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="px-4 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200"
          >
            {showHistory ? "Masquer l'historique" : "Voir l'historique"}
          </button>
          <button
            onClick={() => router.push("/courses")}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            ← Retour aux cours
          </button>
        </div>
      </div>

      {/* Date selector */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Date du cours
        </label>
        <input
          type="date"
          value={date.split('T')[0]}
          onChange={(e) => setDate(e.target.value + 'T10:00')}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Comment utiliser :</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• <strong>Cliquez une fois</strong> sur un étudiant : Présent ✓</p>
          <p>• <strong>Cliquez deux fois</strong> : Absence justifiée (J)</p>
          <p>• <strong>Cliquez trois fois</strong> : Absent ✗</p>
          <p>• Ajoutez des remarques si nécessaire</p>
        </div>
      </div>

      {/* Attendance form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Étudiants ({attendanceData.students.length})
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {attendanceData.students.map((student) => {
              const status = attendance[student.id] || null;
              const statusDisplay = getStatusDisplay(status);
              
              return (
                <div key={student.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Student info */}
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900">
                          {student.firstName} {student.lastName}
                        </h3>
                      </div>

                      {/* Status button */}
                      <button
                        type="button"
                        onClick={() => handleAttendanceClick(student.id)}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors ${statusDisplay.color} hover:opacity-80`}
                      >
                        <span className="mr-1">{statusDisplay.icon}</span>
                        {statusDisplay.label}
                      </button>
                    </div>
                  </div>

                  {/* Remarks */}
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Remarque (optionnel)
                    </label>
                    <input
                      type="text"
                      value={remarks[student.id] || ""}
                      onChange={(e) => handleRemarkChange(student.id, e.target.value)}
                      placeholder="Ajouter une remarque..."
                      className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Enregistrement..." : "Enregistrer les présences"}
          </button>
        </div>
      </form>

      {/* Summary */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Résumé</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-green-50 p-3 rounded">
            <div className="text-lg font-semibold text-green-600">
              {Object.values(attendance).filter(s => s === "PRESENT").length}
            </div>
            <div className="text-xs text-green-600">Présents</div>
          </div>
          <div className="bg-yellow-50 p-3 rounded">
            <div className="text-lg font-semibold text-yellow-600">
              {Object.values(attendance).filter(s => s === "JUSTIFIED").length}
            </div>
            <div className="text-xs text-yellow-600">Justifiés</div>
          </div>
          <div className="bg-red-50 p-3 rounded">
            <div className="text-lg font-semibold text-red-600">
              {Object.values(attendance).filter(s => s === null).length}
            </div>
            <div className="text-xs text-red-600">Absents</div>
          </div>
        </div>
      </div>

      {/* History Section */}
      {showHistory && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Historique des sessions ({sessionHistory.length})
            </h2>
          </div>

          {sessionHistory.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              Aucune session enregistrée pour ce cours.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {sessionHistory.map((session) => (
                <div key={session.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">
                            {new Date(session.date).toLocaleDateString('fr-FR', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </h3>
                          <p className="text-xs text-gray-500">
                            Taux de présence: {session.stats.attendanceRate}%
                          </p>
                        </div>
                        
                        <div className="flex space-x-4 text-xs">
                          <span className="text-green-600">
                            ✓ {session.stats.presentCount} présents
                          </span>
                          <span className="text-yellow-600">
                            J {session.stats.justifiedCount} justifiés
                          </span>
                          <span className="text-red-600">
                            ✗ {session.stats.absentCount} absents
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setSelectedSession(selectedSession?.id === session.id ? null : session)}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      {selectedSession?.id === session.id ? "Fermer" : "Détails"}
                    </button>
                  </div>

                  {/* Session details */}
                  {selectedSession?.id === session.id && (
                    <div className="mt-4 border-t border-gray-200 pt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Détail des présences :</h4>
                      <div className="grid gap-2 max-h-60 overflow-y-auto">
                        {session.attendance.map((record) => {
                          const statusDisplay = getStatusDisplay(record.status);
                          return (
                            <div key={record.student.id} className="flex items-center justify-between text-sm">
                              <span className="text-gray-900">
                                {record.student.firstName} {record.student.lastName}
                              </span>
                              <div className="flex items-center space-x-2">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusDisplay.color}`}>
                                  <span className="mr-1">{statusDisplay.icon}</span>
                                  {statusDisplay.label}
                                </span>
                                {record.remark && (
                                  <span className="text-gray-500 italic text-xs">
                                    "{record.remark}"
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default withAuth(CourseDetailPage, { requiredRoles: ["BUREAU", "TEACHER"] });
