import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user;

  // Get full user data with role
  const fullUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!fullUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (fullUser.role === "ADMIN") {
    const courses = await prisma.course.findMany({ include: { teacher: true } });
    return NextResponse.json(courses);
  }
  if (fullUser.role === "TEACHER") {
    const teacher = await prisma.teacher.findUnique({ where: { userId: user.id } });
    if (!teacher) return NextResponse.json([]);
    const courses = await prisma.course.findMany({ where: { teacherId: teacher.id }, include: { teacher: true } });
    return NextResponse.json(courses);
  }
  
  return NextResponse.json([]);
}
