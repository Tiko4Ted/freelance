"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  BriefcaseBusiness,
  ClipboardCheck,
  FileCheck2,
  ArrowRightLeft,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  X,
} from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";

import { BrandLogo } from "@/components/brand-logo";

const items = [
  { label: "Operations", href: "/admin", icon: LayoutDashboard, id: "overview" },
  { label: "Projects", href: "/admin/jobs", icon: BriefcaseBusiness, id: "projects" },
  { label: "Applications", href: "/admin/applications", icon: ClipboardCheck, id: "applications" },
  { label: "Task submissions", href: "/admin/task-submissions", icon: FileCheck2, id: "task-submissions" },
  { label: "KYC approval", href: "/admin/kyc", icon: ShieldCheck, id: "kyc" },
  { label: "Fund transfers", href: "/admin/transfers", icon: ArrowRightLeft, id: "transfers" },
] as const;

function Navigation({ active, onNavigate }: { active: "overview" | "projects" | "applications" | "task-submissions" | "kyc" | "transfers"; onNavigate?: () => void }) {
  return (
    <nav aria-label="Admin operations navigation" className="flex flex-col gap-1">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = item.id === active;

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={`group inline-flex h-11 items-center gap-3 rounded-[10px] px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 ${
              isActive
                ? "bg-brand-ink font-semibold text-brand-ivory shadow-[0_6px_14px_rgba(32,38,30,0.15)]"
                : "font-medium text-brand-muted hover:bg-[var(--color-accent-soft)] hover:text-brand-ink"
            }`}
            href={item.href}
            key={item.href}
            onClick={onNavigate}
          >
            <Icon aria-hidden="true" className="h-4 w-4" strokeWidth={isActive ? 2.2 : 1.8} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminSidebar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const active = pathname.startsWith("/admin/jobs")
    ? "projects"
      : pathname.startsWith("/admin/applications")
        ? "applications"
        : pathname.startsWith("/admin/task-submissions")
          ? "task-submissions"
      : pathname.startsWith("/admin/kyc")
        ? "kyc"
        : pathname.startsWith("/admin/transfers")
          ? "transfers"
      : "overview";

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 border-b border-brand-sand/80 bg-brand-ivory/95 text-brand-ink shadow-[0_8px_28px_rgba(32,38,30,0.08)] backdrop-blur-md">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link aria-label="Trinity-AI operations" className="shrink-0" href="/admin">
            <BrandLogo
              imageClassName="h-9 w-9 ring-1 ring-brand-gold/30 sm:h-10 sm:w-10"
              nameClassName="hidden text-sm font-bold tracking-[0.02em] text-brand-ink sm:inline"
              showName
              size={40}
            />
          </Link>
          <span className="hidden rounded-full border border-brand-gold/30 bg-[#f2e8d7] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-gold-strong md:inline-flex">
            Operations
          </span>
          <div className="ml-auto flex items-center gap-2 border-l border-brand-sand pl-3 sm:gap-3 sm:pl-4">
            <span className="hidden text-sm font-semibold text-brand-ink sm:inline">Admin</span>
            <button
              aria-controls="admin-mobile-navigation"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Close navigation" : "Open navigation"}
              className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] text-brand-muted hover:bg-[var(--color-accent-soft)] hover:text-brand-ink focus-visible:ring-2 focus-visible:ring-brand-gold lg:hidden"
              onClick={() => setMenuOpen((open) => !open)}
              type="button"
            >
              {menuOpen ? <X aria-hidden="true" className="h-5 w-5" /> : <Menu aria-hidden="true" className="h-5 w-5" />}
            </button>
            <button
              aria-label="Log out"
              className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] text-brand-muted hover:bg-[var(--color-accent-soft)] hover:text-brand-ink focus-visible:ring-2 focus-visible:ring-brand-gold"
              onClick={() => signOut({ redirectTo: "/login" })}
              title="Log out"
              type="button"
            >
              <LogOut aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <aside className="fixed bottom-0 left-0 top-[72px] z-30 hidden w-64 border-r border-brand-sand/80 bg-brand-ivory/92 px-4 py-6 text-brand-ink shadow-[8px_0_28px_rgba(32,38,30,0.04)] backdrop-blur-md lg:block">
        <Navigation active={active} />
        <div className="mt-8 border-t border-brand-sand pt-5 text-xs leading-5 text-brand-muted">
          <p className="font-semibold text-brand-ink">Admin-only workspace</p>
          <p className="mt-1">Create, hold, publish, monitor, and close projects from here.</p>
        </div>
      </aside>

      {menuOpen ? (
        <>
          <button aria-label="Close navigation" className="fixed inset-x-0 bottom-0 top-[72px] z-40 bg-brand-ink/25 lg:hidden" onClick={() => setMenuOpen(false)} type="button" />
          <aside className="fixed bottom-0 left-0 top-[72px] z-50 w-[min(18rem,88vw)] border-r border-brand-sand bg-brand-ivory px-4 py-6 text-brand-ink shadow-[16px_0_36px_rgba(32,38,30,0.16)] lg:hidden" id="admin-mobile-navigation">
            <Navigation active={active} onNavigate={() => setMenuOpen(false)} />
          </aside>
        </>
      ) : null}
    </>
  );
}
