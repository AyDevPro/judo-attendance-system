import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// DELETE - Réintégrer un licencié dans un cours (supprimer l'exclusion)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string; licenseeId: string }> }
) {
  const { courseId, licenseeId } = await params;
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const courseIdInt = parseInt(courseId);
  const licenseeIdInt = parseInt(licenseeId);

  if (isNaN(courseIdInt) || isNaN(licenseeIdInt)) {
    return NextResponse.json({ error: "Invalid course ID or licensee ID" }, { status: 400 });
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

    // Vérifier que l'exclusion existe
    const exclusion = await prisma.courseLicenseeExclusion.findUnique({
      where: {
        courseId_licenseeId: {
          courseId: courseIdInt,
          licenseeId: licenseeIdInt
        }
      },
      include: {
        licensee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            externalId: true
          }
        }
      }
    });

    if (!exclusion) {
      return NextResponse.json({ error: "Exclusion not found" }, { status: 404 });
    }

    // Supprimer l'exclusion
    await prisma.courseLicenseeExclusion.delete({
      where: {
        courseId_licenseeId: {
          courseId: courseIdInt,
          licenseeId: licenseeIdInt
        }
      }
    });

    return NextResponse.json({
      message: "Licensee successfully reintegrated",
      licensee: exclusion.licensee
    });
  } catch (error) {
    console.error("Error deleting exclusion:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}