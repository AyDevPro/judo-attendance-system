# 🥋 Système de Gestion des Présences - Judo

Application complète de gestion des présences pour club de judo avec système de rôles hiérarchique.

## 🚀 Fonctionnalités

### 👑 **ADMIN** (Administrateur)
- ✅ Gestion complète des utilisateurs (création, rôles, blocage, suppression)
- ✅ Accès à toutes les fonctionnalités BUREAU et TEACHER
- ✅ Tableau de bord avec statistiques globales
- ✅ Interface sécurisée pour la gestion des permissions

### 🏢 **BUREAU** (Gestionnaire)
- ✅ Création et gestion des cours (nom, horaires, jours de la semaine)
- ✅ Attribution des professeurs aux cours
- ✅ Gestion des tranches d'âge judo (Poussin, Benjamin, Minime, etc.)
- ✅ Planification des horaires et créneaux

### 🥋 **TEACHER** (Professeur)
- ✅ Accès aux cours assignés
- ✅ Système de présence à 3 clics : Absent → Présent → Justifié → Absent
- ✅ Ajout de remarques pour chaque étudiant
- ✅ Consultation de l'historique des cours précédents
- ✅ Dashboard personnalisé avec ses cours

## 🛠️ Technologies

- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Better Auth v1.3.4
- **Base de données**: PostgreSQL avec Prisma ORM v6.13.0
- **Containerisation**: Docker & Docker Compose
- **Sécurité**: Authentification par email/mot de passe, RBAC complet

## 🔧 Installation

### Prérequis
- Docker & Docker Compose
- Node.js 20+ (pour le développement local)

### Démarrage rapide

1. **Cloner le repository**
   ```bash
   git clone <url-repo>
   cd attendance-app
   ```

2. **Configurer l'environnement**
   ```bash
   cp .env.example .env
   # Éditer .env avec vos configurations
   ```

3. **Lancer l'application**
   ```bash
   docker-compose up --build -d
   ```

4. **Accéder à l'application**
   - URL: http://localhost:3000
   - Base de données: PostgreSQL sur port 5432

## 👥 Comptes de test

| Email | Rôle | Mot de passe | Permissions |
|-------|------|-------------|-------------|
| `admin@email.com` | **ADMIN** | `password123` | Gestion complète |
| `bureau@email.com` | **BUREAU** | `password123` | Gestion des cours |
| `prof1@email.com` | **TEACHER** | `password123` | Présences & remarques |

## 🏗️ Architecture

```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API Routes (auth, admin, bureau, courses)
│   ├── admin/          # Interface administrateur
│   ├── bureau/         # Interface gestionnaire
│   └── courses/        # Interface professeur
├── components/         # Composants réutilisables
├── lib/               # Utilitaires (auth, prisma, utils)
└── prisma/            # Schema & migrations base de données
```

## 🔐 Sécurité

- **Hiérarchie des rôles**: Admin > Bureau > Professeur
- **Protection des routes**: HOCs avec vérification des permissions
- **Protection des APIs**: Middleware d'authentification sur toutes les routes
- **Anti-auto-modification**: Un admin ne peut pas retirer son propre rôle
- **Blocage utilisateur**: Déconnexion automatique si bloqué
- **Validation**: Toutes les entrées sont validées côté client et serveur

## 🎯 Fonctionnalités avancées

### Système de présence intelligent
- **3 états**: Absent (par défaut) → Présent → Justifié → Absent
- **Historique complet**: Consultation des cours précédents
- **Remarques**: Notes personnalisées par étudiant

### Gestion des cours
- **Tranches d'âge**: Catégories judo (Baby Judo, Poussin, Benjamin, etc.)
- **Horaires récurrents**: Planification hebdomadaire automatique
- **Attribution professeurs**: Système d'assignation flexible

### Interface responsive
- **Design moderne**: Interface claire avec Tailwind CSS
- **Navigation contextuelle**: Menus adaptés selon le rôle utilisateur
- **Feedback temps réel**: Notifications et confirmations

## 📊 Base de données

### Modèles principaux
- **User**: Utilisateurs avec rôles et authentification
- **Course**: Cours avec tranches d'âge et professeurs assignés
- **Class**: Classes d'étudiants
- **Student**: Étudiants inscrits
- **Attendance**: Historique des présences
- **CourseSession**: Sessions de cours individuelles

## 🚢 Déploiement

### Développement
```bash
# Hot reload activé par défaut
docker-compose up -d
# Les modifications de code sont prises en compte instantanément
```

### Production
```bash
# Build optimisé
docker-compose -f docker-compose.prod.yml up --build -d
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/amazing-feature`)
3. Commit les changements (`git commit -m 'Add amazing feature'`)
4. Push vers la branche (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

## 📝 License

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

---

**Développé avec ❤️ pour la communauté judo**
