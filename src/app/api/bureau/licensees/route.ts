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
    const licensees = await prisma.licensee.findMany({
      include: {
        groups: {
          include: {
            group: true
          },
          orderBy: {
            assignedAt: 'asc'
          }
        }
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' }
      ]
    });

    return NextResponse.json(licensees);
  } catch (error) {
    console.error("Error fetching licensees:", error);
    return NextResponse.json({ error: "Failed to fetch licensees" }, { status: 500 });
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
    const { firstName, lastName, dateOfBirth, age, externalId, groupIds } = await req.json();

    if (!firstName || !lastName || !dateOfBirth || !groupIds || groupIds.length === 0) {
      return NextResponse.json({ 
        error: "firstName, lastName, dateOfBirth et au moins un groupe sont requis" 
      }, { status: 400 });
    }

    // Check if external ID is unique if provided
    if (externalId) {
      const existingLicensee = await prisma.licensee.findUnique({
        where: { externalId }
      });
      
      if (existingLicensee) {
        return NextResponse.json({ 
          error: "Ce numéro de licence est déjà utilisé" 
        }, { status: 400 });
      }
    }

    // Create licensee with groups in a transaction
    const licensee = await prisma.$transaction(async (tx) => {
      // Create the licensee
      const newLicensee = await tx.licensee.create({
        data: {
          firstName,
          lastName,
          dateOfBirth: new Date(dateOfBirth),
          age,
          externalId: externalId || null
        }
      });

      // Assign groups
      for (const groupId of groupIds) {
        await tx.licenseeGroup.create({
          data: {
            licenseeId: newLicensee.id,
            groupId: groupId
          }
        });
      }

      // Return licensee with groups
      return await tx.licensee.findUnique({
        where: { id: newLicensee.id },
        include: {
          groups: {
            include: {
              group: true
            }
          }
        }
      });
    });

    return NextResponse.json(licensee, { status: 201 });
  } catch (error) {
    console.error("Error creating licensee:", error);
    return NextResponse.json({ error: "Failed to create licensee" }, { status: 500 });
  }
}