import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET - Liste de tous les professeurs disponibles (BUREAU et ADMIN)
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
    // Récupérer tous les utilisateurs avec le rôle TEACHER qui ne sont pas bloqués
    const teachers = await prisma.user.findMany({
      where: {
        role: "TEACHER",
        blocked: false
      },
      select: {
        id: true,
        name: true,
        email: true,
        teacher: {
          select: {
            id: true,
            _count: {
              select: {
                courses: true
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Transformer les données pour inclure les professeurs sans profil Teacher
    const teachersWithProfiles = await Promise.all(
      teachers.map(async (user) => {
        if (!user.teacher) {
          // Créer automatiquement le profil Teacher s'il n'existe pas
          const teacherProfile = await prisma.teacher.create({
            data: {
              userId: user.id
            },
            include: {
              _count: {
                select: {
                  courses: true
                }
              }
            }
          });
          
          return {
            id: teacherProfile.id,
            userId: user.id,
            name: user.name,
            email: user.email,
            coursesCount: 0
          };
        }
        
        return {
          id: user.teacher.id,
          userId: user.id,
          name: user.name,
          email: user.email,
          coursesCount: user.teacher._count.courses
        };
      })
    );

    return NextResponse.json(teachersWithProfiles);
  } catch (error) {
    console.error("Error fetching teachers:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}