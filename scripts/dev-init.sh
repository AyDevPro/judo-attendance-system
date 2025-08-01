#!/bin/bash
set -e

echo "🚀 Initialisation de l'environnement de développement..."

# Attendre que la base de données soit prête
echo "⏳ Attente de la base de données..."
until nc -z -v -w30 db 5432; do
  echo "🔄 Attente de PostgreSQL..."
  sleep 2
done
echo "✅ Base de données prête !"

# Appliquer les migrations
echo "🔄 Application des migrations Prisma..."
npx prisma migrate deploy

# Générer le client Prisma
echo "🔄 Génération du client Prisma..."
npx prisma generate

# Exécuter le seed uniquement en développement
if [ "$NODE_ENV" = "development" ]; then
  echo "🌱 Exécution du seed de développement..."
  node prisma/seed.js
else
  echo "ℹ️  Seed ignoré (environnement: $NODE_ENV)"
fi

echo "✅ Initialisation terminée !"

# Démarrer l'application
echo "🚀 Démarrage de l'application Next.js..."
exec npm run dev