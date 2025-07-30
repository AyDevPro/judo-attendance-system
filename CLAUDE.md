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

### Local Development (Alternative)
- `npm run dev` - Start development server (requires local database setup)
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Architecture Overview

This is a **role-based judo attendance management system** built with Next.js 15:

### Tech Stack
- **Frontend**: Next.js 15 with App Router, TypeScript, Tailwind CSS
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
   - Assign teachers to courses
   - Manage academic structure

3. **TEACHER** - Course attendance
   - Access assigned courses only
   - 3-click attendance system (absent → present → justified → absent)
   - Add remarks to attendance records
   - Access historical attendance data

### Core Domain Models

**Judo-specific age groups:** BABY_JUDO, POUSSIN, BENJAMIN, MINIME, CADET, JUNIOR, SENIOR

1. **Users & Authentication**
   - User roles with hierarchical permissions
   - Account blocking functionality
   - Better Auth session management

2. **Academic Structure**
   - Class → Course (with age groups) → CourseSession (specific dates)
   - Timetable scheduling system
   - Teacher assignment to courses

3. **Attendance System**
   - 3-state attendance: null (absent), PRESENT, JUSTIFIED
   - Audit trail with updatedBy user tracking
   - Remarks system for additional notes
   - Session locking for finalized attendance

### Key Database Relationships
- Users can have Teacher profiles for course assignment
- Classes contain Students and have multiple age-specific Courses
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
After running migrations, create test users via API:
- **admin@email.com** (password: password123) - ADMIN role
- **bureau@email.com** (password: password123) - BUREAU role  
- **prof1@email.com** (password: password123) - TEACHER role

### Development Workflow
1. `docker compose up -d --build` - Start with hot reload
2. Apply migrations: `docker exec attendance-web npx prisma migrate dev --name init`
3. Create test users via sign-up API
4. Update roles via database: `docker exec attendance-db psql -U nextjs_app -d nextjs_db -c "UPDATE \"User\" SET role = 'ADMIN' WHERE email = 'admin@email.com';"`
5. Access application at http://localhost:3000

### Key Features Implemented
- ✅ Complete role-based authentication system
- ✅ User registration and login (sign-up page functional)
- ✅ Admin user management with role assignment
- ✅ Course creation with age groups and teacher assignment
- ✅ 3-click attendance tracking system
- ✅ Hot reload development environment
- ✅ Hierarchical permissions (ADMIN > BUREAU > TEACHER)
- ✅ User blocking/unblocking functionality
- ✅ Security: Admin self-modification prevention

### Repository
- **GitHub**: https://github.com/AyDevPro/judo-attendance-system
- **Branch**: main
- **Language**: French (UI and comments)