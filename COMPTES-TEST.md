# 🎯 Comptes de test - Système de Gestion des Présences Judo

## 🚀 Application accessible sur http://localhost:3000

## 👥 Comptes de test disponibles

### 🔥 ADMIN (Administrateur)
- **Email:** `admin@judo.fr`
- **Mot de passe:** `password123`
- **Permissions:**
  - Gestion complète des utilisateurs (création, modification, suppression, blocage)
  - Accès à toutes les fonctionnalités BUREAU et TEACHER
  - Page d'administration : `/admin/users`
  - Dashboard avec statistiques globales

### 🏢 BUREAU (Gestionnaire)
- **Email:** `bureau@judo.fr`
- **Mot de passe:** `password123`
- **Permissions:**
  - Création et gestion des cours
  - Attribution des professeurs
  - Gestion des horaires et tranches d'âge
  - Page de gestion : `/bureau/courses`
  - Dashboard avec statistiques des cours

### 🥋 TEACHER (Professeur)
- **Email:** `prof@judo.fr`
- **Mot de passe:** `password123`
- **Permissions:**
  - Accès aux cours assignés
  - Gestion des présences avec système 3 clics
  - Ajout de remarques
  - Consultation de l'historique
  - Dashboard avec ses cours

## 📚 Données de test créées

### Classe
- **Classe Poussin A** avec 8 étudiants :
  - Thomas Martin
  - Emma Dubois
  - Lucas Moreau
  - Léa Simon
  - Hugo Laurent
  - Chloé Blanc
  - Nathan Garcia
  - Manon Roux

### Cours
- **Judo Poussin - Initiation**
  - Tranche d'âge : POUSSIN (6-7 ans)
  - Professeur : Professeur Tanaka
  - Horaire : Mercredi 14h-15h
  - Classe : Classe Poussin A

## 🎮 Fonctionnalités à tester

### En tant qu'ADMIN
1. Connectez-vous avec `admin@judo.fr`
2. Allez sur `/admin/users` pour gérer les utilisateurs
3. Testez le changement de rôles
4. Testez le blocage/déblocage d'utilisateurs
5. Testez la suppression d'utilisateurs (attention : irréversible)

### En tant que BUREAU
1. Connectez-vous avec `bureau@judo.fr`
2. Allez sur `/bureau/courses` pour gérer les cours
3. Créez un nouveau cours avec différentes tranches d'âge
4. Assignez un professeur au cours

### En tant que TEACHER
1. Connectez-vous avec `prof@judo.fr`
2. Allez sur `/courses` pour voir vos cours
3. Cliquez sur "Judo Poussin - Initiation"
4. Testez le système de présence à 3 clics :
   - **Vide** = Absent ✗
   - **1 clic** = Présent ✓
   - **2 clics** = Absence justifiée (J)
   - **3 clics** = Retour à Absent ✗
5. Ajoutez des remarques aux étudiants
6. Changez la date pour tester différentes sessions
7. Cliquez sur "Voir l'historique" pour consulter les cours passés

## 🔒 Sécurité testée

- **Hiérarchie des rôles** : Admin > Bureau > Professeur
- **Protection des pages** : Redirection automatique si pas les droits
- **Vérification des utilisateurs bloqués** : Déconnexion automatique
- **APIs sécurisées** : Toutes les APIs vérifient les permissions

## 🎉 Système complet et fonctionnel !

Le système de gestion des présences de judo est maintenant entièrement opérationnel avec toutes les fonctionnalités demandées !