"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useState } from "react";
import {
  ClipboardList,
  Home,
  LifeBuoy,
  LogOut,
  Menu,
  ShoppingBag,
  X,
  User,
  UserPlus,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { BrandLogo } from "@/components/brand-logo";

export type PortalTab =
  | "home"
  | "apply"
  | "onboarding"
  | "referrals"
  | "help"
  | "payments"
  | "profile";

interface PortalSidebarProps {
  activeTab: PortalTab;
  userName?: string;
  avatarColor?: string;
  isAuthenticated?: boolean;
}

type PortalNavItem = {
  id: PortalTab;
  label: string;
  href: string;
  icon: LucideIcon;
};

type PortalNavProps = {
  activeTab: PortalTab;
  onNavigate?: () => void;
};

const NAV_ITEMS: PortalNavItem[] = [
  { id: "home", label: "Home", href: "/home", icon: Home },
  { id: "apply", label: "Projects", href: "/apply", icon: ShoppingBag },
  {
    id: "onboarding",
    label: "Onboarding",
    href: "/onboarding",
    icon: ClipboardList,
  },
  {
    id: "referrals",
    label: "Referrals",
    href: "/referral",
    icon: UserPlus,
  },
  { id: "payments", label: "Payments", href: "/wallet", icon: Wallet },
  { id: "help", label: "Help", href: "/help-center", icon: LifeBuoy },
  { id: "profile", label: "Profile", href: "/profile", icon: User },
];

function PortalNav({ activeTab, onNavigate }: PortalNavProps) {
  return (
    <nav aria-label="Portal navigation" className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const isActive = activeTab === item.id;
        const Icon = item.icon;

        return (
          <Link
            key={item.id}
            aria-current={isActive ? "page" : undefined}
            href={item.href}
            onClick={onNavigate}
            className={`group inline-flex h-11 items-center gap-3 rounded-[10px] px-3 text-sm outline-none transition-[background-color,color,transform,box-shadow] duration-200 active:scale-[0.98] motion-reduce:transform-none ${
              isActive
                ? "bg-brand-ink font-semibold text-brand-ivory shadow-[0_6px_14px_rgba(32,38,30,0.15)]"
                : "font-medium text-brand-muted hover:bg-[var(--color-accent-soft)] hover:text-brand-ink focus-visible:bg-[var(--color-accent-soft)] focus-visible:text-brand-ink"
            } focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2`}
          >
            <Icon
              aria-hidden="true"
              className="h-4 w-4 shrink-0"
              strokeWidth={isActive ? 2.2 : 1.8}
            />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function PortalSidebar({
  activeTab,
  userName = "Teddy",
  avatarColor = "#765027",
  isAuthenticated = false,
}: PortalSidebarProps) {
  const initial = (userName.trim()[0] || "T").toUpperCase();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 border-b border-brand-sand/80 bg-brand-ivory/95 text-brand-ink shadow-[0_8px_28px_rgba(32,38,30,0.08)] backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-[1440px] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/home"
          aria-label="Trinity-AI home"
          className="group shrink-0 rounded-[10px] outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
        >
          <BrandLogo
            imageClassName="h-9 w-9 ring-1 ring-brand-gold/30 transition-transform duration-200 group-hover:scale-[1.03] motion-reduce:transform-none sm:h-10 sm:w-10"
            nameClassName="hidden text-sm font-bold tracking-[0.02em] text-brand-ink sm:inline"
            showName
            size={40}
          />
        </Link>

        <div className="ml-auto flex shrink-0 items-center gap-2 border-l border-brand-sand pl-3 sm:gap-3 sm:pl-4">
          <div
            style={{ backgroundColor: avatarColor }}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-gold-light text-sm font-bold text-brand-ivory shadow-[0_4px_12px_rgba(18,20,15,0.16)]"
            title={userName}
          >
            {initial}
          </div>
          <span className="hidden max-w-28 truncate text-sm font-semibold text-brand-ink lg:inline">
            {userName}
          </span>
          <button
            aria-controls="portal-mobile-navigation"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] text-brand-muted outline-none transition-[background-color,color,transform] hover:bg-[var(--color-accent-soft)] hover:text-brand-ink active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 motion-reduce:transform-none lg:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            type="button"
          >
            {menuOpen ? (
              <X aria-hidden="true" className="h-5 w-5" strokeWidth={1.9} />
            ) : (
              <Menu aria-hidden="true" className="h-5 w-5" strokeWidth={1.9} />
            )}
          </button>
          {isAuthenticated ? (
            <button
              aria-label="Log out"
              className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] text-brand-muted outline-none transition-[background-color,color,transform] hover:bg-[var(--color-accent-soft)] hover:text-brand-ink active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 motion-reduce:transform-none"
              onClick={() => signOut({ redirectTo: "/login" })}
              title="Log out"
              type="button"
            >
              <LogOut aria-hidden="true" className="h-4 w-4" strokeWidth={1.9} />
              <span className="sr-only">Log out</span>
            </button>
          ) : (
            <Link
              className="hidden h-9 items-center rounded-[10px] bg-brand-ink px-3 text-sm font-semibold text-brand-ivory transition hover:bg-[#35392c] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 sm:inline-flex"
              href="/login"
            >
              Log in
            </Link>
          )}
        </div>
      </div>
      </header>

      <aside className="fixed bottom-0 left-0 top-[72px] z-30 hidden w-64 border-r border-brand-sand/80 bg-brand-ivory/92 px-4 py-6 text-brand-ink shadow-[8px_0_28px_rgba(32,38,30,0.04)] backdrop-blur-md lg:block">
        <div className="px-2 pb-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-gold-strong">
            Workspace
          </p>
          <p className="mt-1 text-xs leading-5 text-brand-muted">
            Move through your Trinity-AI account.
          </p>
        </div>
        <PortalNav activeTab={activeTab} />
      </aside>

      {menuOpen ? (
        <>
          <button
            aria-label="Close navigation"
            className="fixed inset-x-0 bottom-0 top-[72px] z-40 bg-brand-ink/25 lg:hidden"
            onClick={() => setMenuOpen(false)}
            type="button"
          />
          <aside
            className="fixed bottom-0 left-0 top-[72px] z-50 w-[min(18rem,88vw)] border-r border-brand-sand bg-brand-ivory px-4 py-6 text-brand-ink shadow-[16px_0_36px_rgba(32,38,30,0.16)] lg:hidden"
            id="portal-mobile-navigation"
          >
            <div className="px-2 pb-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-gold-strong">
                Workspace
              </p>
              <p className="mt-1 text-xs leading-5 text-brand-muted">
                Move through your Trinity-AI account.
              </p>
            </div>
            <PortalNav
              activeTab={activeTab}
              onNavigate={() => setMenuOpen(false)}
            />
          </aside>
        </>
      ) : null}
    </>
  );
}
