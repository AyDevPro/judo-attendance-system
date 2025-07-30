import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user;

  try {
    // Get full user data with role
    const fullUser = await prisma.user.findUnique({ 
      where: { id: user.id },
      select: { role: true, blocked: true }
    });
    
    if (!fullUser || fullUser.blocked) {
      return NextResponse.json({ error: "User not found or blocked" }, { status: 404 });
    }

    if (fullUser.role === "BUREAU") {
      // Bureau peut voir tous les cours (comme admin avant)
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
            },
            take: 1
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
    }
    
    if (fullUser.role === "TEACHER") {
      // Trouver le profil Teacher
      let teacher = await prisma.teacher.findUnique({ 
        where: { userId: user.id },
        select: { id: true }
      });
      
      // Créer automatiquement le profil si il n'existe pas
      if (!teacher) {
        teacher = await prisma.teacher.create({
          data: { userId: user.id },
          select: { id: true }
        });
      }
      
      // Récupérer les cours où ce professeur est assigné
      const courses = await prisma.course.findMany({
        where: {
          teachers: {
            some: {
              teacherId: teacher.id
            }
          }
        },
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
            },
            take: 1
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
    }
    
    return NextResponse.json([]);
  } catch (error) {
    console.error("Error fetching user courses:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
