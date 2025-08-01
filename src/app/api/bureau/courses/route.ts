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

// PUT - Modifier un cours existant (BUREAU et ADMIN)
export async function PUT(req: NextRequest) {
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
    const { id, name, teacherIds, groupIds, weekday, startsAt, endsAt } = await req.json();

    if (!id || !name || !teacherIds || !Array.isArray(teacherIds) || teacherIds.length === 0 || !groupIds || !Array.isArray(groupIds) || groupIds.length === 0 || !weekday || !startsAt || !endsAt) {
      return NextResponse.json({ 
        error: "ID, name, teacherIds (array), groupIds (array), weekday, startsAt, and endsAt are required" 
      }, { status: 400 });
    }

    // Vérifier que le cours existe
    const existingCourse = await prisma.course.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingCourse) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
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

    // Modifier le cours avec ses groupes et son horaire dans une transaction
    const course = await prisma.$transaction(async (tx) => {
      // Mettre à jour le cours de base
      await tx.course.update({
        where: { id: parseInt(id) },
        data: { name }
      });

      // Supprimer les anciennes assignations de professeurs
      await tx.courseTeacher.deleteMany({
        where: { courseId: parseInt(id) }
      });

      // Supprimer les anciennes assignations de groupes
      await tx.courseGroup.deleteMany({
        where: { courseId: parseInt(id) }
      });

      // Supprimer l'ancien horaire
      await tx.timetable.deleteMany({
        where: { courseId: parseInt(id) }
      });

      // Créer le nouvel horaire
      await tx.timetable.create({
        data: {
          courseId: parseInt(id),
          weekday: parseInt(weekday),
          startsAt,
          endsAt
        }
      });

      // Assigner les nouveaux professeurs au cours
      for (const teacherId of teacherIds) {
        await tx.courseTeacher.create({
          data: {
            courseId: parseInt(id),
            teacherId: parseInt(teacherId)
          }
        });
      }

      // Assigner les nouveaux groupes au cours
      for (const groupId of groupIds) {
        await tx.courseGroup.create({
          data: {
            courseId: parseInt(id),
            groupId: parseInt(groupId)
          }
        });
      }

      // Retourner le cours complet
      return await tx.course.findUnique({
        where: { id: parseInt(id) },
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

    return NextResponse.json(course);
  } catch (error) {
    console.error("Error updating course:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Supprimer un cours (BUREAU et ADMIN)
export async function DELETE(req: NextRequest) {
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
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ 
        error: "ID du cours requis" 
      }, { status: 400 });
    }

    // Vérifier que le cours existe
    const existingCourse = await prisma.course.findUnique({
      where: { id: parseInt(id) },
      include: {
        teachers: true,
        groups: true,
        timetable: true,
        _count: {
          select: {
            sessions: true
          }
        }
      }
    });

    if (!existingCourse) {
      return NextResponse.json({ error: "Cours non trouvé" }, { status: 404 });
    }

    // Supprimer le cours et toutes ses relations en transaction
    await prisma.$transaction(async (tx) => {
      // Supprimer les présences liées aux sessions de ce cours
      await tx.attendance.deleteMany({
        where: {
          session: {
            courseId: parseInt(id)
          }
        }
      });

      // Supprimer les sessions du cours
      await tx.courseSession.deleteMany({
        where: { courseId: parseInt(id) }
      });

      // Supprimer les exclusions liées à ce cours
      await tx.courseLicenseeExclusion.deleteMany({
        where: { courseId: parseInt(id) }
      });

      // Supprimer les relations avec les professeurs
      await tx.courseTeacher.deleteMany({
        where: { courseId: parseInt(id) }
      });

      // Supprimer les relations avec les groupes
      await tx.courseGroup.deleteMany({
        where: { courseId: parseInt(id) }
      });

      // Supprimer l'horaire du cours
      await tx.timetable.deleteMany({
        where: { courseId: parseInt(id) }
      });

      // Supprimer le cours lui-même
      await tx.course.delete({
        where: { id: parseInt(id) }
      });
    });

    return NextResponse.json({ 
      message: "Cours supprimé avec succès",
      deletedCourse: {
        id: existingCourse.id,
        name: existingCourse.name,
        sessionsCount: existingCourse._count.sessions
      }
    });
  } catch (error) {
    console.error("Error deleting course:", error);
    return NextResponse.json({ error: "Échec de la suppression du cours" }, { status: 500 });
  }
}