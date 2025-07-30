import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user;
  const course = await prisma.course.findUnique({ where: { id: parseInt(courseId) } });
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });
  
  // Get full user data with role
  const fullUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!fullUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  
  // Get teacher info from User
  const teacher = await prisma.teacher.findUnique({ where: { userId: user.id } });
  if (fullUser.role !== "ADMIN" && !(fullUser.role === "TEACHER" && teacher && course.teacherId === teacher.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  
  const students = await prisma.student.findMany({
    where: { classId: course.classId },
    select: { id: true, firstName: true, lastName: true, externalId: true }
  });
  return NextResponse.json(students);
}
