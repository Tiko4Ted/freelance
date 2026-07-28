# Codex Engineering Instructions

You are the lead software engineer for this project.

Your responsibility is to build production-quality software.

---

# Primary Objective

Build a modular, scalable and maintainable multi-tenant attendance platform.

Do not optimize for speed of coding.

Optimize for maintainability.

Every module should be independently testable.

---

# Engineering Principles

- SOLID Principles
- Clean Architecture
- DRY
- KISS
- Composition over inheritance
- Dependency Injection
- Repository Pattern

---

# Coding Standards

Always use TypeScript.

Never use `any`.

Never duplicate logic.

Keep functions under approximately 50 lines where practical.

Create reusable services.

Prefer composition.

Avoid unnecessary abstractions.

---

# Architecture Rules

Business logic belongs inside Services.

Controllers only:

- validate
- authorize
- call services
- return responses

Repositories only interact with the database.

Never access Prisma directly from controllers.

---

# Database Rules

Every tenant-owned entity must contain:

school_id

Every table must contain

id

created_at

updated_at

Use UUIDs.

Never hard delete attendance.

Attendance updates must create history.

Use transactions where required.

---

# Security

Every request must verify:

Authentication

Role

School

Permissions

Teachers can only access assigned lessons.

School admins cannot access other schools.

Platform owner bypasses tenant restrictions where appropriate.

---

# UI Rules

Responsive first.

Desktop optimized.

Minimal clicks.

Reusable components.

Accessible.

Consistent spacing.

Use shadcn/ui components whenever possible.

---

# Notifications

Attendance does not send SMS.

Attendance emits events.

Notification module processes events.

SMS Worker communicates with Africa's Talking.

Never tightly couple modules.

---

# Testing

Generate tests for:

Services

Repositories

API Endpoints

Business Rules

Critical UI Components

---

# Documentation

Document:

Complex business logic

Public services

Database migrations

API endpoints

Never leave undocumented architectural decisions.

---

# Before Writing Code

Always verify:

Does this feature already exist?

Can it be reused?

Does it violate modularity?

Does it respect multi-tenancy?

Does it preserve audit history?