# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Local Development
- `npm run dev` - Start development server (requires database setup)
- `npm run build` - Build production application (runs prisma generate automatically)
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Docker Development (Recommended)
- `docker compose up -d --build` - Build and start all services
- `docker compose exec web npx prisma migrate dev --name init` - Initialize database schema (first time only)
- `docker compose exec web npx prisma generate` - Generate Prisma client
- `docker compose exec web npx prisma studio` - Open Prisma Studio for database inspection
- `docker compose exec web npm run prisma:seed` - Run database seeder

### Database Commands
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:seed` - Seed database (currently no-op)

## Architecture Overview

This is a Next.js 15 attendance management application with the following stack:
- **Frontend**: Next.js 15 with App Router, TypeScript, Tailwind CSS
- **Authentication**: Better Auth with email/password
- **Database**: PostgreSQL with Prisma ORM
- **Deployment**: Docker with docker-compose

### Core Domain Models

The application centers around an attendance tracking system with these key entities:

1. **Users & Roles**: Users have roles (ADMIN, BUREAU, TEACHER) with optional Teacher profile
2. **Academic Structure**: Class → Course (taught by Teacher) → CourseSession (specific date/time)
3. **Attendance Tracking**: Each CourseSession has Attendance records for Students with status (PRESENT, JUSTIFIED, or null for unjustified absence)

### Key Database Relationships
- Users can be Teachers who teach Courses
- Classes contain Students and have multiple Courses
- Courses have scheduled Timetables and actual CourseSessions
- Attendance is tracked per CourseSession per Student
- Attendance records track who updated them (audit trail)

### Authentication Flow
- Better Auth handles email/password authentication
- Sessions stored in database with Prisma adapter
- No email verification required (configured for development)
- User roles determine access permissions

### API Structure
- `/api/auth/[...all]` - Better Auth endpoints
- `/api/courses/my` - Get current user's courses
- `/api/courses/[courseId]/students` - Get students for a course
- `/api/courses/[courseId]/attendance` - Manage attendance for course sessions

### File Structure
- `src/app/` - Next.js App Router pages and API routes
- `src/lib/` - Shared utilities (auth, prisma client)
- `prisma/` - Database schema and migrations
- `src/styles/` - Global CSS with Tailwind

### Development Notes
- Database IDs: Users use cuid() strings, other entities use auto-increment integers
- The app is configured for French language (`lang="fr"`)
- Docker setup includes PostgreSQL database with persistent volume
- Attendance tracking supports remarks and audit trail of who made changes