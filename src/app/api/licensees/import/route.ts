import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/auth-server-utils";
import { calculateAgeFromString, calculateJudoCategoryFromString, type Gender, type JudoCategory, type BeltColor } from "@/lib/age-utils";

interface CSVLicensee {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'M' | 'F' | 'MALE' | 'FEMALE'; // Accepter différents formats
  beltColor?: string; // couleur de ceinture
  externalId?: string; // numéro de licence
  groups: string[];
}

interface ImportResult {
  created: number;
  duplicates: number;
  errors: string[];
  summary: {
    licensees_created: CSVLicensee[];
    duplicates_ignored: CSVLicensee[];
    errors_details: Array<{ row: number; licensee: CSVLicensee; error: string }>;
  };
}

export async function POST(req: NextRequest) {
  try {
    // Vérification de l'authentification
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer l'utilisateur avec son rôle
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true, blocked: true }
    });

    if (!user || user.blocked) {
      return NextResponse.json({ error: "Utilisateur bloqué ou non trouvé" }, { status: 403 });
    }

    // Vérifier les permissions (ADMIN ou BUREAU)
    if (!hasRole(user, ["ADMIN", "BUREAU"])) {
      return NextResponse.json({ error: "Permissions insuffisantes" }, { status: 403 });
    }

    const body = await req.json();
    const { licensees }: { licensees: CSVLicensee[] } = body;

    if (!Array.isArray(licensees) || licensees.length === 0) {
      return NextResponse.json({ error: "Aucun licencié à importer" }, { status: 400 });
    }

    const result: ImportResult = {
      created: 0,
      duplicates: 0,
      errors: [],
      summary: {
        licensees_created: [],
        duplicates_ignored: [],
        errors_details: []
      }
    };

    // Récupérer tous les groupes existants
    const existingGroups = await prisma.group.findMany({
      select: { id: true, name: true }
    });
    const groupMap = new Map(existingGroups.map(g => [g.name, g.id]));

    // Traiter chaque licencié
    for (let i = 0; i < licensees.length; i++) {
      const licensee = licensees[i];
      
      try {
        // Validation des champs obligatoires
        if (!licensee.firstName || !licensee.lastName || !licensee.dateOfBirth || !licensee.gender) {
          result.errors.push(`Ligne ${i + 1}: Prénom, nom, date de naissance et sexe sont obligatoires`);
          result.summary.errors_details.push({
            row: i + 1,
            licensee,
            error: "Champs obligatoires manquants"
          });
          continue;
        }

        // Normaliser le genre
        let normalizedGender: Gender;
        const genderUpper = licensee.gender.toString().toUpperCase();
        if (genderUpper === 'M' || genderUpper === 'MALE') {
          normalizedGender = 'MALE';
        } else if (genderUpper === 'F' || genderUpper === 'FEMALE') {
          normalizedGender = 'FEMALE';
        } else if (genderUpper === 'N' || genderUpper === 'NEUTRAL' || genderUpper === 'NEUTRE') {
          normalizedGender = 'NEUTRAL';
        } else {
          result.errors.push(`Ligne ${i + 1}: Sexe invalide (doit être M/F/N ou MALE/FEMALE/NEUTRAL)`);
          result.summary.errors_details.push({
            row: i + 1,
            licensee,
            error: "Sexe invalide"
          });
          continue;
        }

        // Normaliser la couleur de ceinture
        let normalizedBeltColor: BeltColor = 'BLANCHE';
        if (licensee.beltColor) {
          const beltColorInput = licensee.beltColor.toString().toUpperCase().trim();
          const validBeltColors: BeltColor[] = ['BLANCHE', 'JAUNE', 'ORANGE', 'VERTE', 'BLEUE', 'MARRON', 'DAN_1', 'DAN_2', 'DAN_3', 'DAN_4', 'DAN_5', 'DAN_6', 'DAN_7', 'DAN_8', 'DAN_9', 'DAN_10'];
          
          // Gérer les formats de dan alternatifs
          if (beltColorInput.match(/^(\d+)(ER|E|EME)?[\s]*DAN$/)) {
            const danNumber = parseInt(beltColorInput.match(/^(\d+)/)?.[1] || '0');
            if (danNumber >= 1 && danNumber <= 10) {
              normalizedBeltColor = `DAN_${danNumber}` as BeltColor;
            } else {
              result.errors.push(`Ligne ${i + 1}: Dan invalide (${licensee.beltColor}), doit être entre 1 et 10, utilisation de BLANCHE par défaut`);
            }
          } else if (validBeltColors.includes(beltColorInput as BeltColor)) {
            normalizedBeltColor = beltColorInput as BeltColor;
          } else {
            result.errors.push(`Ligne ${i + 1}: Couleur de ceinture invalide (${licensee.beltColor}), utilisation de BLANCHE par défaut`);
          }
        }

        // Vérifier si le licencié existe déjà
        const existingLicensee = await prisma.licensee.findFirst({
          where: {
            OR: [
              // Par numéro de licence si fourni
              licensee.externalId ? { externalId: licensee.externalId } : {},
              // Par prénom + nom + date de naissance
              {
                firstName: licensee.firstName,
                lastName: licensee.lastName,
                dateOfBirth: new Date(licensee.dateOfBirth)
              }
            ].filter(condition => Object.keys(condition).length > 0)
          }
        });

        if (existingLicensee) {
          result.duplicates++;
          result.summary.duplicates_ignored.push(licensee);
          continue;
        }

        // Calculer l'âge et la catégorie à partir de la date de naissance
        const birthDate = new Date(licensee.dateOfBirth);
        const age = calculateAgeFromString(licensee.dateOfBirth);
        const category = calculateJudoCategoryFromString(licensee.dateOfBirth);

        // Créer le licencié
        const createdLicensee = await prisma.licensee.create({
          data: {
            firstName: licensee.firstName,
            lastName: licensee.lastName,
            dateOfBirth: birthDate,
            age: age,
            gender: normalizedGender,
            category: category,
            beltColor: normalizedBeltColor,
            externalId: licensee.externalId || null
          }
        });

        // Associer aux groupes
        const validGroups: number[] = [];
        const invalidGroups: string[] = [];

        for (const groupName of licensee.groups) {
          const trimmedGroupName = groupName.trim();
          if (groupMap.has(trimmedGroupName)) {
            validGroups.push(groupMap.get(trimmedGroupName)!);
          } else {
            invalidGroups.push(trimmedGroupName);
          }
        }

        // Créer les associations aux groupes valides
        if (validGroups.length > 0) {
          await prisma.licenseeGroup.createMany({
            data: validGroups.map(groupId => ({
              licenseeId: createdLicensee.id,
              groupId: groupId
            }))
          });
        }

        // Avertir des groupes invalides mais ne pas bloquer l'import
        if (invalidGroups.length > 0) {
          result.errors.push(
            `Ligne ${i + 1}: Groupes inexistants ignorés: ${invalidGroups.join(", ")}`
          );
        }

        result.created++;
        result.summary.licensees_created.push(licensee);

      } catch (error: any) {
        result.errors.push(`Ligne ${i + 1}: ${error.message}`);
        result.summary.errors_details.push({
          row: i + 1,
          licensee,
          error: error.message
        });
      }
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Erreur lors de l'import:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}