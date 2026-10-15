# Aptitude test variants

## Objective

Give each applicant a durable, randomly selected aptitude-test version while keeping the same scoring rule, retry policy, and applicant experience.

## Design

1. Store a version bank on the project: 20 versions, 15 questions per version, and `passingCorrect: 12`.
2. When the aptitude page opens, create or reuse an `AptitudeAttempt` row. The row stores the applicant email, attempt number, selected version, and status.
3. Use a database transaction with serializable isolation so two simultaneous requests cannot create duplicate attempt numbers. An in-progress attempt is reused on refresh.
4. Score server-side against the stored version ID. The browser submits answers and the attempt ID, but never chooses the answer key.
5. On failure, mark the attempt submitted and set `retryAvailableAt` to 72 hours later. The existing application row is updated instead of creating duplicate applications.
6. Schedule a durable delayed email through the existing Vercel Queue integration. The worker re-checks that the retry is still valid before sending.
7. Block new attempts after three submitted failures. A passed attempt also blocks further attempts for that project and email.

## Verification gates

- Every version has exactly 15 questions.
- Version IDs are unique.
- Question IDs are unique across the entire bank.
- Question prompts are unique across the entire bank.
- Every version uses the same 12-of-15 passing threshold.
- The selected version is persisted and reused on refresh.
- Retry timing and the three-attempt limit are enforced in the database-backed service, not only in the UI.

## High-traffic behavior

The assignment path uses indexed lookups, a short serializable transaction, and no in-memory state. Email delivery is asynchronous and idempotent through the existing queue, so concurrent applicants do not share a process-local test assignment or block the request while email is sent.
