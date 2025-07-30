// src/app/api/courses/[courseId]/attendance/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { AttendanceStatus } from "@prisma/client";

// GET - Récupérer les présences pour une date spécifique
export async function GET(req: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { courseId: courseIdStr } = await params;
  const courseId = Number(courseIdStr);
  if (!Number.isFinite(courseId)) {
    return NextResponse.json({ error: "Bad courseId" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get('date');

  if (!dateStr) {
    return NextResponse.json({ error: "Missing date parameter" }, { status: 400 });
  }

  try {
    // Vérifier l'accès au cours
    const course = await prisma.course.findUnique({ 
      where: { id: courseId },
      include: {
        teacher: true,
        class: {
          include: {
            students: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Vérifier les permissions
    const fullUser = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!fullUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (fullUser.role !== "ADMIN" && fullUser.role !== "TEACHER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (fullUser.role === "TEACHER") {
      const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } });
      if (!teacher || teacher.id !== course.teacherId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const sessionDate = new Date(dateStr);
    
    // Récupérer la session de cours s'elle existe
    const courseSession = await prisma.courseSession.findUnique({
      where: {
        courseId_date: { courseId, date: sessionDate }
      },
      include: {
        attendance: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    // Préparer la réponse avec tous les étudiants
    const attendanceData = course.class.students.reduce((acc, student) => {
      const attendance = courseSession?.attendance.find(a => a.studentId === student.id);
      acc[student.id] = {
        student: {
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName
        },
        status: attendance?.status || null,
        remark: attendance?.remark || null
      };
      return acc;
    }, {} as Record<number, any>);

    return NextResponse.json({
      sessionId: courseSession?.id || null,
      attendance: attendanceData,
      students: course.class.students
    });
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
  // Auth
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user; // { id: string, role: 'ADMIN' | 'TEACHER' | ... }

  // Params + payload
  const { courseId: courseIdStr } = await params;
  const courseId = Number(courseIdStr);
  if (!Number.isFinite(courseId)) {
    return NextResponse.json({ error: "Bad courseId" }, { status: 400 });
  }
  const body = await req.json();
  const dateStr: string = body?.date;
  const attendance: Record<string, "PRESENT" | "JUSTIFIED" | null> = body?.attendance ?? {}; // { [studentId]: status }
  const remarks: Record<string, string> = body?.remarks ?? {}; // { [studentId]: remark }

  if (!dateStr) {
    return NextResponse.json({ error: "Missing date" }, { status: 400 });
  }

  // Cours
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course)
    return NextResponse.json({ error: "Cours introuvable" }, { status: 404 });

  // Get full user data with role
  const fullUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!fullUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Autorisation :
  // - ADMIN : OK
  // - TEACHER : il doit être le prof du cours (via Teacher.userId === user.id)
  if (fullUser.role !== "ADMIN") {
    if (fullUser.role !== "TEACHER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const teacher = await prisma.teacher.findUnique({
      where: { userId: user.id },
    });
    if (!teacher || teacher.id !== course.teacherId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // Créer / trouver la session de cours à cette date
  const sessionDate = new Date(dateStr); // ex: "2025-09-01"
  // Si tu as @@unique([courseId, date]) et que tu veux éviter une violation d'unicité :
  const courseSession = await prisma.courseSession.upsert({
    where: { courseId_date: { courseId, date: sessionDate } },
    update: {},
    create: { courseId, date: sessionDate },
  });

  // Les élèves inscrits au cours = élèves de la classe du cours
  const students = await prisma.student.findMany({
    where: { classId: course.classId },
    select: { id: true },
  });
  const validIds = new Set(students.map((s) => s.id));

  // Construire les lignes de présence pour tous les étudiants
  const rows = students.map(student => {
    const studentId = student.id.toString();
    const status = attendance[studentId];
    const remark = remarks[studentId] || null;
    
    return {
      sessionId: courseSession.id,
      studentId: student.id,
      status: status === "PRESENT" ? AttendanceStatus.PRESENT : 
              status === "JUSTIFIED" ? AttendanceStatus.JUSTIFIED : null,
      remark,
      updatedBy: user.id,
    };
  });

  // Upsert les présences pour tous les étudiants
  for (const row of rows) {
    await prisma.attendance.upsert({
      where: {
        sessionId_studentId: {
          sessionId: row.sessionId,
          studentId: row.studentId
        }
      },
      update: {
        status: row.status,
        remark: row.remark,
        updatedBy: row.updatedBy
      },
      create: row
    });
  }

  return NextResponse.json({ ok: true, sessionId: courseSession.id });
}
