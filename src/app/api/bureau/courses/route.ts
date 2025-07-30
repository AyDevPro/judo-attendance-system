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
        },
        class: {
          select: {
            id: true,
            name: true,
            _count: {
              select: {
                students: true
              }
            }
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
    const { name, ageGroup, teacherId, weekday, startsAt, endsAt, className } = await req.json();

    if (!name || !ageGroup || !teacherId || !weekday || !startsAt || !endsAt) {
      return NextResponse.json({ 
        error: "Name, ageGroup, teacherId, weekday, startsAt, and endsAt are required" 
      }, { status: 400 });
    }

    // Valider l'enum AgeGroup
    const validAgeGroups = ["BABY_JUDO", "POUSSIN", "BENJAMIN", "MINIME", "CADET", "JUNIOR", "SENIOR"];
    if (!validAgeGroups.includes(ageGroup)) {
      return NextResponse.json({ error: "Invalid age group" }, { status: 400 });
    }

    // Valider le jour de la semaine (1-7)
    if (weekday < 1 || weekday > 7) {
      return NextResponse.json({ error: "Invalid weekday (must be 1-7)" }, { status: 400 });
    }

    // Vérifier que le professeur existe et est bien un TEACHER
    const teacher = await prisma.teacher.findFirst({
      where: {
        id: parseInt(teacherId),
        user: {
          role: "TEACHER",
          blocked: false
        }
      }
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found or invalid" }, { status: 400 });
    }

    // Créer ou récupérer la classe
    let courseClass;
    if (className) {
      courseClass = await prisma.class.upsert({
        where: { name: className },
        update: {},
        create: { name: className }
      });
    } else {
      // Créer une classe par défaut basée sur le nom du cours
      courseClass = await prisma.class.upsert({
        where: { name: `Classe ${name}` },
        update: {},
        create: { name: `Classe ${name}` }
      });
    }

    // Créer le cours avec son horaire
    const course = await prisma.course.create({
      data: {
        name,
        ageGroup,
        classId: courseClass.id,
        teacherId: parseInt(teacherId),
        timetable: {
          create: {
            weekday: parseInt(weekday),
            startsAt,
            endsAt
          }
        }
      },
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
        },
        class: {
          select: {
            id: true,
            name: true
          }
        },
        timetable: true
      }
    });

    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    console.error("Error creating course:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}