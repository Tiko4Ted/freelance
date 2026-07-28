# ReferralJobs — Full Build Specification
### For: terminal coding agent (Claude Code)
### Reference product studied: micro1's referral platform (refer.micro1.ai + micro1.ai/referral-program)
### Type: portfolio project — full clone of the referral-job mechanic, not affiliated with micro1

---

## 1. What the reference product actually does (investigation findings)

Studied via micro1's public referral-program page and third-party reviews (Jan–Jul 2026 sources). Confirmed mechanics:

**Actors:** Referrer (anyone, no account needed to start), Candidate (the referred person), Client company (whose jobs are listed), Platform (micro1 itself, acting as marketplace + escrow).

**Flow:**
1. Referrer registers (lightweight — just enough to capture referral-policy consent), gets a unique referral link per job or a general code.
2. Referrer shares the link. Candidate clicks it → lands on job listing with the code embedded in the URL.
3. Candidate applies. Attribution is **locked to the referral link at application time** — if the candidate had already applied independently before ever clicking a referral link, no attribution is possible, even retroactively.
4. Candidate goes through an AI interview ("certification") + possible follow-up skills assessment.
5. If matched and hired, the candidate works. Payout triggers **after 10 hours of work, or 1 completed task for per-task projects**, and this must happen **within 3 months of onboarding** (a payout deadline/expiry window).
6. Payout is credited to the referrer's **in-platform wallet**, withdrawable anytime via the referrer's **preferred payment method** (i.e., wallet balance is decoupled from payout rail).

**Business rules that matter for correctness (these are the parts people get wrong when cloning this):**
- Payouts are **flat fixed amounts per job**, not a percentage of salary — shown on the job listing before referring.
- **One payout per candidate, ever** — tied to whichever role the candidate is *first successfully matched to*. If later hired into a second role too, no second payout.
- **Payout amount is locked at the candidate's application time**, not at payout time. If a job's referral bonus changes from $X to $Y after a candidate already applied, that candidate's referrer still gets $X. Only candidates applying after the change get $Y.
- No cap on number of referrals per referrer.
- Referral is void if the candidate signs up without ever using a referral link — there is no manual reattribution path.

This gives us an unusually well-specified reference to clone precisely, rather than a vague "make a referral system."

---

## 2. Scope for this build

Full-stack app, single portfolio repo, deployable. In scope:
- Job listings (admin-managed)
- Referral link generation + first-touch attribution via cookie
- Candidate application flow
- Status pipeline: applied → certifying → certified → matched/hired → active → payout-eligible → paid
- Wallet ledger (append-only, auditable) + withdrawal requests
- **Real payment provider integration for payouts** (not just an internal number)
- Admin panel to manage jobs, review applications, advance candidate status, approve withdrawals
- Fraud guardrails matching the rules above

