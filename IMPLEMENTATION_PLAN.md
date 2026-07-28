# ReferralJobs Implementation Plan

Source of truth: `REFERRAL_APP_SPEC.md`.

Note: `.codex/AGENT.md` currently describes an attendance platform, which conflicts with this repository's referral-app specification. This plan follows the referral-app spec.

## 1. Delivery Goals

- Build a deployable full-stack Next.js referral-jobs platform.
- Preserve the exact referral mechanics from the spec: first-touch attribution, application-time payout locking, one payout per candidate ever, wallet ledger auditability, and real payout integration.
- Keep all money-touching writes server-side, transactional, and test-covered.
- Prioritize correctness of attribution, payout eligibility, ledger entries, withdrawal idempotency, and failure recovery.

## 2. Target Architecture

- Next.js App Router application with TypeScript.
- Route Handlers under `/app/api/v1`.
- Prisma with PostgreSQL for relational and transactional consistency.
- Auth.js v5 for authentication and sessions.
- Middleware for referral-cookie capture.
- BullMQ with Redis or Upstash Redis for asynchronous payout checks and withdrawal processing.
- Stripe Connect Express as the first complete payout provider.
- Optional M-Pesa B2C provider behind the same payout interface after Stripe is stable.

Recommended internal structure:

```text
app/
  api/v1/
  jobs/
  dashboard/
  admin/
components/
features/
  applications/
  auth/
  jobs/
  referrals/
  wallet/
  withdrawals/
  admin/
lib/
  auth/
  db/
  payments/
  queue/
  repositories/
  services/
  validation/
prisma/
  schema.prisma
  seed.ts
workers/
tests/
```

## 3. Core Domain Rules

Implement these as service-level invariants, not scattered controller logic:

- Referral attribution is read only from the `ref_code` cookie.
- First referral cookie wins and must not be overwritten by later referral links.
- Applications without referral cookies are valid and never retroactively attributed.
- Self-referrals are blocked.
- `Application.lockedPayoutCents` snapshots the job payout at application creation.
- A candidate can apply to multiple jobs, but only the first successful matched application can produce a referral payout.
- Ledger entries are append-only.
- Wallet balance is created by transactional ledger updates and reconciled against ledger sums.
- Withdrawals debit the ledger at request time to prevent double spending.
- Provider payout calls use `withdrawal.id` as the idempotency key.
- Failed withdrawals are reversed with a new ledger entry, never by deleting or mutating history.

## 4. Phase Plan

### Phase 0: Project Bootstrap

Tasks:
- Create the Next.js TypeScript app in the current repository.
- Add Tailwind CSS and base UI setup.
- Add Prisma, PostgreSQL configuration, and environment variable templates.
- Add Auth.js dependencies.
- Add testing stack for unit, integration, and UI tests.
- Add linting, formatting, and typecheck scripts.

Acceptance criteria:
- `npm run lint`, `npm run typecheck`, and the test command exist.
- App boots locally.
- Environment variables are documented in `.env.example`.

### Phase 1: Database Schema and Seed Data

Tasks:
- Implement Prisma models from the spec.
- Add `updatedAt` fields where needed for operational records.
- Add indexes for status queues and lookup-heavy paths.
- Add migration.
- Add seed script with five demo jobs and one admin user.

Additional recommended indexes:
- `Application.status`
- `Application.candidateEmail`
- `Application.payoutDeadline`
- `Withdrawal.status`
- `LedgerEntry.userId`
- `LedgerEntry.applicationId`

Acceptance criteria:
- Fresh database can migrate and seed successfully.
- Seeded jobs display realistic payout amounts and trigger types.
- Schema supports transactional payout and withdrawal flows.

### Phase 2: Authentication and Authorization

Tasks:
- Implement register and login using Auth.js.
- Store password hashes server-side.
- Add role support: `REFERRER`, `CANDIDATE`, `ADMIN`.
- Add route protection helpers.
- Add admin-only guard for admin API routes and admin pages.

Acceptance criteria:
- Users can register and log in.
- Admin endpoints reject non-admin users.
- Session user includes `id`, `email`, and `role`.

### Phase 3: Public Jobs and Referral Links

Tasks:
- Build public jobs index page.
- Build job detail page at `/jobs/[jobId]`.
- Implement referral URL pattern: `/jobs/[jobId]?ref=<referralCode>`.
- Implement middleware to set `ref_code` cookie only when no existing cookie is present.
- Scope cookie to the job path where practical, with 30-day expiry, `httpOnly`, `secure`, and `sameSite=lax`.
- Build `/api/v1/referrals/me` for shareable links per job.

