import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { calculateAge, calculateJudoCategory, type Gender, type JudoCategory, type BeltColor } from "@/lib/age-utils";

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
    const { firstName, lastName, dateOfBirth, gender, age, beltColor, externalId, groupIds } = await req.json();

    if (!firstName || !lastName || !dateOfBirth || !gender || !groupIds || groupIds.length === 0) {
      return NextResponse.json({ 
        error: "firstName, lastName, dateOfBirth, gender et au moins un groupe sont requis" 
      }, { status: 400 });
    }

    // Calculer l'âge et la catégorie si non fournis
    const birthDate = new Date(dateOfBirth);
    const calculatedAge = age || calculateAge(birthDate);
    const calculatedCategory = calculateJudoCategory(birthDate);

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
          dateOfBirth: birthDate,
          age: calculatedAge,
          gender: gender as Gender,
          category: calculatedCategory,
          beltColor: (beltColor as BeltColor) || 'BLANCHE',
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

// PUT - Modifier un licencié existant (BUREAU et ADMIN)
export async function PUT(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !["ADMIN", "BUREAU"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id, firstName, lastName, dateOfBirth, gender, age, beltColor, externalId, groupIds } = await req.json();

    if (!id || !firstName || !lastName || !dateOfBirth || !gender || !groupIds || groupIds.length === 0) {
      return NextResponse.json({ 
        error: "ID, firstName, lastName, dateOfBirth, gender et au moins un groupe sont requis" 
      }, { status: 400 });
    }

    // Calculer l'âge et la catégorie si non fournis
    const birthDate = new Date(dateOfBirth);
    const calculatedAge = age || calculateAge(birthDate);
    const calculatedCategory = calculateJudoCategory(birthDate);

    // Vérifier que le licencié existe
    const existingLicensee = await prisma.licensee.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingLicensee) {
      return NextResponse.json({ error: "Licensee not found" }, { status: 404 });
    }

    // Check if external ID is unique if provided and different from current
    if (externalId && externalId !== existingLicensee.externalId) {
      const duplicateLicensee = await prisma.licensee.findUnique({
        where: { externalId }
      });
      
      if (duplicateLicensee && duplicateLicensee.id !== parseInt(id)) {
        return NextResponse.json({ 
          error: "Ce numéro de licence est déjà utilisé" 
        }, { status: 400 });
      }
    }

    // Update licensee with groups in a transaction
    const licensee = await prisma.$transaction(async (tx) => {
      // Update the licensee
      await tx.licensee.update({
        where: { id: parseInt(id) },
        data: {
          firstName,
          lastName,
          dateOfBirth: birthDate,
          age: calculatedAge,
          gender: gender as Gender,
          category: calculatedCategory,
          beltColor: (beltColor as BeltColor) || 'BLANCHE',
          externalId: externalId || null
        }
      });

      // Remove old group assignments
      await tx.licenseeGroup.deleteMany({
        where: { licenseeId: parseInt(id) }
      });

      // Assign new groups
      for (const groupId of groupIds) {
        await tx.licenseeGroup.create({
          data: {
            licenseeId: parseInt(id),
            groupId: groupId
          }
        });
      }

      // Return licensee with groups
      return await tx.licensee.findUnique({
        where: { id: parseInt(id) },
        include: {
          groups: {
            include: {
              group: true
            }
          }
        }
      });
    });

    return NextResponse.json(licensee);
  } catch (error) {
    console.error("Error updating licensee:", error);
    return NextResponse.json({ error: "Failed to update licensee" }, { status: 500 });
  }
}

// DELETE - Supprimer un licencié (BUREAU et ADMIN)
export async function DELETE(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !["ADMIN", "BUREAU"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ 
        error: "ID du licencié requis" 
      }, { status: 400 });
    }

    // Vérifier que le licencié existe
    const existingLicensee = await prisma.licensee.findUnique({
      where: { id: parseInt(id) },
      include: {
        groups: true
      }
    });

    if (!existingLicensee) {
      return NextResponse.json({ error: "Licencié non trouvé" }, { status: 404 });
    }

    // Supprimer le licencié et toutes ses relations en transaction
    await prisma.$transaction(async (tx) => {
      // Supprimer les relations avec les groupes
      await tx.licenseeGroup.deleteMany({
        where: { licenseeId: parseInt(id) }
      });

      // Supprimer les présences liées à ce licencié
      await tx.attendance.deleteMany({
        where: { licenseeId: parseInt(id) }
      });

      // Supprimer les exclusions liées à ce licencié
      await tx.courseLicenseeExclusion.deleteMany({
        where: { licenseeId: parseInt(id) }
      });

      // Supprimer le licencié lui-même
      await tx.licensee.delete({
        where: { id: parseInt(id) }
      });
    });

    return NextResponse.json({ 
      message: "Licencié supprimé avec succès",
      deletedLicensee: {
        id: existingLicensee.id,
        firstName: existingLicensee.firstName,
        lastName: existingLicensee.lastName
      }
    });
  } catch (error) {
    console.error("Error deleting licensee:", error);
    return NextResponse.json({ error: "Échec de la suppression du licencié" }, { status: 500 });
  }
}