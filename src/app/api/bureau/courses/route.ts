import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET - Liste de tous les cours (BUREAU et ADMIN)
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Vérifier que l'utilisateur est BUREAU ou ADMIN
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, blocked: true }
  });

  if (!user || user.blocked || !["ADMIN", "BUREAU"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const courses = await prisma.course.findMany({
      include: {
        teachers: {
          include: {
            teacher: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        },
        groups: {
          include: {
            group: true
          }
        },
        timetable: {
          select: {
            id: true,
            weekday: true,
            startsAt: true,
            endsAt: true
          }
        },
        _count: {
          select: {
            sessions: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(courses);
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Créer un nouveau cours (BUREAU et ADMIN)
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Vérifier que l'utilisateur est BUREAU ou ADMIN
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, blocked: true }
  });

  if (!user || user.blocked || !["ADMIN", "BUREAU"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { name, teacherIds, groupIds, weekday, startsAt, endsAt } = await req.json();

    if (!name || !teacherIds || !Array.isArray(teacherIds) || teacherIds.length === 0 || !groupIds || !Array.isArray(groupIds) || groupIds.length === 0 || !weekday || !startsAt || !endsAt) {
      return NextResponse.json({ 
        error: "Name, teacherIds (array), groupIds (array), weekday, startsAt, and endsAt are required" 
      }, { status: 400 });
    }

    // Valider le jour de la semaine (1-7)
    if (weekday < 1 || weekday > 7) {
      return NextResponse.json({ error: "Invalid weekday (must be 1-7)" }, { status: 400 });
    }

    // Vérifier que tous les professeurs existent et sont bien des TEACHER
    const teachers = await prisma.teacher.findMany({
      where: {
        id: {
          in: teacherIds.map(id => parseInt(id))
        },
        user: {
          role: "TEACHER",
          blocked: false
        }
      }
    });

    if (teachers.length !== teacherIds.length) {
      return NextResponse.json({ error: "One or more teachers not found or invalid" }, { status: 400 });
    }

    // Vérifier que tous les groupes existent
    const validGroups = await prisma.group.findMany({
      where: {
        id: {
          in: groupIds.map(id => parseInt(id))
        }
      }
    });

    if (validGroups.length !== groupIds.length) {
      return NextResponse.json({ error: "One or more groups not found" }, { status: 400 });
    }

    // Créer le cours avec ses groupes et son horaire dans une transaction
    const course = await prisma.$transaction(async (tx) => {
      // Créer le cours
      const newCourse = await tx.course.create({
        data: {
          name,
          timetable: {
            create: {
              weekday: parseInt(weekday),
              startsAt,
              endsAt
            }
          }
        }
      });

      // Assigner les professeurs au cours
      for (const teacherId of teacherIds) {
        await tx.courseTeacher.create({
          data: {
            courseId: newCourse.id,
            teacherId: parseInt(teacherId)
          }
        });
      }

      // Assigner les groupes au cours
      for (const groupId of groupIds) {
        await tx.courseGroup.create({
          data: {
            courseId: newCourse.id,
            groupId: parseInt(groupId)
          }
        });
      }

      // Retourner le cours complet
      return await tx.course.findUnique({
        where: { id: newCourse.id },
        include: {
          teachers: {
            include: {
              teacher: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true
                    }
                  }
                }
              }
            }
          },
          groups: {
            include: {
              group: true
            }
          },
          timetable: {
            select: {
              id: true,
              weekday: true,
              startsAt: true,
              endsAt: true
            }
          }
        }
      });
    });

    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    console.error("Error creating course:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}