Out of scope (note but don't build): actual AI interview bot, real client-company onboarding, KYC/tax compliance beyond a stub.

---

## 3. Tech stack

**Decision: single Next.js app, no separate backend service.** For a solo build, one deployable codebase beats a Next.js + Fastify split. A separate backend only earns its keep when you need independent scaling or a hard team boundary — neither applies here, and splitting adds CORS/auth-sharing overhead for zero benefit. The interesting engineering in this project is the ledger and payout logic, not a service boundary.

- **Frontend + Backend:** Next.js 14 (App Router), Tailwind, TypeScript. Use Route Handlers (`app/api/v1/.../route.ts`) for the API surface in Section 8 — keep it versioned under `/api/v1` even though it lives in the same app. Referral-cookie logic (Section 5) is implemented server-side via middleware, not client JS.
- **DB:** PostgreSQL via Prisma. Non-negotiable for this project specifically — the ledger/withdrawal logic in Section 7 depends on real transactions (`prisma.$transaction`). Do not substitute a NoSQL/eventually-consistent store; money-handling logic needs strict consistency.
- **Auth:** Auth.js (NextAuth) v5. Faster to stand up correctly than hand-rolled JWT, and auth isn't the part of this project worth reinventing.
- **Queue/jobs:** BullMQ + Redis (use **Upstash Redis** if deploying serverless on Vercel) for: payout-eligibility checks, 3-month expiry sweeps, withdrawal processing. Do not replace this with a `setInterval` or a bare cron-hit endpoint — Vercel serverless functions don't stay alive for that, and this is genuinely async worker territory. If avoiding a persistent worker process entirely, Upstash QStash is an acceptable substitute for BullMQ.
- **Payments (payout rail — pick provider abstraction, implement at least one fully):**
  - **Stripe Connect (Express accounts), test mode** for global card/bank payouts — primary implementation. Best-documented payout API for webhooks + idempotency keys; you'll spend time on business logic, not fighting the SDK.
  - **M-Pesa B2C (Daraja API)** as a second provider behind the same interface, for local-rail realism — implement if time allows, otherwise stub with the same contract so it's a 1-file swap.
- **Deployment:** Vercel (app) + Neon or Supabase (Postgres, server-side access only) + Upstash (Redis/queue). All have free tiers that match this stack natively.

**Guardrail regardless of provider choices:** never write to the wallet/ledger tables from client-side code (e.g. a Supabase client SDK call from the frontend). Every money-touching write goes through a server-side Route Handler wrapped in `prisma.$transaction`, full stop.
- **Payment abstraction contract** (implement Stripe first, this interface must be respected):
```ts
interface PayoutProvider {
  createPayoutAccount(userId: string): Promise<{ providerAccountId: string; onboardingUrl?: string }>;
  isAccountReady(providerAccountId: string): Promise<boolean>;
  sendPayout(params: { providerAccountId: string; amount: number; currency: string; idempotencyKey: string }): Promise<{ providerPayoutId: string; status: "pending" | "paid" | "failed" }>;
  handleWebhook(payload: unknown, signature: string): Promise<PayoutWebhookEvent>;
}
```

---

## 4. Data model (Prisma schema)

```prisma
model User {
  id                 String   @id @default(uuid())
  email              String   @unique
  passwordHash       String
  name               String
  role               Role     @default(REFERRER)
  referralCode       String   @unique @default(uuid())
  walletBalanceCents Int      @default(0)
  payoutProvider     String?  // "stripe" | "mpesa"
  payoutAccountId    String?  // provider-side account/recipient id
  payoutAccountReady Boolean  @default(false)
  createdAt          DateTime @default(now())

  referrals          Referral[]
  ledgerEntries      LedgerEntry[]
  withdrawals        Withdrawal[]
}

enum Role {
  REFERRER
  CANDIDATE
  ADMIN
}

model Job {
  id                String   @id @default(uuid())
  title             String
  description       String
  payoutAmountCents Int
  payoutType        PayoutTrigger @default(HOURS_10)
  currency          String   @default("USD")
  isActive          Boolean  @default(true)
  createdAt         DateTime @default(now())
  applications      Application[]
}

enum PayoutTrigger {
  HOURS_10
  TASK_1
}

model Application {
  id                String   @id @default(uuid())
  jobId             String
  job               Job      @relation(fields: [jobId], references: [id])
  candidateEmail    String
  candidateName     String
  referralId        String?  @unique
  referral          Referral? @relation(fields: [referralId], references: [id])
  status            ApplicationStatus @default(APPLIED)
  lockedPayoutCents Int?     // snapshot of job.payoutAmountCents AT APPLICATION TIME — never recompute later
  hoursLogged       Float    @default(0)
  tasksCompleted    Int      @default(0)
  onboardedAt       DateTime?
  payoutDeadline    DateTime? // onboardedAt + 3 months
  createdAt         DateTime @default(now())

  @@unique([candidateEmail, jobId]) // candidate can't double-apply to same job
}

enum ApplicationStatus {
  APPLIED
  CERTIFYING
  CERTIFIED
  MATCHED
  ACTIVE
  PAYOUT_ELIGIBLE
  PAID
  EXPIRED       // missed the 3-month window
  REJECTED
}

model Referral {
  id            String   @id @default(uuid())
  referrerId    String
  referrer      User     @relation(fields: [referrerId], references: [id])
  jobId         String
  clickedAt     DateTime @default(now())
  application   Application?

  @@index([referrerId])
}

model CandidateIdentity {
  // enforces "one payout ever, tied to first successful match" across ALL jobs, not just per-job
  email          String   @id
  firstMatchedApplicationId String? @unique
  hasBeenPaidOut Boolean  @default(false)
}

model LedgerEntry {
  // append-only, auditable wallet ledger — never mutate walletBalanceCents directly, always derive/reconcile from this
  id            String   @id @default(uuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  amountCents   Int      // positive = credit, negative = debit
  reason        String   // "REFERRAL_PAYOUT" | "WITHDRAWAL" | "WITHDRAWAL_REVERSAL"
  applicationId String?
  createdAt     DateTime @default(now())
}

model Withdrawal {
  id                String   @id @default(uuid())
  userId            String
  user              User     @relation(fields: [userId], references: [id])
  amountCents       Int
  status            WithdrawalStatus @default(PENDING)
  providerPayoutId  String?
  requestedAt       DateTime @default(now())
  completedAt       DateTime?
  failureReason     String?
}

enum WithdrawalStatus {
  PENDING
  PROCESSING
  PAID
  FAILED
}
```

---

## 5. Attribution mechanism (implement exactly this way)

- Route: `GET /jobs/:jobId?ref=<referralCode>`
- Middleware: if request has `?ref=` **and no existing `ref_code` cookie is set**, set an httpOnly, secure cookie `ref_code=<referralCode>` scoped to the job, 30-day expiry. If a cookie already exists, do not overwrite it — **first touch wins**.
- On `POST /api/v1/applications`:
  1. Read `ref_code` cookie server-side (never accept referral code from request body — it's forgeable).
  2. Check `CandidateIdentity` table by candidate email — if `hasBeenPaidOut` or already has a `firstMatchedApplicationId` set (meaning they've already been successfully matched to something before), still allow the application (candidates can apply to multiple roles) but flag it: payout eligibility will resolve to whichever match happened first, and only that one pays.
  3. Snapshot `job.payoutAmountCents` into `Application.lockedPayoutCents` at creation time — this is what actually implements the "amount locked at application time" rule from Section 1.
  4. Create `Referral` row only if a valid, active referrer's code was found; otherwise the application has no referral attached (no retroactive attribution, ever — this must not be an admin-editable field for non-superadmins).

---

## 6. Payout eligibility job (BullMQ recurring worker)

Runs hourly. For every `Application` in `ACTIVE` status:
1. If `hoursLogged >= 10` OR (`job.payoutType == TASK_1` AND `tasksCompleted >= 1`) → check `CandidateIdentity.firstMatchedApplicationId`.
   - If null → set it to this application's id, mark this application `PAYOUT_ELIGIBLE`.
   - If already set to a *different* application → mark this one `PAID` with $0 effect (no ledger entry) — this is the "already matched elsewhere first" case. Log it clearly, don't silently drop it.
2. If `payoutDeadline` has passed and application never hit the threshold → mark `EXPIRED`, no payout, no ledger entry.
3. On `PAYOUT_ELIGIBLE`: create a `LedgerEntry` for `referral.referrer` with `amountCents = application.lockedPayoutCents`, reason `REFERRAL_PAYOUT`, then recompute `walletBalanceCents` from the ledger sum (or increment it transactionally — use a DB transaction, this must never race with a withdrawal).

---

## 7. Withdrawal flow (real money out — this is the part that needs care)

1. `POST /api/v1/withdrawals` — user requests withdrawal up to `walletBalanceCents`.
2. Create `Withdrawal` row `PENDING`, immediately create a matching negative `LedgerEntry` (debit) inside the same DB transaction so balance can't be double-spent while the payout is processing.
3. Worker picks up `PENDING` withdrawals: calls `PayoutProvider.sendPayout()` with an **idempotency key** = withdrawal id (critical — network retries must not double-pay).
4. On provider webhook confirming success → `Withdrawal.status = PAID`.
5. On provider webhook confirming failure → `Withdrawal.status = FAILED`, reverse the debit with a new `LedgerEntry` reason `WITHDRAWAL_REVERSAL` (never delete/edit the original entry — ledger is append-only, always audit via full history).
6. Minimum withdrawal amount, and a check that `payoutAccountReady == true` before allowing a withdrawal request at all (Stripe Connect Express accounts need onboarding completion first).

---

## 8. API surface (`/api/v1`)

```
Auth
  POST /auth/register
  POST /auth/login
  POST /auth/refresh

Jobs (public)
  GET  /jobs
  GET  /jobs/:id

Referrals
  GET  /referrals/me                 — my code + shareable links per job
  GET  /referrals/me/applications    — my referred applications + statuses

Applications
  POST /applications                 — candidate applies, reads ref_code cookie server-side

Wallet
  GET  /wallet                       — balance + ledger history
  POST /wallet/payout-account        — start Stripe/M-Pesa onboarding
  GET  /wallet/payout-account/status
  POST /withdrawals
  GET  /withdrawals

Admin (role=ADMIN only)
  POST /admin/jobs
  PATCH /admin/jobs/:id
  GET  /admin/applications
  PATCH /admin/applications/:id/status   — advance pipeline (simulates the AI interview / hiring / hours-logging that a real client would report)
  PATCH /admin/applications/:id/hours    — manually log hours worked, for demo purposes
  GET  /admin/withdrawals
  POST /admin/withdrawals/:id/retry

Webhooks
  POST /webhooks/stripe
  POST /webhooks/mpesa
```

---

## 9. Fraud/edge-case checklist (test these explicitly)

- [ ] Self-referral blocked (`candidateEmail === referrer.email`)
- [ ] Candidate applies with no `ref_code` cookie → application created, no `Referral` row, no error
- [ ] Candidate applies to Job A via ref link, later applies to Job B independently → Job A referral stands, Job B has none
- [ ] Two different referral links clicked before applying → first cookie set wins, second click does not overwrite it
- [ ] Job's payout amount changed after Application X already exists → X keeps its `lockedPayoutCents`, new applications get new amount
- [ ] Candidate matched/hired at two different jobs → only the first to cross the payout threshold pays out; second is marked PAID with $0 and logged
- [ ] Withdrawal requested twice rapidly (double-click) → idempotency key + DB-transaction debit prevents double payout
- [ ] Application sits past 3-month deadline without hitting threshold → auto-EXPIRED, no payout, referrer notified
- [ ] Wallet balance is never written directly — always derived from/reconciled against `LedgerEntry` sum in tests

---

## 10. Suggested build order for the agent

1. Prisma schema + migrations, seed script with 5 demo jobs
2. Auth (register/login/refresh)
3. Job listing pages (public) + admin job CRUD
4. Referral code generation + cookie attribution middleware + application submission
5. Referrer dashboard: my code, my referred applications with live status
6. Admin panel: move applications through the pipeline manually (this replaces the real AI-interview/client-hiring systems for demo purposes)
7. BullMQ payout-eligibility worker + ledger
8. Stripe Connect Express onboarding + payout webhook handling
9. Withdrawal flow end-to-end, tested against Stripe test mode
10. (Stretch) M-Pesa B2C as second `PayoutProvider` implementation
11. Fraud checklist as an actual test suite (Section 9), not just manual QA

---

## 11. What the agent should NOT invent

- Do not build a real AI interview bot — the admin panel's manual status-advance replaces it.
- Do not integrate a real client-company portal — jobs are admin-created directly.
- Do not skip the ledger/idempotency requirements to "get payouts working faster" — this is the one part of the app where a shortcut becomes a real bug (double payment) even in a portfolio project, and it's also the most interview-worthy part to have gotten right.
