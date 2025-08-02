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

# Fonction de nettoyage pour arrêter tous les processus
cleanup() {
  echo "🛑 Arrêt des processus..."
  jobs -p | xargs -r kill
  exit 0
}

# Capturer les signaux pour le nettoyage
trap cleanup SIGTERM SIGINT

# Démarrer Prisma Studio en arrière-plan
echo "🔍 Démarrage de Prisma Studio sur le port 5555..."
npx prisma studio --port 5555 --hostname 0.0.0.0 &
PRISMA_STUDIO_PID=$!

# Attendre un peu que Prisma Studio démarre
sleep 3
echo "✅ Prisma Studio démarré ! Accessible sur http://localhost:5555"

# Démarrer l'application Next.js
echo "🚀 Démarrage de l'application Next.js..."
npm run dev &
NEXTJS_PID=$!

# Attendre que l'un des processus se termine
wait