# ReferralJobs

ReferralJobs is a portfolio-grade referral hiring platform based on the behavior described in `REFERRAL_APP_SPEC.md`.

The implementation is built as a single Next.js app with route handlers for the API, Prisma/PostgreSQL for transactional data, and a payout-provider abstraction planned around Stripe Connect.

## Current Checkpoint

Completed:
- Next.js 14 App Router scaffold with TypeScript, Tailwind, ESLint, and strict type checking.
- Prisma schema for users, jobs, referrals, applications, candidate identities, ledger entries, and withdrawals.
- Seed script with five demo jobs and one admin user.
- Shared Prisma client setup.
- Environment variable template.
- Project-specific landing shell.
- Implementation plan saved in `IMPLEMENTATION_PLAN.md`.

Next:
- Implement authentication and authorization.
- Add public job listing and job detail routes.
- Add referral-cookie capture.

## Stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL
- Auth.js v5
- Stripe Connect, planned for payout rail
- BullMQ/Redis, planned for background workers

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create environment variables:

```bash
cp .env.example .env
```

3. Set `DATABASE_URL` in `.env`.

4. Generate Prisma client:

```bash
npm run db:generate
```

5. Run migrations:

```bash
npm run db:migrate
```

6. Seed demo data:

```bash
npm run db:seed
```

7. Start the app:

```bash
npm run dev
```

## Quality Commands

```bash
npm run lint
npm run typecheck
npm run db:validate
npm run build
```

## Demo Admin

The seed script creates:

- Email: `admin@referraljobs.test`
- Password: `admin-password`

Authentication is not implemented yet, so these credentials become usable in the next checkpoint.
