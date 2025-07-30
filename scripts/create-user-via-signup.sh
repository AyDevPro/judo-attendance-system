#!/bin/bash

# Create admin user
echo "Creating admin user..."
curl -X POST http://localhost:3000/api/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@email.com",
    "password": "password123",
    "name": "Administrateur"
  }' -s -o /dev/null

# Update role to ADMIN
echo "Updating admin role..."
docker exec attendance-db psql -U nextjs_app -d nextjs_db -c "UPDATE \"User\" SET role = 'ADMIN' WHERE email = 'admin@email.com';" > /dev/null

# Create bureau user
echo "Creating bureau user..."
curl -X POST http://localhost:3000/api/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{
    "email": "bureau@email.com",
    "password": "password123",
    "name": "Bureau"
  }' -s -o /dev/null

# Update role to BUREAU
echo "Updating bureau role..."
docker exec attendance-db psql -U nextjs_app -d nextjs_db -c "UPDATE \"User\" SET role = 'BUREAU' WHERE email = 'bureau@email.com';" > /dev/null

# Create teacher 1
echo "Creating teacher 1..."
curl -X POST http://localhost:3000/api/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{
    "email": "prof1@email.com",
    "password": "password123",
    "name": "Professeur 1"
  }' -s -o /dev/null

# Create teacher profile for prof1
echo "Creating teacher profile for prof1..."
USER_ID1=$(docker exec attendance-db psql -U nextjs_app -d nextjs_db -c "SELECT id FROM \"User\" WHERE email = 'prof1@email.com';" -t | tr -d ' ')
docker exec attendance-db psql -U nextjs_app -d nextjs_db -c "INSERT INTO \"Teacher\" (\"userId\") VALUES ('$USER_ID1');" > /dev/null

# Create teacher 2
echo "Creating teacher 2..."
curl -X POST http://localhost:3000/api/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{
    "email": "prof2@email.com",
    "password": "password123",
    "name": "Professeur 2"
  }' -s -o /dev/null

# Create teacher profile for prof2
echo "Creating teacher profile for prof2..."
USER_ID2=$(docker exec attendance-db psql -U nextjs_app -d nextjs_db -c "SELECT id FROM \"User\" WHERE email = 'prof2@email.com';" -t | tr -d ' ')
docker exec attendance-db psql -U nextjs_app -d nextjs_db -c "INSERT INTO \"Teacher\" (\"userId\") VALUES ('$USER_ID2');" > /dev/null

echo ""
echo "✅ Comptes créés avec succès:"
echo "- admin@email.com (password123) - ADMIN"
echo "- bureau@email.com (password123) - BUREAU"
echo "- prof1@email.com (password123) - TEACHER"
echo "- prof2@email.com (password123) - TEACHER"
echo ""

# Verify
echo "📊 Vérification:"
docker exec attendance-db psql -U nextjs_app -d nextjs_db -c "SELECT email, name, role FROM \"User\" ORDER BY role;"