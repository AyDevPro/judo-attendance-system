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
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Vérifier les permissions pour le nouveau système multi-professeurs
    if (user.role === "ADMIN" || user.role === "BUREAU") {
      // ADMIN et BUREAU ont accès à tous les cours
    } else if (user.role === "TEACHER") {
      // TEACHER doit être assigné au cours
      const teacher = await prisma.teacher.findUnique({ where: { userId: user.id } });
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

    // Get all licensees from course groups (removing duplicates)
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
    
    // Filter out excluded licensees
    const activeLicensees = uniqueLicensees.filter(licensee => !excludedIds.has(licensee.id));

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

    // Construire la structure de données attendue par le frontend
    const attendanceMap = session_obj.attendance.reduce((acc: any, att: any) => {
      acc[att.licenseeId] = att;
      return acc;
    }, {});

    // Convertir les licenciés en students avec la structure attendue
    const students = activeLicensees.map((licensee: any) => ({
      id: licensee.id,
      firstName: licensee.firstName,
      lastName: licensee.lastName
    }));

    // Créer le map d'attendance avec la structure attendue
    const attendance = activeLicensees.reduce((acc: any, licensee: any) => {
      const existing = attendanceMap[licensee.id];
      acc[licensee.id] = {
        student: {
          id: licensee.id,
          firstName: licensee.firstName,
          lastName: licensee.lastName
        },
        status: existing?.status || null,
        remark: existing?.remark || ""
      };
      return acc;
    }, {});

    return NextResponse.json({
      sessionId: session_obj?.id || null,
      students: students,
      attendance: attendance
    });

  } catch (error) {
    console.error("Error in GET attendance:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Enregistrer les présences pour une session complète
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
    const { date, attendance, remarks } = body;

    if (!date) {
      return NextResponse.json({ error: "Missing date" }, { status: 400 });
    }

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
        }
      }
    });
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    
    if (!course || !user) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Vérifier les permissions
    if (user.role === "ADMIN" || user.role === "BUREAU") {
      // ADMIN et BUREAU ont accès à tous les cours
    } else if (user.role === "TEACHER") {
      // TEACHER doit être assigné au cours
      const teacher = await prisma.teacher.findUnique({ where: { userId: user.id } });
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

    // Parse date
    const sessionDate = new Date(date);
    sessionDate.setHours(0, 0, 0, 0);

    // Récupérer ou créer la session du cours
    let courseSession = await prisma.courseSession.findUnique({
      where: {
        courseId_date: {
          courseId: courseId,
          date: sessionDate
        }
      }
    });

    if (!courseSession) {
      // Créer une nouvelle session si elle n'existe pas
      courseSession = await prisma.courseSession.create({
        data: {
          courseId: courseId,
          date: sessionDate
        }
      });
    }

    // Vérifier si la session est verrouillée
    if (courseSession.locked) {
      return NextResponse.json({ error: "Session is locked" }, { status: 400 });
    }

    // Mettre à jour les présences pour tous les étudiants
    const attendanceUpdates = [];
    
    for (const [studentIdStr, status] of Object.entries(attendance || {})) {
      const studentId = parseInt(studentIdStr);
      const remark = remarks?.[studentId] || "";
      
      attendanceUpdates.push(
        prisma.attendance.upsert({
          where: {
            sessionId_licenseeId: {
              sessionId: courseSession.id,
              licenseeId: studentId
            }
          },
          update: {
            status: status === null ? null : status as AttendanceStatus,
            remark: remark || null,
            updatedBy: session.user.id
          },
          create: {
            sessionId: courseSession.id,
            licenseeId: studentId,
            status: status === null ? null : status as AttendanceStatus,
            remark: remark || null,
            updatedBy: session.user.id
          }
        })
      );
    }

    // Exécuter toutes les mises à jour en parallèle
    await Promise.all(attendanceUpdates);

    return NextResponse.json({ 
      success: true, 
      message: "Attendance saved successfully",
      sessionId: courseSession.id 
    });

  } catch (error) {
    console.error("Error in POST attendance:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}