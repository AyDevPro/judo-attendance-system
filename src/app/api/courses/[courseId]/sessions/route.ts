import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET - Récupérer l'historique des sessions d'un cours
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

  try {
    // Vérifier l'accès au cours
    const course = await prisma.course.findUnique({ 
      where: { id: courseId },
      include: {
        teacher: true
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

    if (fullUser.blocked) {
      return NextResponse.json({ error: "User is blocked" }, { status: 403 });
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

    // Récupérer toutes les sessions de ce cours
    const sessions = await prisma.courseSession.findMany({
      where: { courseId },
      include: {
        attendance: {
          include: {
            licensee: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    // Calculer les statistiques pour chaque session
    const sessionsWithStats = sessions.map(session => {
      const totalLicensees = session.attendance.length;
      const presentCount = session.attendance.filter(a => a.status === "PRESENT").length;
      const justifiedCount = session.attendance.filter(a => a.status === "JUSTIFIED").length;
      const absentCount = session.attendance.filter(a => a.status === null).length;

      return {
        id: session.id,
        date: session.date,
        locked: session.locked,
        stats: {
          totalLicensees,
          presentCount,
          justifiedCount,
          absentCount,
          attendanceRate: totalLicensees > 0 ? Math.round((presentCount / totalLicensees) * 100) : 0
        },
        attendance: session.attendance.map(a => ({
          licensee: a.licensee,
          status: a.status,
          remark: a.remark
        }))
      };
    });

    return NextResponse.json({
      courseId,
      courseName: course.name,
      sessions: sessionsWithStats
    });
  } catch (error) {
    console.error("Error fetching course sessions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}