Acceptance criteria:
- Referrer can copy links for active jobs.
- First referral click sets the cookie.
- Later referral clicks do not overwrite the existing cookie.
- Job pages remain accessible without a referral code.

### Phase 4: Application Submission and Attribution

Tasks:
- Build candidate application form.
- Implement `POST /api/v1/applications`.
- Read referral code from the server-side cookie only.
- Validate job is active.
- Snapshot `job.payoutAmountCents` to `lockedPayoutCents`.
- Create a `Referral` only when the cookie maps to a valid active referrer and is not a self-referral.
- Create or update `CandidateIdentity` as needed.
- Enforce unique application per candidate email and job.

Acceptance criteria:
- Candidate can apply with or without attribution.
- Referral code in request body is ignored.
- Self-referral is rejected or creates an unattributed application according to final product decision.
- Payout amount changes do not affect existing applications.

### Phase 5: Referrer Dashboard

Tasks:
- Build referrer dashboard.
- Show referral code and job-specific links.
- Show referred applications and statuses.
- Show wallet summary.

Acceptance criteria:
- Referrer can see active referral opportunities.
- Referrer can track candidate status progression.
- No admin-only data is exposed.

### Phase 6: Admin Panel

Tasks:
- Build admin job CRUD.
- Build application review list.
- Add status transition endpoint: `PATCH /api/v1/admin/applications/:id/status`.
- Add hours logging endpoint: `PATCH /api/v1/admin/applications/:id/hours`.
- Add task-completion logging for `TASK_1` jobs.
- Set `onboardedAt` and `payoutDeadline` when an application becomes active.

Acceptance criteria:
- Admin can create and update jobs.
- Admin can advance applications through the demo pipeline.
- Status changes validate allowed transitions.
- Activation creates the three-month payout deadline.

### Phase 7: Payout Eligibility Worker and Ledger

Tasks:
- Add queue configuration.
- Implement hourly payout eligibility worker.
- Find `ACTIVE` applications eligible by hours or task count.
- Enforce `CandidateIdentity.firstMatchedApplicationId`.
- Mark first eligible application as `PAYOUT_ELIGIBLE`.
- Create `REFERRAL_PAYOUT` ledger entry transactionally.
- Recompute or transactionally update wallet balance.
- Expire applications that miss the three-month deadline.
- Log duplicate successful matches with zero payout effect.

Acceptance criteria:
- Eligible referred applications credit exactly one wallet once.
- Second matched application for the same candidate does not credit another payout.
- Expired applications produce no ledger entry.
- Re-running the worker is idempotent.

### Phase 8: Payout Provider Abstraction and Stripe

Tasks:
- Define `PayoutProvider` interface from the spec.
- Implement Stripe Connect Express provider.
- Implement payout account onboarding endpoint.
- Implement payout account readiness check.
- Implement Stripe webhook route.
- Store provider IDs and statuses.
- Verify webhook signatures.

Acceptance criteria:
- Referrer can start Stripe onboarding in test mode.
- App records payout account readiness.
- Webhook handler is idempotent and signature-verified.

### Phase 9: Withdrawal Flow

Tasks:
- Implement `POST /api/v1/withdrawals`.
- Enforce minimum withdrawal amount.
- Enforce `payoutAccountReady`.
- Create withdrawal and debit ledger entry in one transaction.
- Implement pending withdrawal worker.
- Call provider with idempotency key equal to withdrawal ID.
- Mark withdrawal as `PROCESSING`, `PAID`, or `FAILED`.
- Reverse failed withdrawals with `WITHDRAWAL_REVERSAL`.
- Build wallet and withdrawal UI.

Acceptance criteria:
- Double-clicked withdrawal cannot double-spend.
- Failed payout restores wallet balance through a new ledger entry.
- Paid payout leaves debit in place and marks withdrawal complete.
- Ledger remains append-only.

### Phase 10: Tests and Fraud Checklist

Tasks:
- Add service unit tests for attribution, payout eligibility, ledger, and withdrawals.
- Add repository or integration tests around Prisma transactions.
- Add API tests for core routes.
- Add UI smoke tests for public jobs, application submission, dashboard, and admin flow.
- Convert every item in Section 9 of the spec into an automated test.

