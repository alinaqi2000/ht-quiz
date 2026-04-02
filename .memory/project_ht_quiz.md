---
name: HT Quiz Platform
description: Full-stack Next.js quiz management app — tech stack and deployment notes
type: project
---

Full-stack quiz platform built with:
- Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- SQLite via Prisma 7 + @prisma/adapter-libsql (libSQL/Turso)
- NextAuth.js v5 (beta) with CredentialsProvider
- Zod validation, react-hook-form, sonner toasts

Database: SQLite locally (`file:./dev.db`), Turso for Vercel production.

Admin seed credentials: admin@htquiz.com / admin123

**Why:** User explicitly requested SQLite (not PostgreSQL) for free Vercel deployment.

**How to apply:** Always use SQLite/libSQL for this project. Never suggest PostgreSQL.
