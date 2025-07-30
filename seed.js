const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Créer les groupes
  const groups = [
    { name: 'Prima', type: 'PRIMA', description: 'Groupe Prima' },
    { name: 'J2', type: 'J2', description: 'Groupe J2' },
    { name: 'J3', type: 'J3', description: 'Groupe J3' },
    { name: 'J4', type: 'J4', description: 'Groupe J4' },
    { name: 'J5 Judo', type: 'J5_JUDO', description: 'Groupe J5 Judo' },
    { name: 'J5 Jujitsu', type: 'J5_JUJITSU', description: 'Groupe J5 Jujitsu' },
    { name: 'Jujitsu Jeune', type: 'JUJITSU_JEUNE', description: 'Groupe Jujitsu Jeune' },
    { name: 'Ne waza', type: 'NE_WAZA', description: 'Groupe Ne waza' },
    { name: 'Taiso', type: 'TAISO', description: 'Groupe Taiso' },
    { name: 'Self-Défense', type: 'SELF_DEFENSE', description: 'Groupe Self-Défense' },
    { name: 'Yoga', type: 'YOGA', description: 'Groupe Yoga' }
  ];

  for (const group of groups) {
    await prisma.group.upsert({
      where: { name: group.name },
      update: {},
      create: group
    });
  }

  console.log('✅ Groups created successfully!');
  
  // Pour les utilisateurs, nous les créerons via l'interface de sign-up
  console.log('ℹ️  Now create users via sign-up page and manually update their roles in database');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });