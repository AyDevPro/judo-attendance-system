# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Docker Development (Recommended)
- `docker compose up -d --build` - Build and start all services with hot reload
- `docker compose down` - Stop all services
- `docker compose down -v` - Stop and remove all volumes (reset database)
- `docker exec attendance-web npx prisma migrate dev --name <migration_name>` - Create and apply new migration
- `docker exec attendance-web npx prisma generate` - Generate Prisma client
- `docker exec attendance-web npx prisma studio` - Open Prisma Studio for database inspection

### Database Management Commands
- `docker exec attendance-db psql -U nextjs_app -d nextjs_db -c "SELECT * FROM \"User\";"` - Query database directly
- `docker exec attendance-db psql -U nextjs_app -d nextjs_db -c "UPDATE \"User\" SET role = 'ADMIN' WHERE email = 'admin@email.com';"` - Update user roles
- `docker exec attendance-web node prisma/seed.js` - Seed database manually (groupes et utilisateurs de test)

### Local Development (Alternative)
- `npm run dev` - Start development server (requires local database setup)
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Architecture Overview

This is a **role-based judo attendance management system** built with Next.js 15:

### Tech Stack
- **Frontend**: Next.js 15 with App Router, TypeScript, Tailwind CSS
- **UI/UX**: Modern design system with gradients, cards, animations and responsive layout
- **Authentication**: Better Auth v1.3.4 with email/password
- **Database**: PostgreSQL with Prisma ORM v6.13.0
- **Deployment**: Docker with docker-compose (dev mode with hot reload)
- **Development**: Hot reload configured with webpack polling for Docker

### Role-Based Access Control (RBAC)

**Hierarchical Roles: ADMIN > BUREAU > TEACHER**

1. **ADMIN** - Complete system access
   - User management (roles, blocking, deletion)
   - Access to all courses and features
   - Cannot modify their own admin role (security)

2. **BUREAU** - Course management
   - Create courses with schedules and age groups
   - Assign multiple teachers to courses (multi-teacher support)
   - Manage academic structure with checkbox interface

3. **TEACHER** - Course attendance
   - Access assigned courses only
   - 3-click attendance system (absent → present → justified → absent)
   - Add remarks to attendance records
   - Access historical attendance data

### Core Domain Models

**Judo-specific groups:** PRIMA, J2, J3, J4, J5_JUDO, J5_JUJITSU, JUJITSU_JEUNE, NE_WAZA, TAISO, SELF_DEFENSE, YOGA

1. **Users & Authentication**
   - User roles with hierarchical permissions
   - Account blocking functionality
   - Better Auth session management

2. **Academic Structure**
   - Courses with multiple age groups and multiple teachers (many-to-many relationships)
   - Timetable scheduling system
   - Multi-teacher assignment to courses via CourseTeacher junction table
   - Group assignment via CourseGroup junction table

3. **Attendance System**
   - 3-state attendance: null (absent), PRESENT, JUSTIFIED
   - Audit trail with updatedBy user tracking
   - Remarks system for additional notes
   - Session locking for finalized attendance

### Key Database Relationships
- Users can have Teacher profiles for course assignment
- **Multi-teacher support**: CourseTeacher junction table for many-to-many Course ↔ Teacher relationships
- **Multi-group support**: CourseGroup junction table for many-to-many Course ↔ Group relationships
- Courses have Timetables (recurring schedule) and CourseSessions (actual occurrences)
- Attendance tracked per CourseSession per Student with audit trail
- Period system for academic year management

### Authentication & Security
- Better Auth with PostgreSQL adapter
- No email verification (development configuration)
- Role-based page protection with HOCs
- Admin self-modification prevention
- User blocking system

### API Routes
- `/api/auth/[...all]` - Better Auth endpoints (sign-up, sign-in, etc.)
- `/api/user/me` - Get current user with role data
- `/api/admin/users` - Admin user management
- `/api/admin/users/[userId]` - Update user roles/blocking
- `/api/bureau/courses` - Course creation and management
- `/api/bureau/teachers` - Teacher assignment
- `/api/courses/my` - Current user's assigned courses
- `/api/courses/[courseId]/students` - Course student list
- `/api/courses/[courseId]/sessions` - Course session management
- `/api/courses/[courseId]/attendance` - Attendance tracking

