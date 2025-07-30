import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// PUT - Mettre à jour un utilisateur (rôle, statut bloqué)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const session = await auth.api.getSession({ headers: req.headers });
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Vérifier que l'utilisateur est admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, blocked: true }
  });

  if (!user || user.blocked || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { role, blocked, name } = await req.json();

    // Empêcher un admin de se bloquer lui-même
    if (userId === session.user.id && blocked === true) {
      return NextResponse.json({ error: "Cannot block yourself" }, { status: 400 });
    }

    // Empêcher un admin de retirer son propre rôle d'admin
    if (userId === session.user.id && role !== undefined && role !== "ADMIN") {
      return NextResponse.json({ error: "Cannot change your own admin role" }, { status: 400 });
    }

    const updates: any = {};
    if (role !== undefined) {
      if (!["ADMIN", "BUREAU", "TEACHER"].includes(role)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
      updates.role = role;
    }
    if (blocked !== undefined) {
      updates.blocked = blocked;
    }
    if (name !== undefined) {
      updates.name = name;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updates,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        blocked: true,
        emailVerified: true,
        updatedAt: true
      }
    });

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Supprimer un utilisateur
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const session = await auth.api.getSession({ headers: req.headers });
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Vérifier que l'utilisateur est admin  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, blocked: true }
  });

  if (!user || user.blocked || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Empêcher un admin de se supprimer lui-même
  if (userId === session.user.id) {
    return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
  }

  try {
    await prisma.user.delete({
      where: { id: userId }
    });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}