const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const testUsers = [
  {
    email: 'admin@email.com',
    password: 'password123',
    name: 'Administrateur',
    role: 'ADMIN'
  },
  {
    email: 'bureau@email.com',
    password: 'password123', 
    name: 'Bureau',
    role: 'BUREAU'
  },
  {
    email: 'prof1@email.com',
    password: 'password123',
    name: 'Professeur 1',
    role: 'TEACHER'
  },
  {
    email: 'prof2@email.com',
    password: 'password123',
    name: 'Professeur 2', 
    role: 'TEACHER'
  }
];

async function createUser(userData) {
  try {
    // Create user via sign-up API endpoint
    const response = await fetch('http://localhost:3000/api/auth/sign-up', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: userData.email,
        password: userData.password,
        name: userData.name
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create user ${userData.email}: ${error}`);
    }

    console.log(`✅ Utilisateur créé: ${userData.email}`);

    // Update role if not TEACHER (default role)
    if (userData.role !== 'TEACHER') {
      const user = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: userData.role }
        });
        console.log(`✅ Rôle mis à jour pour ${userData.email}: ${userData.role}`);
      }
    }

    // Create Teacher profile for TEACHER role users
    if (userData.role === 'TEACHER') {
      const user = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (user) {
        const existingTeacher = await prisma.teacher.findUnique({
          where: { userId: user.id }
        });

        if (!existingTeacher) {
          await prisma.teacher.create({
            data: {
              userId: user.id
            }
          });
          console.log(`✅ Profil enseignant créé pour ${userData.email}`);
        }
      }
    }

  } catch (error) {
    console.error(`❌ Erreur lors de la création de ${userData.email}:`, error.message);
  }
}

async function main() {
  console.log('🌱 Création des comptes de test...');
  
  // Wait a bit to ensure the server is ready
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  for (const userData of testUsers) {
    await createUser(userData);
    // Small delay between creations
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n📋 Récapitulatif des comptes créés:');
  console.log('- admin@email.com (password123) - ADMIN');
  console.log('- bureau@email.com (password123) - BUREAU');
  console.log('- prof1@email.com (password123) - TEACHER');
  console.log('- prof2@email.com (password123) - TEACHER');
  console.log('\n🎉 Création des comptes terminée !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });