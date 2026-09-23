# Trinity-AI Golden Theme Implementation Plan

## 1. Objective

Bring the full product into the visual world of the Trinity-AI logo without
turning every surface gold. The finished app should feel calm, trustworthy,
and work-focused: warm neutrals carry the interface, charcoal provides
structure, and gold marks decisions, progress, value, and brand moments.

This is a theme migration, not a layout redesign. Existing information
architecture, responsive behavior, and typography should remain stable unless
a small adjustment is required for accessibility or consistency.

## 2. Current-State Audit

The app currently uses several unrelated accent systems:

- Portal navigation and dashboards: blue (`#2563eb`, `#0066cc`).
- Job board and application flow: indigo (`#3547ff`, `#3142ff`).
- Authentication, admin, and wallet forms: teal.
- Help center: cyan (`#9af4f4`) and lime (`#ccff33`).
- Avatars and small identity accents: orange (`#c2410c`).
- Most surfaces and borders: cool Slate/Tailwind grays.

The logo itself is dominated by these sampled colors:

- Charcoal olive: `#26291F`.
- Bronze gold: `#B68A55`.
- Light gold: `#EBCC90`.

The migration should replace decorative blue, indigo, teal, cyan, lime, and
orange accents. Semantic success, warning, and error colors should remain
recognizable and should not be recolored gold.

## 3. Design Direction

### Brand character

Use a matte, editorial interpretation of gold rather than a glossy luxury
treatment. Trinity-AI is a work and payments platform, so gold should mean
earned value, verified progress, and trusted action—not decoration.

Avoid the generic “black and gold luxury” look:

- Do not use metallic gradients on buttons or cards.
- Do not make large bodies of text gold.
- Do not turn every background charcoal.
- Do not add gold glows, ornamental rules, or extra logo motifs.
- Keep gold to roughly 10% or less of a typical screen.

### Core palette

| Token | Hex | Role |
| --- | --- | --- |
| `brand-ink` | `#26291F` | Primary text, dark buttons, dark navigation surfaces |
| `brand-gold` | `#B68A55` | Selected controls, progress, focus, compact highlights |
| `brand-gold-light` | `#EBCC90` | Dark-surface text/icons and subtle highlights |
| `brand-gold-strong` | `#765027` | Accessible gold-family text on light surfaces |
| `brand-ivory` | `#FFFDF8` | Card and input surfaces |
| `brand-canvas` | `#F7F3EA` | Main page background |
| `brand-sand` | `#DED6C8` | Borders and dividers |
| `brand-muted` | `#686A61` | Secondary text |

Accessibility notes:

- `brand-gold` on `brand-ink` has approximately 4.76:1 contrast.
- `brand-gold-light` on `brand-ink` has approximately 9.56:1 contrast.
- `brand-gold` must not be used for normal-sized text on white (about 3.11:1).
- Use `brand-gold-strong` for gold-family text on light surfaces.
- Preserve emerald, amber, and red for success, warning, and error states.

### Typography and layout

- Retain Geist Sans and Geist Mono; the request is a color unification, not a
  brand-wide type redesign.
- Keep task pages and dashboards left-aligned for scanability.
- Keep centered alignment only where it already supports a short welcome or
  authentication moment.
- Preserve the current route layouts, spacing scale, and responsive
  breakpoints during the theme migration.

Target visual hierarchy:

```text
Authenticated product
+------------+---------------------------------------------+
| logo       | warm canvas                                 |
| navigation |  heading                                    |
| ink/gold   |  ivory cards + sand borders                 |
|            |  ink actions + restrained gold highlights  |
+------------+---------------------------------------------+

Public/task flow
+----------------------------------------------------------+
| logo + minimal ink/gold header                           |
+----------------------------------------------------------+
| warm canvas or ivory reading surface                     |
| charcoal copy, sand structure, gold focus/selection      |
+----------------------------------------------------------+
```

## 4. Token and Component Foundation

### 4.1 Add semantic tokens

Update `app/globals.css` with the palette above plus semantic aliases:

- `--color-page`, `--color-surface`, `--color-surface-muted`.
- `--color-text`, `--color-text-muted`, `--color-border`.
- `--color-action`, `--color-action-hover`, `--color-action-text`.
- `--color-accent`, `--color-accent-soft`, `--color-focus`.
- Existing semantic state tokens for success, warning, danger, and disabled.

Expose the tokens through `tailwind.config.ts` using names such as
`brand-ink`, `brand-gold`, `brand-ivory`, and `brand-canvas`. Components should
consume named tokens instead of repeating new hex literals.

### 4.2 Standardize repeated controls

Create or consolidate lightweight shared styles for:

- Primary button: charcoal background, ivory text, subtle gold hover/focus.
- Highlight button: bronze-gold background with charcoal text, reserved for
  one high-value action per view.
- Secondary button: ivory surface, sand border, charcoal text.
- Text link: `brand-gold-strong` on light surfaces; light gold on dark surfaces.
- Inputs/selects: ivory surface, sand border, gold focus ring.
- Cards: ivory surface, sand border, minimal neutral shadow.
- Active navigation/tab: soft gold background, ink text/icon, gold marker.
- Progress/stepper: gold for active/completed structure, not for errors.

Do not force a large component-library rewrite. Extract a primitive only when
the same treatment is repeated across at least three existing components.

## 5. Page-by-Page Migration

### Phase A — Shared shell and navigation

Files:

- `components/brand-logo.tsx`
- `components/portal-sidebar.tsx`
- `app/globals.css`
- `tailwind.config.ts`
- `app/global-error.tsx`

Treatment:

- Warm the global canvas and default foreground.
- Change active sidebar blue to soft gold with ink icons and labels.
- Replace the orange avatar default with bronze or ink.
- Use gold only for notification dots that are informational; keep red for
  urgent notifications if introduced later.
- Keep the logo as the richest gold element in the sidebar.
- Restyle the global error page with an ink background, light-gold focus, and
  ivory copy.

### Phase B — Candidate portal

Routes and components:

- `/home` — `components/home-dashboard-client.tsx`
- `/apply` — job discovery shell and filters
- `/onboarding` — `components/onboarding-flow-client.tsx`
- `/profile` — `app/profile/page.tsx`
- `/wallet` — `app/wallet/page.tsx`, `components/wallet/withdrawal-form.tsx`
- `/referral` and `/referral/jobs` — `components/referral-client.tsx`
- `/about-us` — `app/about-us/page.tsx`

Treatment:

- Replace blue selections, links, focus rings, and CTA states with semantic
  brand tokens.
- Use gold for onboarding progress, verified milestones, wallet funding
  emphasis, and referral value—not every statistic.
- Keep completion green, pending amber, and failures red.
- Change blue info panels to warm ivory/sand panels with an ink icon and a
  narrow gold accent.
- Replace referral indigo gradients with a restrained ink-to-charcoal field or
  a flat ink panel; use light gold for its key number or action.
- Keep cards mostly ivory so dense dashboards remain easy to scan.

### Phase C — Jobs and application funnel

Routes and components:

- `/jobs` and `/jobs/[jobId]`
- `components/jobs/job-board.tsx`
- `components/jobs/job-detail-shell.tsx`
- `components/jobs/job-detail-content.tsx`
- `/jobs/[jobId]/apply`
- `/jobs/[jobId]/apply/aptitude`
- `components/application-form.tsx`
- `components/application-feedback.tsx`
- `components/aptitude-test-form.tsx`

Treatment:

- Replace pale indigo job cards with ivory cards on a warm canvas.
- Use a soft gold border or small top/side accent for featured or selected
  jobs; normal cards retain sand borders.
- Convert indigo search, focus, option selection, progress, and apply actions
  to ink/gold tokens.
- Keep job metadata neutral and reserve `brand-gold-strong` for pay/value or
  the primary application action.
- Preserve long-form application readability with an ivory/white content
  surface rather than tinting every section.

### Phase D — Authentication and administration

Routes and components:

- `/login`, `/register`
- `components/auth/login-form.tsx`
- `components/auth/register-form.tsx`
- `/admin`, `/admin/jobs`, `/admin/applications`
- `components/admin/job-create-form.tsx`
- `components/admin/application-actions.tsx`

Treatment:

- Replace teal focus and hover states with gold focus and ink actions.
- Use a warm canvas with ivory form/admin surfaces.
- Keep admin information density high: gold should identify the current action
  or selected item, not decorate every row.
- Use the semantic status system for application state rather than a single
  brand color.

### Phase E — Help center

Routes and component:

- `/help-center`, `/help-center/[categoryId]`
- `components/help-center-client.tsx`

Treatment:

- Replace the cyan header with ivory or ink; choose ink for the main landing
  header and ivory for article views if route context supports it.
- Replace the oversized lime wordmark with a restrained light-gold treatment
  on ink, ensuring it does not compete with article navigation.
- Use gold focus rings and selection markers while leaving article cards ivory.
- Preserve the help center’s approachable personality through spacing and
  typography rather than an unrelated bright palette.

### Phase F — Statuses and edge states

Files:

- `components/status-badge.tsx`
- Empty, loading, validation, disabled, success, and error states across forms.

Treatment:

- Neutral: warm gray/ink.
- In progress, matched, active, or informational: soft gold plus accessible
  strong-gold text.
- Successful, paid, verified: emerald.
- Pending/review: amber.
- Failed/rejected: red.
- Disabled: warm gray, never low-contrast gold.

## 6. Implementation Sequence

1. Capture desktop and mobile baselines for every user-facing route.
2. Add global palette and semantic tokens without changing component colors.
3. Migrate shared shell, logo surroundings, sidebar, controls, and focus states.
4. Migrate the complete candidate journey: jobs → application → aptitude →
   onboarding → home/wallet.
5. Migrate profile, referral, about, authentication, and admin routes.
6. Migrate the help center as a deliberate sub-brand expression.
7. Normalize status badges and all empty/loading/error states.
8. Remove obsolete decorative blue/indigo/teal/cyan/lime/orange literals.
9. Run accessibility, responsive, interaction, and production-build checks.
10. Deploy to a preview, complete visual review, then merge to production.

Each phase should be a separate commit so visual regressions can be isolated or
reverted without undoing the entire theme migration.

## 7. Verification Matrix

### Automated

- `npm run typecheck`
- `npm test`
- Targeted ESLint on every changed TS/TSX file.
- `npm run build`
- Search for obsolete accent literals/classes and review every remaining use.

### Visual and interaction

Review at minimum at 390px, 768px, and 1440px:

- All routes render without clipped text or changed layout flow.
- Keyboard focus is visible on every interactive control.
- Hover, active, selected, disabled, loading, success, and error states remain
  distinguishable without relying on color alone.
- Normal text meets WCAG AA contrast; large decorative text meets its relevant
  threshold.
- Gold is never used as low-contrast body text on white/ivory.
- Status colors retain their semantic meaning.
- The logo remains visually dominant without competing gold blocks nearby.

### Route smoke path

1. Register or sign in.
2. Browse and search jobs.
3. Open a job, apply, and complete the aptitude flow.
4. Complete phone, identity, payments, and legal onboarding.
5. Review home, profile, referrals, wallet, help, and about pages.
6. Review admin jobs and applications with multiple status values.

## 8. Acceptance Criteria

- Every user-facing route uses the same tokenized ink/gold/warm-neutral system.
- No route retains an unrelated decorative blue, indigo, teal, cyan, lime, or
  orange brand treatment.
- Semantic green, amber, and red states remain intact and accessible.
- There are no broad mechanical color swaps that reduce hierarchy or contrast.
- Gold remains an accent tied to value, progress, focus, and selection.
- The app passes lint, type checking, tests, and production build.
- Desktop and mobile screenshots show a cohesive product without a forced
  “gold everywhere” effect.

## 9. Out of Scope

- Changing the logo artwork.
- Rewriting page copy or information architecture.
- Replacing Geist fonts.
- Redesigning layouts or introducing decorative animation.
- Changing business logic, API behavior, onboarding requirements, or status
  meanings.
