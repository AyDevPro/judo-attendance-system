const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Mapping des types de groupes vers les noms de groupes
const GROUP_TYPE_TO_NAME = {
  'PRIMA': 'Prima',
  'J2': 'J2',
  'J3': 'J3', 
  'J4': 'J4',
  'J5_JUDO': 'J5 Judo',
  'J5_JUJITSU': 'J5 Jujitsu',
  'JUJITSU_JEUNE': 'Jujitsu Jeunes',
  'NE_WAZA': 'Ne-Waza',
  'TAISO': 'Taiso',
  'SELF_DEFENSE': 'Self-Défense',
  'YOGA': 'Yoga'
};

// Définition des cours à créer
const COURSES_DATA = [
  // Lundi (weekday = 1)
  {
    name: 'J3 - Lundi',
    weekday: 1,
    startsAt: '17:00',
    endsAt: '18:00',
    groupType: 'J3'
  },
  {
    name: 'J4 - Lundi', 
    weekday: 1,
    startsAt: '18:00',
    endsAt: '19:30',
    groupType: 'J4'
  },
  {
    name: 'J5 Judo - Lundi',
    weekday: 1,
    startsAt: '19:30',
    endsAt: '21:30',
    groupType: 'J5_JUDO'
  },
  
  // Mercredi (weekday = 3)
  {
    name: 'PRIMA - Mercredi',
    weekday: 3,
    startsAt: '17:00',
    endsAt: '18:00',
    groupType: 'PRIMA'
  },
  {
    name: 'Jujitsu Jeunes - Mercredi',
    weekday: 3,
    startsAt: '18:00',
    endsAt: '19:00',
    groupType: 'JUJITSU_JEUNE'
  },
  {
    name: 'Self-Défense - Mercredi',
    weekday: 3,
    startsAt: '19:00',
    endsAt: '20:30',
    groupType: 'SELF_DEFENSE'
  },
  {
    name: 'Yoga - Mercredi',
    weekday: 3,
    startsAt: '20:30',
    endsAt: '21:30',
    groupType: 'YOGA'
  },
  
  // Jeudi (weekday = 4)
  {
    name: 'Yoga - Jeudi',
    weekday: 4,
    startsAt: '09:30',
    endsAt: '11:00',
    groupType: 'YOGA'
  },
  {
    name: 'J2 - Jeudi',
    weekday: 4,
    startsAt: '17:00',
    endsAt: '18:00',
    groupType: 'J2'
  },
  {
    name: 'Ne-Waza - Jeudi',
    weekday: 4,
    startsAt: '18:00',
    endsAt: '19:30',
    groupType: 'NE_WAZA'
  },
  {
    name: 'Taiso - Jeudi',
    weekday: 4,
    startsAt: '19:30',
    endsAt: '21:00',
    groupType: 'TAISO'
  },
  
  // Vendredi (weekday = 5)
  {
    name: 'J3 - Vendredi',
    weekday: 5,
    startsAt: '17:00',
    endsAt: '18:00',
    groupType: 'J3'
  },
  {
    name: 'J4 - Vendredi',
    weekday: 5,
    startsAt: '18:00',
    endsAt: '19:30',
    groupType: 'J4'
  },
  {
    name: 'J5 Judo - Vendredi',
    weekday: 5,
    startsAt: '19:30',
    endsAt: '21:30',
    groupType: 'J5_JUDO'
  },
  {
    name: 'J5 Jujitsu - Vendredi',
    weekday: 5,
    startsAt: '19:30',
    endsAt: '21:30',
    groupType: 'J5_JUJITSU'
  }
];

async function createSeasonCourses() {
  console.log('🚀 Début de la création des cours de la saison...\n');
  
  try {
    // 1. Récupérer tous les groupes existants
    const groups = await prisma.group.findMany({
      select: {
        id: true,
        name: true,
        type: true
      }
    });
    
    console.log(`📋 ${groups.length} groupes trouvés dans la base de données:`);
    groups.forEach(group => {
      console.log(`   - ${group.name} (${group.type})`);
    });
    console.log('');
    
    // 2. Créer un mapping des types de groupes vers les IDs
    const groupTypeToId = {};
    groups.forEach(group => {
      groupTypeToId[group.type] = group.id;
    });
    
    // 3. Récupérer les cours existants pour éviter les doublons
    const existingCourses = await prisma.course.findMany({
      include: {
        timetable: true
      }
    });
    
    console.log(`📚 ${existingCourses.length} cours existants trouvés\n`);
    
    let createdCount = 0;
    let skippedCount = 0;
    
    // 4. Créer chaque cours
    for (const courseData of COURSES_DATA) {
      const { name, weekday, startsAt, endsAt, groupType } = courseData;
      
      // Vérifier si le groupe existe
      if (!groupTypeToId[groupType]) {
        console.log(`❌ Groupe ${groupType} non trouvé - cours "${name}" ignoré`);
        skippedCount++;
        continue;
      }
      
      // Vérifier si le cours existe déjà (nom + horaire)
      const existingCourse = existingCourses.find(course => 
        course.name === name && 
        course.timetable.some(t => 
          t.weekday === weekday && 
          t.startsAt === startsAt && 
          t.endsAt === endsAt
        )
      );
      
      if (existingCourse) {
        console.log(`⏭️  Cours "${name}" existe déjà - ignoré`);
        skippedCount++;
        continue;
      }
      
      // Créer le cours dans une transaction
      await prisma.$transaction(async (tx) => {
        // Créer le cours
        const newCourse = await tx.course.create({
          data: {
            name: name
          }
        });
        
        // Créer l'horaire
        await tx.timetable.create({
          data: {
            courseId: newCourse.id,
            weekday: weekday,
            startsAt: startsAt,
            endsAt: endsAt
          }
        });
        
        // Lier le cours au groupe
        await tx.courseGroup.create({
          data: {
            courseId: newCourse.id,
            groupId: groupTypeToId[groupType]
          }
        });
        
        console.log(`✅ Cours créé: "${name}" (${getWeekdayName(weekday)} ${startsAt}-${endsAt}) → ${GROUP_TYPE_TO_NAME[groupType]}`);
        createdCount++;
      });
    }
    
    console.log(`\n🎉 Création terminée !`);
    console.log(`   ✅ ${createdCount} cours créés`);
    console.log(`   ⏭️  ${skippedCount} cours ignorés (déjà existants ou groupe manquant)`);
    console.log(`   📊 Total planifié: ${COURSES_DATA.length} cours`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la création des cours:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

function getWeekdayName(weekday) {
  const days = {
    1: 'Lundi',
    2: 'Mardi', 
    3: 'Mercredi',
    4: 'Jeudi',
    5: 'Vendredi',
    6: 'Samedi',
    7: 'Dimanche'
  };
  return days[weekday] || `Jour ${weekday}`;
}

// Exécuter le script
if (require.main === module) {
  createSeasonCourses()
    .catch((error) => {
      console.error('💥 Échec du script:', error);
      process.exit(1);
    });
}

module.exports = { createSeasonCourses };