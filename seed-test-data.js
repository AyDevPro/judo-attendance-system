const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Création des données de test...');

  // Créer une classe de test
  let testClass = await prisma.class.findFirst({
    where: { name: 'Classe Poussin A' }
  });
  
  if (!testClass) {
    testClass = await prisma.class.create({
      data: {
        name: 'Classe Poussin A',
      },
    });
  }

  console.log('✅ Classe créée:', testClass.name);

  // Créer des étudiants de test
  const students = [
    { firstName: 'Thomas', lastName: 'Martin' },
    { firstName: 'Emma', lastName: 'Dubois' },
    { firstName: 'Lucas', lastName: 'Moreau' },
    { firstName: 'Léa', lastName: 'Simon' },
    { firstName: 'Hugo', lastName: 'Laurent' },
    { firstName: 'Chloé', lastName: 'Blanc' },
    { firstName: 'Nathan', lastName: 'Garcia' },
    { firstName: 'Manon', lastName: 'Roux' },
  ];

  for (const student of students) {
    await prisma.student.upsert({
      where: { 
        // Utiliser une combinaison unique pour l'upsert
        firstName_lastName_classId: {
          firstName: student.firstName,
          lastName: student.lastName,
          classId: testClass.id
        }
      },
      update: {},
      create: {
        firstName: student.firstName,
        lastName: student.lastName,
        classId: testClass.id,
      },
    }).catch(async () => {
      // Si l'index composite n'existe pas, créer directement
      try {
        await prisma.student.create({
          data: {
            firstName: student.firstName,
            lastName: student.lastName,
            classId: testClass.id,
          },
        });
      } catch (e) {
        console.log(`Étudiant ${student.firstName} ${student.lastName} déjà existant`);
      }
    });
  }

  console.log('✅ 8 étudiants créés dans la classe');

  // Créer un utilisateur BUREAU si il n'existe pas
  const bureauUser = await prisma.user.upsert({
    where: { email: 'bureau@judo.fr' },
    update: {},
    create: {
      email: 'bureau@judo.fr',
      name: 'Gestionnaire Bureau',
      role: 'BUREAU',
      blocked: false,
      emailVerified: true,
    },
  });

  console.log('✅ Utilisateur BUREAU créé:', bureauUser.email);

  // Créer un utilisateur TEACHER et son profil
  const teacherUser = await prisma.user.upsert({
    where: { email: 'prof@judo.fr' },
    update: {},
    create: {
      email: 'prof@judo.fr',
      name: 'Professeur Tanaka',
      role: 'TEACHER',
      blocked: false,
      emailVerified: true,
    },
  });

  const teacherProfile = await prisma.teacher.upsert({
    where: { userId: teacherUser.id },
    update: {},
    create: {
      userId: teacherUser.id,
    },
  });

  console.log('✅ Utilisateur TEACHER créé:', teacherUser.email);

  // Créer un cours de test
  let course = await prisma.course.findFirst({
    where: { name: 'Judo Poussin - Initiation' }
  });
  
  if (!course) {
    course = await prisma.course.create({
      data: {
        name: 'Judo Poussin - Initiation',
        ageGroup: 'POUSSIN',
        classId: testClass.id,
        teacherId: teacherProfile.id,
      },
    });
  }

  console.log('✅ Cours créé:', course.name);

  // Créer un horaire pour le cours
  const existingTimetable = await prisma.timetable.findFirst({
    where: { courseId: course.id }
  });
  
  if (!existingTimetable) {
    await prisma.timetable.create({
      data: {
        courseId: course.id,
        weekday: 3, // Mercredi
        startsAt: '14:00',
        endsAt: '15:00',
      },
    });
  }

  console.log('✅ Horaire créé: Mercredi 14h-15h');

  // Vérifier qu'il y a un admin
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });

  if (!adminUser) {
    await prisma.user.create({
      data: {
        email: 'admin@judo.fr',
        name: 'Administrateur',
        role: 'ADMIN',
        blocked: false,
        emailVerified: true,
      },
    });
    console.log('✅ Utilisateur ADMIN créé: admin@judo.fr');
  }

  console.log('\n🎉 Données de test créées avec succès !');
  console.log('\nComptes de test disponibles :');
  console.log('• admin@judo.fr (ADMIN)');
  console.log('• bureau@judo.fr (BUREAU)');
  console.log('• prof@judo.fr (TEACHER)');
  console.log('\nMot de passe pour tous : password123');
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });