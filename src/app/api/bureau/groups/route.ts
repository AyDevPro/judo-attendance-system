import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !["ADMIN", "BUREAU"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const groups = await prisma.group.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            licensees: true,
            courses: true
          }
        }
      }
    });

    return NextResponse.json(groups);
  } catch (error) {
    console.error("Error fetching groups:", error);
    return NextResponse.json({ error: "Failed to fetch groups" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !["ADMIN", "BUREAU"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { name, description } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Nom du groupe requis" }, { status: 400 });
    }

    const group = await prisma.group.create({
      data: {
        name,
        description: description || null
      },
      include: {
        _count: {
          select: {
            licensees: true,
            courses: true
          }
        }
      }
    });

    return NextResponse.json(group, { status: 201 });
  } catch (error: any) {
    console.error("Error creating group:", error);
    
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Un groupe avec ce nom existe déjà" }, { status: 409 });
    }
    
    return NextResponse.json({ error: "Failed to create group" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !["ADMIN", "BUREAU"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id, name, description } = await req.json();

    if (!id || !name) {
      return NextResponse.json({ error: "ID et nom du groupe requis" }, { status: 400 });
    }

    const group = await prisma.group.update({
      where: { id },
      data: {
        name,
        description: description || null
      },
      include: {
        _count: {
          select: {
            licensees: true,
            courses: true
          }
        }
      }
    });

    return NextResponse.json(group);
  } catch (error: any) {
    console.error("Error updating group:", error);
    
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Un groupe avec ce nom existe déjà" }, { status: 409 });
    }
    
    if (error.code === 'P2025') {
      return NextResponse.json({ error: "Groupe non trouvé" }, { status: 404 });
    }
    
    return NextResponse.json({ error: "Failed to update group" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !["ADMIN", "BUREAU"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const groupId = parseInt(searchParams.get('id') || '');

    if (!groupId) {
      return NextResponse.json({ error: "ID du groupe requis" }, { status: 400 });
    }

    // Vérifier que le groupe existe
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        _count: {
          select: {
            licensees: true,
            courses: true
          }
        }
      }
    });

    if (!group) {
      return NextResponse.json({ error: "Groupe non trouvé" }, { status: 404 });
    }

    // Utilisation d'une transaction pour gérer la suppression en cascade
    await prisma.$transaction(async (tx) => {
      // 1. Supprimer toutes les relations LicenseeGroup
      await tx.licenseeGroup.deleteMany({
        where: { groupId }
      });

      // 2. Supprimer toutes les relations CourseGroup
      await tx.courseGroup.deleteMany({
        where: { groupId }
      });

      // 3. Supprimer le groupe
      await tx.group.delete({
        where: { id: groupId }
      });
    });

    return NextResponse.json({ 
      message: "Groupe supprimé avec succès", 
      affectedLicensees: group._count.licensees,
      affectedCourses: group._count.courses
    });
  } catch (error: any) {
    console.error("Error deleting group:", error);
    
    if (error.code === 'P2025') {
      return NextResponse.json({ error: "Groupe non trouvé" }, { status: 404 });
    }
    
    return NextResponse.json({ error: "Failed to delete group" }, { status: 500 });
  }
}