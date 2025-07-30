const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { randomBytes } = require('crypto');

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

function generateId() {
  // Generate a cuid-like ID
  const timestamp = Date.now().toString(36);
  const randomPart = randomBytes(8).toString('base64url');
  return `c${timestamp}${randomPart}`.substring(0, 25);
}

async function createUserDirect(userData) {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    });

    if (existingUser) {
      console.log(`⏭️  Utilisateur ${userData.email} existe déjà`);
      return existingUser;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    // Generate user ID
    const userId = generateId();
    
    // Create user
    const user = await prisma.user.create({
      data: {
        id: userId,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        emailVerified: true // Skip email verification for test users
      }
    });

    // Create password record
    await prisma.password.create({
      data: {
        id: generateId(),
        hash: hashedPassword,
        userId: user.id
      }
    });

    console.log(`✅ Utilisateur créé: ${userData.email} (${userData.role})`);

    // Create Teacher profile for TEACHER role users
    if (userData.role === 'TEACHER') {
      await prisma.teacher.create({
        data: {
          userId: user.id
        }
      });
      console.log(`✅ Profil enseignant créé pour ${userData.email}`);
    }

    return user;

  } catch (error) {
    console.error(`❌ Erreur lors de la création de ${userData.email}:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('🌱 Création des comptes de test directement en base...');
  
  for (const userData of testUsers) {
    await createUserDirect(userData);
  }
  
  console.log('\n📋 Récapitulatif des comptes créés:');
  console.log('- admin@email.com (password123) - ADMIN');
  console.log('- bureau@email.com (password123) - BUREAU');
  console.log('- prof1@email.com (password123) - TEACHER');
  console.log('- prof2@email.com (password123) - TEACHER');
  
  // Verify users were created
  const userCount = await prisma.user.count();
  const teacherCount = await prisma.teacher.count();
  console.log(`\n📊 Total: ${userCount} utilisateurs, ${teacherCount} enseignants`);
  
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