import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET - Liste de tous les utilisateurs (ADMIN seulement)
export async function GET(req: NextRequest) {
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
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        blocked: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            sessions: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Créer un nouvel utilisateur (ADMIN seulement)
export async function POST(req: NextRequest) {
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
    const { email, name, role } = await req.json();

    if (!email || !role) {
      return NextResponse.json({ error: "Email and role are required" }, { status: 400 });
    }

    if (!["ADMIN", "BUREAU", "TEACHER"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Vérifier que l'email n'existe pas déjà
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 });
    }

    const newUser = await prisma.user.create({
      data: {
        email,
        name: name || null,
        role,
        emailVerified: false,
        blocked: false
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        blocked: true,
        emailVerified: true,
        createdAt: true
      }
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}