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
        teachers: {
          include: {
            teacher: {
              select: {
                id: true,
                userId: true
              }
            }
          }
        },
        groups: {
          include: {
            group: {
              include: {
                licensees: {
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

    if (fullUser.blocked) {
      return NextResponse.json({ error: "User is blocked" }, { status: 403 });
    }

    // Vérifier les permissions pour le nouveau système multi-professeurs
    if (fullUser.role === "ADMIN" || fullUser.role === "BUREAU") {
      // ADMIN et BUREAU ont accès à tous les cours
    } else if (fullUser.role === "TEACHER") {
      // TEACHER doit être assigné au cours
      const teacher = await prisma.teacher.findUnique({ where: { userId: fullUser.id } });
      if (!teacher) {
        return NextResponse.json({ error: "Teacher profile not found" }, { status: 403 });
      }
      
      const isAssignedToThisCourse = course.teachers.some(ct => ct.teacherId === teacher.id);
      if (!isAssignedToThisCourse) {
        return NextResponse.json({ error: "Not assigned to this course" }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Get all active (non-excluded) licensees for this course
    const allLicensees = course.groups.flatMap(cg =>
      cg.group.licensees.map(lg => lg.licensee)
    );
    const uniqueLicensees = allLicensees.filter((licensee, index, self) =>
      index === self.findIndex(l => l.id === licensee.id)
    );

    // Get excluded licensees for this course
    const exclusions = await prisma.courseLicenseeExclusion.findMany({
      where: { courseId: courseId },
      select: { licenseeId: true }
    });
    
    const excludedIds = new Set(exclusions.map(e => e.licenseeId));
    const activeLicenseeIds = new Set(
      uniqueLicensees.filter(licensee => !excludedIds.has(licensee.id)).map(l => l.id)
    );

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

    // Calculer les statistiques pour chaque session (en excluant les licenciés masqués)
    const sessionsWithStats = sessions.map(session => {
      // Filter attendance to only include active licensees
      const activeAttendance = session.attendance.filter(a => activeLicenseeIds.has(a.licenseeId));
      
      const totalStudents = activeLicenseeIds.size; // Total des licenciés actifs
      const presentCount = activeAttendance.filter(a => a.status === "PRESENT").length;
      const justifiedCount = activeAttendance.filter(a => a.status === "JUSTIFIED").length;
      const absentCount = totalStudents - presentCount - justifiedCount; // Ceux qui n'ont pas de statut

      return {
        id: session.id,
        date: session.date,
        locked: session.locked,
        stats: {
          totalStudents,
          presentCount,
          justifiedCount,
          absentCount,
          attendanceRate: totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0
        },
        attendance: activeAttendance.map(a => ({
          student: a.licensee, // Renaming for frontend compatibility
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