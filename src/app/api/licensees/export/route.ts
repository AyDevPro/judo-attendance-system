import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/auth-server-utils";
import { getJudoCategoryDisplayName, getGenderDisplayName, getBeltColorDisplayName } from "@/lib/age-utils";

export async function GET(req: NextRequest) {
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

    // Récupérer tous les licenciés avec leurs groupes
    const licensees = await prisma.licensee.findMany({
      include: {
        groups: {
          include: {
            group: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' }
      ]
    });

    // Convertir en format CSV
    const csvHeader = "Prénom,Nom,Date de naissance,Âge,Sexe,Catégorie,Couleur de ceinture,Numéro de licence,Groupe(s)";
    const csvRows = [csvHeader];

    licensees.forEach(licensee => {
      const groupNames = licensee.groups.map(lg => lg.group.name).join(',');
      const dateOfBirth = licensee.dateOfBirth.toISOString().split('T')[0];
      
      const row = [
        `"${licensee.firstName}"`,
        `"${licensee.lastName}"`,
        dateOfBirth,
        licensee.age.toString(),
        `"${getGenderDisplayName(licensee.gender)}"`,
        `"${getJudoCategoryDisplayName(licensee.category)}"`,
        `"${getBeltColorDisplayName(licensee.beltColor)}"`,
        licensee.externalId || '',
        groupNames ? `"${groupNames}"` : ''
      ].join(',');
      
      csvRows.push(row);
    });

    const csvContent = csvRows.join('\n');
    
    // Générer le nom de fichier avec la date
    const now = new Date();
    const timestamp = now.toISOString().split('T')[0];
    const filename = `licensees_export_${timestamp}.csv`;

    // Retourner le CSV avec les headers appropriés
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="${filename}"`,
        'cache-control': 'no-cache',
      },
    });

  } catch (error: any) {
    console.error("Erreur lors de l'export:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}