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
  
  // Check permissions: ADMIN or assigned TEACHER
  if (fullUser.role !== "ADMIN" && fullUser.role !== "BUREAU") {
    if (fullUser.role === "TEACHER") {
      // Get teacher info from User
      const teacher = await prisma.teacher.findUnique({ where: { userId: user.id } });
      if (!teacher) {
        return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
      }
      
      // Check if this teacher is assigned to this course
      const courseTeacher = await prisma.courseTeacher.findFirst({
        where: {
          courseId: parseInt(courseId),
          teacherId: teacher.id
        }
      });
      
      if (!courseTeacher) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }
  
  // Get licensees assigned to the course's groups
  const courseWithGroups = await prisma.course.findUnique({
    where: { id: parseInt(courseId) },
    include: {
      groups: {
        include: {
          group: {
            include: {
              licensees: {
                include: {
                  licensee: {
                    select: { id: true, firstName: true, lastName: true, externalId: true }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  if (!courseWithGroups) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  // Extract unique licensees from all groups
  const licensees = courseWithGroups.groups.flatMap(cg => 
    cg.group.licensees.map(lg => lg.licensee)
  );

  // Remove duplicates
  const uniqueLicensees = licensees.filter((licensee, index, self) =>
    index === self.findIndex(l => l.id === licensee.id)
  );

  // Get excluded licensees for this course
  const exclusions = await prisma.courseLicenseeExclusion.findMany({
    where: { courseId: parseInt(courseId) },
    select: { licenseeId: true }
  });

  const excludedIds = new Set(exclusions.map(e => e.licenseeId));

  // Filter out excluded licensees
  const activeLicensees = uniqueLicensees.filter(licensee => !excludedIds.has(licensee.id));

  return NextResponse.json(activeLicensees);
}
