"use client";
import { useEffect, useState } from "react";
import { withTeacherAuth } from "@/components/withAuth";

type Course = { id: string; title: string; teacher?: { name?: string | null } };

function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/courses/my");
      if (res.ok) {
        const data = await res.json();
        setCourses(data);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <p>Chargement...</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Mes cours</h1>
      {courses.length === 0 && <p>Aucun cours.</p>}
      <ul className="space-y-2">
        {courses.map(c => (
          <li key={c.id} className="p-3 border rounded">
            <div className="font-semibold">{c.title}</div>
            <div className="text-sm text-gray-600">{c.teacher?.name || "—"}</div>
            <a className="underline" href={`/courses/${c.id}`}>Gérer les présences</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default withTeacherAuth(CoursesPage);
