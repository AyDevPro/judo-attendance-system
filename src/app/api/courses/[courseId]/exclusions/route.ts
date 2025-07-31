import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET - Lister les licenciés exclus d'un cours
export async function GET(req: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const courseIdInt = parseInt(courseId);
  if (isNaN(courseIdInt)) {
    return NextResponse.json({ error: "Invalid course ID" }, { status: 400 });
  }

  try {
    // Vérifier l'accès au cours
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { teacher: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Vérifier les permissions
    if (user.role === "TEACHER") {
      // Vérifier que le teacher est assigné à ce cours
      const isAssigned = await prisma.courseTeacher.findFirst({
        where: {
          courseId: courseIdInt,
          teacher: { userId: user.id }
        }
      });

      if (!isAssigned) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (!["ADMIN", "BUREAU"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Récupérer les exclusions avec les informations des licenciés
    const exclusions = await prisma.courseLicenseeExclusion.findMany({
      where: { courseId: courseIdInt },
      include: {
        licensee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            externalId: true
          }
        },
        excludedByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { excludedAt: 'desc' }
    });

    return NextResponse.json(exclusions);
  } catch (error) {
    console.error("Error fetching exclusions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Exclure un licencié d'un cours
export async function POST(req: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const courseIdInt = parseInt(courseId);
  if (isNaN(courseIdInt)) {
    return NextResponse.json({ error: "Invalid course ID" }, { status: 400 });
  }

  try {
    const { licenseeId, reason } = await req.json();

    if (!licenseeId || isNaN(parseInt(licenseeId))) {
      return NextResponse.json({ error: "Valid licenseeId is required" }, { status: 400 });
    }

    // Vérifier l'accès au cours
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { teacher: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Vérifier les permissions
    if (user.role === "TEACHER") {
      // Vérifier que le teacher est assigné à ce cours
      const isAssigned = await prisma.courseTeacher.findFirst({
        where: {
          courseId: courseIdInt,
          teacher: { userId: user.id }
        }
      });

      if (!isAssigned) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (!["ADMIN", "BUREAU"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Vérifier que le cours existe
    const course = await prisma.course.findUnique({
      where: { id: courseIdInt }
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Vérifier que le licencié existe
    const licensee = await prisma.licensee.findUnique({
      where: { id: parseInt(licenseeId) }
    });

    if (!licensee) {
      return NextResponse.json({ error: "Licensee not found" }, { status: 404 });
    }

    // Vérifier que le licencié appartient aux groupes du cours
    const isInCourseGroups = await prisma.licenseeGroup.findFirst({
      where: {
        licenseeId: parseInt(licenseeId),
        group: {
          courses: {
            some: {
              courseId: courseIdInt
            }
          }
        }
      }
    });

    if (!isInCourseGroups) {
      return NextResponse.json({ 
        error: "Licensee is not assigned to any group of this course" 
      }, { status: 400 });
    }

    // Créer l'exclusion (ou la mettre à jour si elle existe déjà)
    const exclusion = await prisma.courseLicenseeExclusion.upsert({
      where: {
        courseId_licenseeId: {
          courseId: courseIdInt,
          licenseeId: parseInt(licenseeId)
        }
      },
      update: {
        excludedAt: new Date(),
        excludedBy: user.id,
        reason: reason || null
      },
      create: {
        courseId: courseIdInt,
        licenseeId: parseInt(licenseeId),
        excludedBy: user.id,
        reason: reason || null
      },
      include: {
        licensee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            externalId: true
          }
        },
        excludedByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(exclusion, { status: 201 });
  } catch (error) {
    console.error("Error creating exclusion:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}