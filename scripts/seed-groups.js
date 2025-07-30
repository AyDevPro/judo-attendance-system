const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const groups = [
  { name: 'Prima', type: 'PRIMA', description: 'Groupe Prima (4-5 ans)' },
  { name: 'J2', type: 'J2', description: 'Groupe J2 (6-7 ans)' },
  { name: 'J3', type: 'J3', description: 'Groupe J3 (8-9 ans)' },
  { name: 'J4', type: 'J4', description: 'Groupe J4 (10-11 ans)' },
  { name: 'J5 Judo', type: 'J5_JUDO', description: 'Groupe J5 Judo (12-13 ans)' },
  { name: 'J5 Jujitsu', type: 'J5_JUJITSU', description: 'Groupe J5 Jujitsu (12-13 ans)' },
  { name: 'Jujitsu Jeune', type: 'JUJITSU_JEUNE', description: 'Jujitsu pour jeunes (14-17 ans)' },
  { name: 'Ne-waza', type: 'NE_WAZA', description: 'Spécialisation Ne-waza (combat au sol)' },
  { name: 'Taïso', type: 'TAISO', description: 'Préparation physique et bien-être' },
  { name: 'Self-Défense', type: 'SELF_DEFENSE', description: 'Techniques d\'autodéfense' },
  { name: 'Yoga', type: 'YOGA', description: 'Cours de yoga et relaxation' }
];

async function main() {
  console.log('🌱 Création des groupes...');
  
  for (const group of groups) {
    const existing = await prisma.group.findUnique({
      where: { name: group.name }
    });
    
    if (!existing) {
      await prisma.group.create({
        data: group
      });
      console.log(`✅ Groupe "${group.name}" créé`);
    } else {
      console.log(`⏭️  Groupe "${group.name}" existe déjà`);
    }
  }
  
  console.log('🎉 Initialisation des groupes terminée !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });