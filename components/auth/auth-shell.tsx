import Link from "next/link";
import type { ReactNode } from "react";

import { BrandLogo } from "@/components/brand-logo";
import { PortalSidebar } from "@/components/portal-sidebar";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
}: AuthShellProps) {
  return (
    <>
      <PortalSidebar activeTab="home" userName="Welcome" />
      <main className="min-h-[100dvh] bg-brand-canvas pt-[72px] text-brand-ink">
      <div className="grid min-h-[100dvh] lg:grid-cols-[minmax(320px,0.86fr)_minmax(440px,1fr)]">
        <aside className="relative hidden overflow-hidden bg-brand-ink px-10 py-10 text-brand-ivory lg:flex lg:flex-col lg:justify-between xl:px-16">
          <div className="absolute -right-24 top-16 h-72 w-72 rounded-full border border-brand-gold-light/20" />
          <div className="absolute -bottom-28 -left-20 h-80 w-80 rounded-full border border-brand-gold-light/10" />

          <div className="relative">
            <Link aria-label="Trinity-AI home" href="/">
              <BrandLogo
                imageClassName="h-11 w-11 ring-1 ring-brand-gold-light/40"
                nameClassName="text-sm font-semibold tracking-[0.02em] text-brand-ivory"
                showName
              />
            </Link>
          </div>

          <div className="relative max-w-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-gold-light">
              Built for momentum
            </p>
            <h2 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-brand-ivory xl:text-5xl">
              Make the right introduction count.
            </h2>
            <p className="mt-5 max-w-xs text-sm leading-6 text-brand-gold-light/75">
              Find useful work, share trusted opportunities, and keep every step visible.
            </p>

            <div className="mt-10 border-t border-brand-gold-light/20 pt-5">
              <p className="text-sm font-medium text-brand-ivory">One place for the full journey.</p>
              <div className="mt-4 grid grid-cols-3 gap-3 text-xs text-brand-gold-light/75">
                <span>Referrals</span>
                <span>Projects</span>
                <span>Payouts</span>
              </div>
            </div>
          </div>

          <p className="relative text-xs text-brand-gold-light/55">Trinity-AI platform</p>
        </aside>

        <section className="flex min-h-[100dvh] items-center px-5 py-8 sm:px-8 lg:px-16 xl:px-24">
          <div className="mx-auto w-full max-w-[430px]">
            <div className="mb-8 lg:hidden">
              <Link aria-label="Trinity-AI home" href="/">
                <BrandLogo
                  imageClassName="h-10 w-10 ring-1 ring-brand-gold/30"
                  nameClassName="text-sm font-semibold text-brand-ink"
                  showName
                />
              </Link>
            </div>

            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-gold-strong">
                {eyebrow}
              </p>
              <h1 className="mt-3 text-4xl font-semibold leading-none tracking-[-0.045em] text-brand-ink sm:text-5xl">
                {title}
              </h1>
              <p className="mt-4 max-w-md text-sm leading-6 text-brand-muted">
                {description}
              </p>
            </div>

            <div className="rounded-[20px] border border-brand-sand bg-brand-ivory p-6 shadow-brand-card sm:p-8">
              {children}
            </div>
          </div>
        </section>
      </div>
      </main>
    </>
  );
}
