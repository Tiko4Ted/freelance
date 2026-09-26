import Link from "next/link";
import {
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileCheck2,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
  Wallet,
} from "lucide-react";

import { auth } from "@/auth";
import { PortalSidebar } from "@/components/portal-sidebar";
import { StatusBadge } from "@/components/status-badge";
import { prisma } from "@/lib/db/prisma";
import { LedgerService } from "@/lib/services/ledger-service";
import {
  OnboardingService,
  emptyOnboardingStatus,
} from "@/lib/services/onboarding-service";

export const dynamic = "force-dynamic";

function formatDate(value: Date | string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatPhone(countryCode?: string | null, phone?: string | null) {
  if (!phone) {
    return "Not added";
  }

  return `${countryCode ?? ""} ${phone}`.trim();
}

function statusLabel(value: boolean) {
  return value ? "Complete" : "Needs attention";
}

function statusClass(value: boolean) {
  return value
    ? "bg-emerald-50 text-emerald-700"
    : "bg-amber-50 text-amber-700";
}

function identityDocumentLabel(value?: string | null) {
  const labels: Record<string, string> = {
    national_id: "National ID",
    passport: "Passport",
    drivers_license: "Driver's license",
  };

  return labels[value ?? ""] ?? "Identity document";
}

export default async function ProfilePage() {
  const session = await auth();
  const userId = session?.user?.id;
  const isAuthenticated = Boolean(userId);

  const [user, onboarding, wallet] = userId
    ? await Promise.all([
        prisma.user.findUniqueOrThrow({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
            applications: {
              orderBy: { updatedAt: "desc" },
              take: 4,
              select: {
                id: true,
                status: true,
                updatedAt: true,
                taskSubmittedAt: true,
                job: {
                  select: {
                    title: true,
                    companyName: true,
                  },
                },
              },
            },
          },
        }),
        OnboardingService.getStatus(userId),
        LedgerService.getWallet(userId),
      ])
    : [
        {
          id: "profile-preview",
          email: "Sign in to view email",
          name: session?.user?.name || "Teddy",
          role: "CANDIDATE",
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          applications: [
            {
              id: "preview-application",
              status: "APPLIED",
              updatedAt: new Date("2026-09-01T00:00:00.000Z"),
              taskSubmittedAt: null,
              job: {
                title: "Project Artifacts",
                companyName: "Trinity-AI",
              },
            },
          ],
        },
        emptyOnboardingStatus(),
        {
          formattedHoldingBalance: "$0.00",
          formattedFundingBalance: "$0.00",
        },
      ];

  const completedSteps = [
    onboarding.legalComplete,
    onboarding.phoneVerified,
    onboarding.identityVerified,
    onboarding.paymentsSetup,
  ].filter(Boolean).length;
  const activeApplications = user.applications.filter((application) =>
    ["CERTIFIED", "MATCHED", "ACTIVE", "CERTIFYING"].includes(
      application.status,
    ),
  ).length;

  const profileItems = [
    {
      icon: Mail,
      label: "Email",
      value: user.email,
    },
    {
      icon: Phone,
      label: "Phone",
      value: formatPhone(onboarding.phoneCountryCode, onboarding.phoneNumber),
    },
    {
      icon: ShieldCheck,
      label: "Legal name",
      value: onboarding.identityLegalName ?? user.name,
    },
    {
      icon: CalendarDays,
      label: "Member since",
      value: formatDate(user.createdAt),
    },
  ];

  const readinessItems = [
    {
      complete: onboarding.legalComplete,
      label: "Legal agreements",
      value: onboarding.legalComplete
        ? "NDA and data submission terms signed"
        : "Sign legal agreements",
    },
    {
      complete: onboarding.phoneVerified,
      label: "Phone",
      value: onboarding.phoneVerified
        ? `Verified ${formatPhone(onboarding.phoneCountryCode, onboarding.phoneNumber)}`
        : "Verify phone number",
    },
    {
      complete: onboarding.identityVerified,
      label: "Identity",
      value: onboarding.identityVerified
        ? `${identityDocumentLabel(onboarding.identityDocumentType)} images confirmed`
        : "Verify identity",
    },
    {
      complete: onboarding.paymentsSetup,
      label: "Payments",
      value: onboarding.paymentsSetup
        ? `${onboarding.paymentMethod ?? "Payout"} connected`
        : "Set up payout destination",
    },
  ];

  return (
    <div className="flex min-h-screen bg-brand-canvas text-brand-ink">
      <PortalSidebar
        activeTab="profile"
        isAuthenticated={isAuthenticated}
        userName={user.name}
      />
      <main className="flex-1 overflow-y-auto px-6 py-8 md:px-12 md:py-10">
        <div className="mx-auto max-w-[1040px] space-y-8">
          <section className="rounded-2xl border border-brand-sand bg-brand-ivory p-6 shadow-brand-card">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand-ink text-2xl font-bold text-brand-gold-light shadow-brand-focus">
                  {(user.name.trim()[0] || "T").toUpperCase()}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-3xl font-bold tracking-tight text-brand-ink md:text-[34px]">
                      {user.name}
                    </h1>
                    {onboarding.complete ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        <BadgeCheck className="h-3.5 w-3.5" />
                        Verified
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-brand-muted">
                    {user.role.toLowerCase()} account for Trinity-AI work,
                    payouts, and applications.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-brand-sand bg-brand-ivory px-3 text-sm font-semibold text-brand-ink transition hover:border-brand-gold hover:bg-[#f2e8d7]"
                  href={isAuthenticated ? "/onboarding" : "/login"}
                >
                  <FileCheck2 className="h-4 w-4" />
                  Onboarding
                </Link>
                <Link
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-ink px-3 text-sm font-semibold text-brand-ivory transition hover:bg-[#35392c] focus:outline-none focus:ring-2 focus:ring-brand-gold/40"
                  href={isAuthenticated ? "/wallet" : "/login"}
                >
                  <Wallet className="h-4 w-4" />
                  Wallet
                </Link>
              </div>
            </div>
            {!isAuthenticated ? (
              <div className="mt-6 rounded-xl border border-brand-sand bg-[#f2e8d7] p-4 text-sm leading-6 text-brand-gold-strong">
                This is a profile preview. Sign in to load your saved
                verification, applications, and wallet details.
              </div>
            ) : null}
          </section>

          <section className="grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-brand-sand bg-brand-ivory p-5 shadow-brand-card">
              <p className="text-sm font-medium text-brand-muted">Readiness</p>
              <p className="mt-2 text-2xl font-bold text-brand-ink">
                {completedSteps}/4
              </p>
              <p className="mt-1 text-xs text-brand-muted">
                Onboarding steps complete
              </p>
            </div>
            <div className="rounded-2xl border border-brand-sand bg-brand-ivory p-5 shadow-brand-card">
              <p className="text-sm font-medium text-brand-muted">Applications</p>
              <p className="mt-2 text-2xl font-bold text-brand-ink">
                {user.applications.length}
              </p>
              <p className="mt-1 text-xs text-brand-muted">
                {activeApplications} active or in review
              </p>
            </div>
            <div className="rounded-2xl border border-brand-sand bg-brand-ivory p-5 shadow-brand-card">
              <p className="text-sm font-medium text-brand-muted">Holding</p>
              <p className="mt-2 text-2xl font-bold text-brand-ink">
                {wallet.formattedHoldingBalance}
              </p>
              <p className="mt-1 text-xs text-brand-muted">Awaiting release</p>
            </div>
            <div className="rounded-2xl border border-brand-gold/50 bg-[#f2e8d7] p-5 shadow-brand-card">
              <p className="text-sm font-medium text-brand-muted">Funding</p>
              <p className="mt-2 text-2xl font-bold text-brand-gold-strong">
                {wallet.formattedFundingBalance}
              </p>
              <p className="mt-1 text-xs text-brand-muted">Available balance</p>
            </div>
          </section>

          <section className="grid gap-8 lg:grid-cols-[1fr_22rem]">
            <div className="space-y-8">
              <section className="rounded-2xl border border-brand-sand bg-brand-ivory p-6 shadow-brand-card">
                <h2 className="text-xl font-bold text-brand-ink">
                  Account details
                </h2>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {profileItems.map((item) => {
                    const Icon = item.icon;

                    return (
                      <div
                        className="rounded-xl border border-brand-sand bg-brand-canvas/60 p-4"
                        key={item.label}
                      >
                        <div className="flex items-center gap-2 text-xs font-semibold text-brand-muted">
                          <Icon className="h-4 w-4" />
                          {item.label}
                        </div>
                        <p className="mt-2 break-words text-sm font-semibold text-brand-ink">
                          {item.value}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-2xl border border-brand-sand bg-brand-ivory p-6 shadow-brand-card">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-xl font-bold text-brand-ink">
                    Recent applications
                  </h2>
                  <Link
                    className="text-sm font-semibold text-brand-gold-strong hover:text-brand-ink hover:underline"
                    href="/apply"
                  >
                    View roles
                  </Link>
                </div>
                <div className="mt-5 divide-y divide-brand-sand overflow-hidden rounded-xl border border-brand-sand">
                  {user.applications.length ? (
                    user.applications.map((application) => (
                      <article
                        className="grid gap-3 bg-brand-canvas/40 p-4 md:grid-cols-[1fr_auto]"
                        key={application.id}
                      >
                        <div>
                          <h3 className="font-semibold text-brand-ink">
                            {application.job.title}
                          </h3>
                          <p className="mt-1 text-sm text-brand-muted">
                            {application.job.companyName} - Updated{" "}
                            {formatDate(application.updatedAt)}
                          </p>
                          {application.taskSubmittedAt ? (
                            <p className="mt-1 text-xs font-medium text-brand-muted">
                              Task submitted {formatDate(application.taskSubmittedAt)}
                            </p>
                          ) : null}
                        </div>
                        <StatusBadge status={application.status} />
                      </article>
                    ))
                  ) : (
                    <div className="p-6 text-sm text-brand-muted">
                      No applications yet. Browse roles to start building your
                      profile history.
                    </div>
                  )}
                </div>
              </section>
            </div>

            <aside className="space-y-6">
              <section className="rounded-2xl border border-brand-sand bg-brand-ivory p-6 shadow-brand-card">
                <h2 className="text-lg font-bold text-brand-ink">
                  Work readiness
                </h2>
                <div className="mt-5 space-y-3">
                  {readinessItems.map((item) => (
                    <div
                      className="rounded-xl border border-brand-sand bg-brand-canvas/60 p-4"
                      key={item.label}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-brand-ink">
                          {item.label}
                        </p>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(
                            item.complete,
                          )}`}
                        >
                          {statusLabel(item.complete)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-brand-muted">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-brand-sand bg-brand-ivory p-6 shadow-brand-card">
                <h2 className="text-lg font-bold text-brand-ink">
                  Account controls
                </h2>
                <div className="mt-5 space-y-3">
                  <Link
                    className="flex items-center justify-between rounded-xl border border-brand-sand bg-brand-canvas/40 px-4 py-3 text-sm font-semibold text-brand-ink transition hover:border-brand-gold hover:bg-[#f2e8d7]"
                    href={isAuthenticated ? "/onboarding" : "/login"}
                  >
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Finish verification
                    </span>
                    <Clock3 className="h-4 w-4 text-slate-400" />
                  </Link>
                  <Link
                    className="flex items-center justify-between rounded-xl border border-brand-sand bg-brand-canvas/40 px-4 py-3 text-sm font-semibold text-brand-ink transition hover:border-brand-gold hover:bg-[#f2e8d7]"
                    href={isAuthenticated ? "/wallet" : "/login"}
                  >
                    <span className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-brand-gold-strong" />
                      Manage payouts
                    </span>
                    <Wallet className="h-4 w-4 text-slate-400" />
                  </Link>
                  <Link
                    className="flex items-center justify-between rounded-xl border border-brand-sand bg-brand-canvas/40 px-4 py-3 text-sm font-semibold text-brand-ink transition hover:border-brand-gold hover:bg-[#f2e8d7]"
                    href="/home"
                  >
                    <span className="flex items-center gap-2">
                      <BriefcaseBusiness className="h-4 w-4 text-brand-gold-strong" />
                      Open projects
                    </span>
                    <UserRound className="h-4 w-4 text-slate-400" />
                  </Link>
                </div>
              </section>
            </aside>
          </section>
        </div>
      </main>
    </div>
  );
}
