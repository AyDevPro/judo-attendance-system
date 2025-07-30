import { PrismaClient } from '@prisma/client';
import { auth } from '../src/lib/auth';

const prisma = new PrismaClient();

const users = [
  {
    email: 'bureau@email.com',
    password: 'password123',
    name: 'Bureau',
    role: 'BUREAU' as const
  },
  {
    email: 'prof1@email.com',
    password: 'password123',
    name: 'Professeur 1',
    role: 'TEACHER' as const
  },
  {
    email: 'prof2@email.com',
    password: 'password123',
    name: 'Professeur 2', 
    role: 'TEACHER' as const
  }
];

async function createUser(userData: typeof users[0]) {
  try {
    // Vérifier si l'utilisateur existe déjà
    const existing = await prisma.user.findUnique({
      where: { email: userData.email }
    });

    if (existing) {
      console.log(`⏭️  Utilisateur ${userData.email} existe déjà`);
      return existing;
    }

    // Créer l'utilisateur via Better Auth
    const result = await auth.api.signUpEmail({
      body: {
        email: userData.email,
        password: userData.password,
        name: userData.name
      }
    });

    console.log(`✅ Utilisateur créé: ${userData.email}`);

    // Mettre à jour le rôle si différent de TEACHER (rôle par défaut)
    if (userData.role !== 'TEACHER') {
      await prisma.user.update({
        where: { id: result.user.id },
        data: { role: userData.role }
      });
      console.log(`✅ Rôle mis à jour pour ${userData.email}: ${userData.role}`);
    }

    // Créer le profil Teacher pour les utilisateurs TEACHER
    if (userData.role === 'TEACHER') {
      await prisma.teacher.create({
        data: {
          userId: result.user.id
        }
      });
      console.log(`✅ Profil enseignant créé pour ${userData.email}`);
    }

    return result.user;

  } catch (error) {
    console.error(`❌ Erreur lors de la création de ${userData.email}:`, error);
    throw error;
  }
}

async function main() {
  console.log('🌱 Création des utilisateurs restants...');

  for (const userData of users) {
    await createUser(userData);
    // Petite pause entre les créations
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n📋 Récapitulatif des comptes disponibles:');
  const allUsers = await prisma.user.findMany({
    select: {
      email: true,
      name: true,
      role: true
    },
    orderBy: { role: 'asc' }
  });

  allUsers.forEach(user => {
    console.log(`- ${user.email} (password123) - ${user.role}`);
  });

  const teacherCount = await prisma.teacher.count();
  console.log(`\n📊 Total: ${allUsers.length} utilisateurs, ${teacherCount} enseignants`);
  
  console.log('\n🎉 Tous les comptes sont prêts !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });