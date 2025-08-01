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
5. Use `docker logs attendance-web --tail 20` to monitor application logs
6. Access database on port 5555 for direct queries if needed

### Recent Development Activities & Bug Fixes
- **Table Sorting System**: Implemented comprehensive sorting across all data tables
- **Column Filtering**: Added user-customizable column visibility with localStorage persistence
- **Course Automation**: Created bulk course creation script for season setup
- **UI/UX Improvements**: Enhanced toast notifications, confirmation dialogs, and loading states
- **CSV Operations**: Bulk import/export functionality for licensee management
- **Error Handling**: Improved API error responses and user feedback
- **Critical Bug Fixes**:
  - ✅ Fixed course deletion API (wrong Prisma relation names)
  - ✅ Fixed column filtering UI synchronization issues
  - ✅ Fixed licensee deletion API (courseExclusion → courseLicenseeExclusion)

### Manual Operations (if needed)
- `docker exec attendance-web npx prisma migrate dev --name <name>` - Create new migration
- `docker exec attendance-web node prisma/seed.js` - Re-run seed manually
- `docker exec attendance-web node scripts/create-season-courses.js` - Create all season courses
- `docker compose down -v` - Reset database (will auto-seed on next startup)

### Troubleshooting Guide

**Common Issues & Solutions**
1. **Syntax Errors**: Check conditional rendering brackets in table components
2. **Column Filtering Not Working**: Ensure both headers and table cells have matching `visibleColumns.includes()` conditions
3. **Database Connection**: Use `docker logs attendance-db` to check PostgreSQL status
4. **Hot Reload Issues**: Restart container if webpack polling stops working
5. **Permission Errors**: Check user roles and HOC protection on protected routes
6. **API DELETE Errors**: Check Prisma model names (common: `courseExclusion` vs `courseLicenseeExclusion`)
7. **500 Internal Server Errors**: Restart Docker containers after API changes: `docker compose restart web`

**Performance Optimization**
- Tables use `useMemo` for sorting operations
- localStorage caching for user preferences
- Efficient database queries with Prisma relations
- Skeleton loading states for better UX

**Development Best Practices**
- Always test both desktop and mobile responsive layouts
- Use confirmation dialogs for destructive actions
- Implement proper error boundaries and fallbacks
- Follow French language UI standards
- Maintain consistent color palette and design system

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

### Advanced UI/UX Features

**Table Management System**
- **Column Sorting**: Click-to-sort functionality on all table headers with visual indicators
  - Supports string, number, and date sorting with null handling
  - 3-state sorting cycle: ascending → descending → no sort
  - Custom `useTableSort` hook with `SortableHeader` component
- **Column Filtering**: Toggle column visibility with persistent user preferences
  - `SimpleColumnFilter` component with checkbox interface
  - localStorage persistence for user preferences
  - Applied to courses, licensees, and users tables
- **Responsive Tables**: Overflow-x-auto with consistent styling across all pages

**Enhanced User Experience**
- **Toast Notifications**: Success, error, warning, and info messages with animations
- **Confirmation Dialogs**: Modal confirmations for destructive actions (delete, block users)
- **Loading States**: Skeleton screens and spinners for better perceived performance
- **Progressive Forms**: Multi-step forms with validation and error handling

### Business Logic & Automation

**Course Management Automation**
- **Season Course Creation**: Automated script for creating all club courses
  - 15 pre-configured courses with specific schedules
  - Multi-day support (Lundi, Mercredi, Jeudi, Vendredi)
  - Automatic teacher and group assignments
  - Script location: `scripts/create-season-courses.js`

**Attendance Management**
- **3-State System**: absent (null) → present → justified → absent cycle
- **Session Management**: Create and manage course sessions with date tracking
- **Bulk Operations**: Handle multiple students and sessions efficiently

### Component Architecture

**Reusable Components**
- `withAuth.tsx` - HOCs for role-based page protection (withAdminAuth, withBureauAuth, withTeacherAuth)
- `Navigation.tsx` - Role-aware navigation with conditional menu items
- `ToastProvider.tsx` - Global toast notification system
- `ConfirmDialog.tsx` - Reusable modal confirmation dialogs
- `SimpleColumnFilter.tsx` - Column visibility toggle with persistence

**Custom Hooks**
- `useTableSort` - Table sorting functionality with header components
- `useAuth` - Authentication state and role checking
- `useToast` - Toast notification management
- `useConfirm` - Modal confirmation dialogs

### Data Management

**Licensee System**
- **CSV Import/Export**: Bulk licensee management with validation
- **Exclusion System**: Exclude specific licensees from courses
- **Group Associations**: Many-to-many relationships with judo groups
- **Belt Progression**: Track student belt colors and progression

**Course Session Management**
- **Automatic Session Creation**: Generate sessions based on course timetables
- **Attendance Tracking**: Per-session attendance with remarks and audit trail
- **Teacher Assignment**: Multi-teacher support with role-based access

### API Architecture

**Enhanced Endpoints**
- `/api/bureau/courses` - Full CRUD operations with validation
- `/api/bureau/licensees` - Licensee management with CSV operations
- `/api/bureau/teachers` - Teacher assignment and management
- `/api/courses/[courseId]/attendance` - Attendance tracking with validation
- `/api/admin/users` - Complete user management with role updates

**Error Handling**
- Consistent error responses with proper HTTP status codes
- Database transaction support for complex operations
- Validation middleware for input sanitization
- Proper cascade deletion for related records (attendance, exclusions, groups)
- Transaction rollback on deletion failures

### Key Features Implemented
- ✅ **Complete role-based authentication system** with Better Auth
- ✅ **Modern UI/UX design** with gradients, animations, and responsive cards
- ✅ **Advanced table management** with sorting, filtering, and column visibility controls
- ✅ **Multi-teacher course management** via junction tables and checkbox interface
- ✅ **Automated course creation system** for season setup
- ✅ **CSV import/export system** for licensee bulk operations
- ✅ **Licensee exclusion system** from specific courses
- ✅ **Toast notification system** with confirmation dialogs
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