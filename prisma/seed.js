const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Démarrage du seed de développement...');

  // 1. Créer les groupes judo
  console.log('📚 Création des groupes judo...');
  
  const groups = [
    { name: 'PRIMA', description: 'Groupe des débutants (6-7 ans)' },
    { name: 'J2', description: 'Judo 2 (8-9 ans)' },
    { name: 'J3', description: 'Judo 3 (10-11 ans)' },
    { name: 'J4', description: 'Judo 4 (12-13 ans)' },
    { name: 'J5 Judo', description: 'Judo 5 - Judo (14+ ans)' },
    { name: 'J5 Jujitsu', description: 'Judo 5 - Jujitsu (14+ ans)' },
    { name: 'Jujitsu Jeune', description: 'Jujitsu pour les jeunes' },
    { name: 'Ne-Waza', description: 'Techniques au sol' },
    { name: 'Taiso', description: 'Préparation physique judo' },
    { name: 'Self-Défense', description: 'Cours de self-défense' },
    { name: 'Yoga', description: 'Cours de yoga' }
  ];

  for (const group of groups) {
    await prisma.group.upsert({
      where: { name: group.name },
      update: {},
      create: group
    });
    console.log(`  ✅ Groupe "${group.name}" créé/mis à jour`);
  }

  // 2. Créer les utilisateurs de test
  console.log('👥 Création des utilisateurs de test...');
  
  const users = [
    {
      email: 'admin@email.com',
      name: 'Admin Test',
      role: 'ADMIN',
      password: 'password123'
    },
    {
      email: 'bureau@email.com', 
      name: 'Bureau Test',
      role: 'BUREAU',
      password: 'password123'
    },
    {
      email: 'prof1@email.com',
      name: 'Professeur Test',
      role: 'TEACHER',
      password: 'password123'
    }
  ];

  for (const userData of users) {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    });

    if (!existingUser) {
      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Créer l'utilisateur
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          role: userData.role,
          emailVerified: true
        }
      });

      // Créer le mot de passe dans la table Password
      await prisma.password.create({
        data: {
          userId: user.id,
          hash: hashedPassword
        }
      });

      // Si c'est un professeur, créer le profil Teacher
      if (userData.role === 'TEACHER') {
        await prisma.teacher.create({
          data: {
            userId: user.id
          }
        });
      }

      console.log(`  ✅ Utilisateur "${userData.email}" créé avec le rôle ${userData.role}`);
    } else {
      // Mettre à jour le rôle et le mot de passe
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      await prisma.user.update({
        where: { email: userData.email },
        data: { 
          role: userData.role,
          emailVerified: true
        }
      });

      // Mettre à jour ou créer le mot de passe
      await prisma.password.upsert({
        where: { userId: existingUser.id },
        update: { hash: hashedPassword },
        create: {
          userId: existingUser.id,
          hash: hashedPassword
        }
      });

      // Si c'est un professeur, créer le profil Teacher s'il n'existe pas
      if (userData.role === 'TEACHER') {
        const existingTeacher = await prisma.teacher.findUnique({
          where: { userId: existingUser.id }
        });
        
        if (!existingTeacher) {
          await prisma.teacher.create({
            data: {
              userId: existingUser.id
            }
          });
        }
      }

      console.log(`  ✅ Utilisateur "${userData.email}" mis à jour avec le rôle ${userData.role}`);
    }
  }

  // 3. Créer quelques licenciés de test
  console.log('🥋 Création de licenciés de test...');
  
  const licensees = [
    {
      firstName: 'Jean',
      lastName: 'Dupont',
      dateOfBirth: new Date('2008-05-14'),
      age: 16,
      gender: 'MALE',
      category: 'CADET',
      beltColor: 'VERTE',
      externalId: '123456',
      groups: ['J3']
    },
    {
      firstName: 'Marie',
      lastName: 'Leroy', 
      dateOfBirth: new Date('2012-09-22'),
      age: 12,
      gender: 'FEMALE',
      category: 'MINIME',
      beltColor: 'DAN_3',
      externalId: '234567',
      groups: ['J2']
    },
    {
      firstName: 'Paul',
      lastName: 'Martin',
      dateOfBirth: new Date('2015-01-03'),
      age: 9,
      gender: 'MALE',
      category: 'BENJAMIN',
      beltColor: 'BLANCHE',
      externalId: '345678',
      groups: ['PRIMA']
    }
  ];

  for (const licenseeData of licensees) {
    // Vérifier si le licencié existe déjà
    const existingLicensee = await prisma.licensee.findFirst({
      where: {
        AND: [
          { firstName: licenseeData.firstName },
          { lastName: licenseeData.lastName },
          { dateOfBirth: licenseeData.dateOfBirth }
        ]
      }
    });

    if (!existingLicensee) {
      // Créer le licencié
      const licensee = await prisma.licensee.create({
        data: {
          firstName: licenseeData.firstName,
          lastName: licenseeData.lastName,
          dateOfBirth: licenseeData.dateOfBirth,
          age: licenseeData.age,
          gender: licenseeData.gender,
          category: licenseeData.category,
          beltColor: licenseeData.beltColor,
          externalId: licenseeData.externalId
        }
      });

      // Assigner aux groupes
      for (const groupName of licenseeData.groups) {
        const group = await prisma.group.findUnique({
          where: { name: groupName }
        });
        
        if (group) {
          await prisma.licenseeGroup.create({
            data: {
              licenseeId: licensee.id,
              groupId: group.id
            }
          });
        }
      }

      console.log(`  ✅ Licencié "${licenseeData.firstName} ${licenseeData.lastName}" créé`);
    } else {
      console.log(`  ℹ️  Licencié "${licenseeData.firstName} ${licenseeData.lastName}" existe déjà`);
    }
  }

  console.log('🎉 Seed de développement terminé avec succès !');
  console.log('');
  console.log('📋 Comptes de test créés :');
  console.log('  👤 ADMIN: admin@email.com / password123');
  console.log('  👤 BUREAU: bureau@email.com / password123'); 
  console.log('  👤 TEACHER: prof1@email.com / password123');
  console.log('');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Erreur lors du seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });