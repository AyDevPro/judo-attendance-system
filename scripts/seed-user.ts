import { PrismaClient } from '@prisma/client';
import { auth } from '../src/lib/auth';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Création d\'un utilisateur admin...');

  try {
    // Créer l'utilisateur via Better Auth
    const result = await auth.api.signUpEmail({
      body: {
        email: 'admin@email.com',
        password: 'password123',
        name: 'Administrateur'
      }
    });

    console.log('✅ Utilisateur créé via Better Auth:', result);

    // Mettre à jour le rôle
    const user = await prisma.user.findUnique({
      where: { email: 'admin@email.com' }
    });

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: 'ADMIN' }
      });
      console.log('✅ Rôle mis à jour en ADMIN');
    }

    console.log('🎉 Utilisateur admin créé avec succès !');
    console.log('Email: admin@email.com');
    console.log('Password: password123');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();