### Frontend Structure
- `src/app/` - Next.js App Router pages and layouts
- `src/app/sign-up/` - User registration (accessible without auth)
- `src/app/sign-in/` - User login
- `src/app/dashboard/` - Role-based dashboard
- `src/app/admin/` - Admin-only user management
- `src/app/bureau/` - Bureau course management
- `src/app/courses/` - Teacher course access and attendance
- `src/components/withAuth.tsx` - Role-based HOCs for page protection
- `src/components/Navigation.tsx` - Role-aware navigation
- `src/lib/auth-utils.ts` - Authentication utilities and permissions

### Database Configuration
- **Connection**: PostgreSQL via Docker (nextjs_app/nextjs_pass@db:5432/nextjs_db)
- **Schema**: Prisma with migrations in `prisma/migrations/`
- **IDs**: Users use cuid strings, other entities use auto-increment integers
- **Constraints**: Unique constraints on critical fields (email, class names, etc.)

### Docker Configuration
- **Development**: Uses `Dockerfile.dev` with `npm run dev` for hot reload
- **Production**: Uses main `Dockerfile` with optimized build
- **Hot Reload**: Configured with WATCHPACK_POLLING and webpack polling
- **Volumes**: Source code mounted for live editing, node_modules excluded
- **Database**: Persistent PostgreSQL data with volume

### Test Accounts
Automatically created during development startup:
- **admin@email.com** (password: password123) - ADMIN role
- **bureau@email.com** (password: password123) - BUREAU role  
- **prof1@email.com** (password: password123) - TEACHER role

### Development Seed Data
The system automatically creates on Docker startup (dev only):
- **11 judo groups**: PRIMA, J2, J3, J4, J5 Judo/Jujitsu, Ne-waza, Taiso, Self-Defense, Yoga, etc.
- **3 test users** with correct roles and passwords
- **3 sample licensees** with different belt colors and group assignments

### Development Workflow
1. `docker compose up -d --build` - Start with hot reload and auto-seed
2. Access application at http://localhost:3000
3. Login with test accounts (see above)
4. All groups, users, and sample data are automatically created

### Manual Operations (if needed)
- `docker exec attendance-web npx prisma migrate dev --name <name>` - Create new migration
- `docker exec attendance-web node prisma/seed.js` - Re-run seed manually
- `docker compose down -v` - Reset database (will auto-seed on next startup)

### Design System & UI/UX

**Modern Professional Interface with Consistent Branding**

1. **Color Palette**
   - Primary gradients: Blue (#3B82F6) → Purple (#8B5CF6) → Indigo (#6366F1)
   - Background: Gradient from blue-50 via indigo-50 to purple-50
   - Semantic colors: Green (success), Red (errors), Gray (neutral)

2. **Component Design**
   - **Cards**: Rounded-2xl with shadow-lg, hover effects with scale and shadow
   - **Buttons**: Gradient backgrounds, rounded-xl, transform hover effects
   - **Forms**: Modern inputs with focus states and error handling
   - **Loading States**: Skeleton screens and animated spinners
   - **Navigation**: Responsive with role-based menu items

3. **Typography & Layout**
   - Gradient text for headings using bg-clip-text
   - Consistent spacing with Tailwind's space-y system
   - Responsive grid layouts (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
   - Professional font weights and sizes

4. **Interactive Elements**
   - Hover animations with transform and transition effects
   - Progressive disclosure for complex forms
   - Toast notifications for user feedback
   - Checkbox interfaces for multi-selection

### Key Features Implemented
- ✅ **Complete role-based authentication system** with Better Auth
- ✅ **Modern UI/UX design** with gradients, animations, and responsive cards
- ✅ **Multi-teacher course management** via junction tables and checkbox interface
- ✅ **Judo-specific groups** (Prima, J2, J3, J4, J5 Judo/Jujitsu, Ne-waza, Taiso, etc.)
- ✅ **User registration and login** with professional styling
- ✅ **Admin user management** with role assignment and user blocking
- ✅ **Course creation** with multiple age groups and multiple teacher assignment
- ✅ **3-click attendance tracking system** (absent → present → justified)
- ✅ **Hot reload development environment** with Docker
- ✅ **Hierarchical permissions** (ADMIN > BUREAU > TEACHER)
- ✅ **Security features**: Admin self-modification prevention, user blocking
- ✅ **Modern landing page** with judo-specific branding and features

### Repository
- **GitHub**: https://github.com/AyDevPro/judo-attendance-system
- **Branch**: main
- **Language**: French (UI and comments)