Required fraud tests:
- Self-referral is blocked.
- Application without cookie creates no referral.
- First referral cookie wins.
- Payout amount is locked at application time.
- Candidate can only generate one referral payout ever.
- Rapid duplicate withdrawals cannot double-pay.
- Expired applications do not create ledger entries.
- Wallet balance matches ledger sum.

Acceptance criteria:
- Fraud checklist is automated.
- Critical money and attribution tests run in CI.
- Worker jobs are covered for idempotency.

### Phase 11: Deployment

Tasks:
- Configure Vercel project.
- Provision PostgreSQL using Neon or Supabase.
- Provision Redis using Upstash.
- Configure Stripe test credentials and webhook endpoint.
- Add production environment variables.
- Run migration during deployment workflow.
- Document deployment and local development.

Acceptance criteria:
- App deploys successfully.
- Public job flow works in production.
- Stripe test payout flow works against test-mode webhooks.
- README contains setup, env vars, and demo credentials.

## 5. API Implementation Order

1. `POST /api/v1/auth/register`
2. `POST /api/v1/auth/login`
3. `GET /api/v1/jobs`
4. `GET /api/v1/jobs/:id`
5. `GET /api/v1/referrals/me`
6. `GET /api/v1/referrals/me/applications`
7. `POST /api/v1/applications`
8. `GET /api/v1/wallet`
9. `POST /api/v1/wallet/payout-account`
10. `GET /api/v1/wallet/payout-account/status`
11. `POST /api/v1/withdrawals`
12. `GET /api/v1/withdrawals`
13. `POST /api/v1/admin/jobs`
14. `PATCH /api/v1/admin/jobs/:id`
15. `GET /api/v1/admin/applications`
16. `PATCH /api/v1/admin/applications/:id/status`
17. `PATCH /api/v1/admin/applications/:id/hours`
18. `GET /api/v1/admin/withdrawals`
19. `POST /api/v1/admin/withdrawals/:id/retry`
20. `POST /api/v1/webhooks/stripe`
21. `POST /api/v1/webhooks/mpesa` as stretch

## 6. Key Services

- `AuthService`: registration, password verification, session user shaping.
- `JobService`: public job reads and admin job management.
- `ReferralService`: referral link generation and referrer application views.
- `ApplicationService`: application creation, referral attribution, payout snapshotting.
- `AdminApplicationService`: validated status transitions, hours and task logging.
- `PayoutEligibilityService`: recurring eligibility checks and ledger credits.
- `LedgerService`: append-only ledger writes, balance reconciliation.
- `WithdrawalService`: withdrawal request, debit, retry, and reversal logic.
- `PayoutAccountService`: provider onboarding and readiness checks.
- `StripePayoutProvider`: Stripe Connect implementation.

## 7. Data Integrity Requirements

- Use database transactions for application creation with referral creation.
- Use transactions for payout eligibility changes and ledger credits.
- Use transactions for withdrawal creation and wallet debit.
- Add uniqueness or idempotency protections where worker retries can occur.
- Never expose Prisma calls directly from route handlers.
- Keep route handlers thin: validate input, authorize, call service, return response.

## 8. UI Scope

Public:
- Jobs list.
- Job detail.
- Candidate application form.

Referrer:
- Dashboard overview.
- Referral links.
- Referred applications.
- Wallet and ledger history.
- Payout onboarding and withdrawals.

Admin:
- Jobs management.
- Application pipeline management.
- Hours and task logging.
- Withdrawal review and retry.

## 9. Major Risks

- Cookie scoping can accidentally lose attribution if scoped too narrowly. Verify actual browser behavior with tests.
- Stripe Connect onboarding has multiple account states. Treat provider readiness as authoritative, not just "account exists".
- Worker retries can create duplicate credits without idempotent transaction design.
- Wallet balances can drift if direct writes are allowed. Keep ledger reconciliation tests mandatory.
- Auth.js v5 setup details may affect route handler organization; isolate auth helpers early.

## 10. Definition of Done

- Full candidate referral flow works from link click through application.
- Admin can simulate certification, matching, activation, hours/tasks, and payout eligibility.
- Referrer wallet receives a locked, correct payout exactly once.
- Referrer can request a real Stripe test-mode payout after onboarding.
- Failed payout is reversed through ledger history.
- Fraud checklist is automated.
- App is deployable with documented environment variables and setup steps.
