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
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const teacher = await prisma.teacher.findUnique({ where: { userId: user.id } });
    if (user.role !== "ADMIN" && !(user.role === "TEACHER" && teacher && course.teacherId === teacher.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all licensees from course groups (removing duplicates)
    const allLicensees = course.groups.flatMap(cg =>
      cg.group.licensees.map(lg => lg.licensee)
    );
    const uniqueLicensees = allLicensees.filter((licensee, index, self) =>
      index === self.findIndex(l => l.id === licensee.id)
    );

    // Parse date
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);

    // Récupérer ou créer la session du cours
    let session_obj = await prisma.courseSession.findUnique({
      where: {
        courseId_date: {
          courseId: courseId,
          date: date
        }
      },
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
      }
    });

    if (!session_obj) {
      // Créer une nouvelle session
      session_obj = await prisma.courseSession.create({
        data: {
          courseId: courseId,
          date: date
        },
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
        }
      });
    }

    // Construire la liste de présences avec les licenciés manquants
    const attendanceMap = session_obj.attendance.reduce((acc: any, att: any) => {
      acc[att.licenseeId] = att;
      return acc;
    }, {});

    const attendanceList = uniqueLicensees.map((licensee: any) => {
      const existing = attendanceMap[licensee.id];
      return {
        sessionId: session_obj.id,
        licenseeId: licensee.id,
        licensee: licensee,
        status: existing?.status || null,
        remark: existing?.remark || "",
        updatedAt: existing?.updatedAt || null
      };
    });

    return NextResponse.json({
      session: {
        id: session_obj.id,
        date: session_obj.date,
        locked: session_obj.locked
      },
      attendance: attendanceList
    });

  } catch (error) {
    console.error("Error in GET attendance:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Mettre à jour les présences
export async function POST(req: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
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
    const body = await req.json();
    const { sessionId, licenseeId, status, remark } = body;

    if (!sessionId || !licenseeId) {
      return NextResponse.json({ error: "Missing sessionId or licenseeId" }, { status: 400 });
    }

    // Vérifier l'accès
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    
    if (!course || !user) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const teacher = await prisma.teacher.findUnique({ where: { userId: user.id } });
    if (user.role !== "ADMIN" && !(user.role === "TEACHER" && teacher && course.teacherId === teacher.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Vérifier si la session est verrouillée
    const courseSession = await prisma.courseSession.findUnique({ where: { id: sessionId } });
    if (courseSession?.locked) {
      return NextResponse.json({ error: "Session is locked" }, { status: 400 });
    }

    // Mettre à jour ou créer l'attendance
    const attendance = await prisma.attendance.upsert({
      where: {
        sessionId_licenseeId: {
          sessionId: sessionId,
          licenseeId: licenseeId
        }
      },
      update: {
        status: status === null ? null : status as AttendanceStatus,
        remark: remark || null,
        updatedBy: session.user.id
      },
      create: {
        sessionId: sessionId,
        licenseeId: licenseeId,
        status: status === null ? null : status as AttendanceStatus,
        remark: remark || null,
        updatedBy: session.user.id
      },
      include: {
        licensee: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    return NextResponse.json(attendance);

  } catch (error) {
    console.error("Error in POST attendance:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}