# ReferralJobs

ReferralJobs is a portfolio-grade referral hiring platform based on the behavior described in `REFERRAL_APP_SPEC.md`.

The implementation is built as a single Next.js app with route handlers for the API, Prisma/PostgreSQL for transactional data, and a payout-provider abstraction planned around Stripe Connect.

## Current Checkpoint

Completed:
- Next.js App Router scaffold with TypeScript, Tailwind, ESLint, and strict type checking.
- Prisma schema for users, jobs, referrals, applications, candidate identities, ledger entries, and withdrawals.
- Initial Prisma migration for the production PostgreSQL schema.
- Vercel-compatible build script that generates Prisma Client before `next build`.
- Seed script with five demo jobs and one admin user.
- Shared Prisma client setup.
- Environment variable template.
- Project-specific landing shell.
- Implementation plan saved in `IMPLEMENTATION_PLAN.md`.
- Auth.js credentials configuration with v1 registration, login, and refresh routes.
- Reusable authorization helpers for session and role checks.
- Public jobs API routes and active job listing/detail pages.
- First-touch referral cookie capture through Next.js proxy.
- Candidate application form and `/api/v1/applications` submission route.
- Referrer link and referred-application API routes.
- Login and registration pages.
- Referrer dashboard UI for links and referred applications.
- Admin job and application management APIs.
- Admin screens for jobs, applications, status changes, and progress logging.
- Wallet API and ledger-backed wallet page.
- Payout eligibility service with a runnable worker entrypoint.
- Payout-provider interface with a mock provider for local withdrawal processing.
- Withdrawal request API, transactional wallet debits, and processing worker.

Next:
- Replace the mock payout provider with Stripe Connect test mode.

## Stack

- Next.js 16 App Router
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
npm run jobs:payout-eligibility
npm run jobs:withdrawals
npm run build
```

## Demo Admin

The seed script creates:

- Email: `admin@referraljobs.test`
- Password: `admin-password`

Authentication is implemented through Auth.js credentials. The v1 authentication endpoints are:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `/login`
- `/register`
- `/dashboard`

## Admin

Implemented:

- `GET /api/v1/admin/jobs`
- `POST /api/v1/admin/jobs`
- `PATCH /api/v1/admin/jobs/:id`
- `GET /api/v1/admin/applications`
- `PATCH /api/v1/admin/applications/:id/status`
- `PATCH /api/v1/admin/applications/:id/hours`
- `/admin`
- `/admin/jobs`
- `/admin/applications`

## Wallet and Payout Eligibility

Implemented:

- `GET /api/v1/wallet`
- `POST /api/v1/wallet/payout-account`
- `GET /api/v1/wallet/payout-account/status`
- `POST /api/v1/withdrawals`
- `GET /api/v1/withdrawals`
- `POST /api/v1/admin/payout-eligibility/run`
- `POST /api/v1/admin/withdrawals/process`
- `/wallet`
- `npm run jobs:payout-eligibility`
- `npm run jobs:withdrawals`

The payout eligibility service credits referrers through `LedgerEntry` rows and updates `walletBalanceCents` inside the same database transaction.

Withdrawal requests debit the wallet and create a negative ledger entry inside a single transaction. The current payout provider is a local mock behind the provider interface; Stripe Connect is the next integration checkpoint.

## Public Jobs

Implemented:

- `GET /api/v1/jobs`
- `GET /api/v1/jobs/:id`
- `/jobs`
- `/jobs/[jobId]`
- `/jobs/[jobId]/apply`

## Referrals and Applications

Implemented:

- `GET /api/v1/referrals/me`
- `GET /api/v1/referrals/me/applications`
- `POST /api/v1/applications`

Referral links use `/jobs/[jobId]?ref=<referralCode>`. The proxy stores the first referral touch in an HTTP-only cookie and the application route validates it server-side.
