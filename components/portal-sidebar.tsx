"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  Home,
  ShoppingBag,
  ClipboardList,
  UserPlus,
  LifeBuoy,
  User,
  Wallet,
  LogOut,
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

const NAV_ITEMS: PortalNavItem[] = [
  { id: "home", label: "Home", href: "/home", icon: Home },
  { id: "apply", label: "Apply", href: "/apply", icon: ShoppingBag },
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

export function PortalSidebar({
  activeTab,
  userName = "Teddy",
  avatarColor = "#765027",
  isAuthenticated = false,
}: PortalSidebarProps) {
  const initial = (userName.trim()[0] || "T").toUpperCase();

  return (
    <aside className="sticky top-0 z-40 flex h-dvh w-[88px] shrink-0 select-none flex-col overflow-hidden border-r border-[#4b452f] bg-brand-ink text-brand-gold-light shadow-[8px_0_28px_rgba(38,41,31,0.12)] sm:w-[104px]">
      <div className="flex min-h-0 w-full flex-1 flex-col">
        <Link
          href="/home"
          aria-label="Trinity-AI home"
          className="group flex shrink-0 items-center justify-center border-b border-[#4b452f] px-2 py-3 outline-none transition-colors hover:bg-[#303429] focus-visible:bg-[#303429] focus-visible:shadow-brand-focus"
        >
          <BrandLogo
            imageClassName="h-10 w-10 ring-1 ring-[#d2aa6e] transition-transform duration-200 group-hover:scale-[1.03] motion-reduce:transform-none sm:h-11 sm:w-11"
            size={40}
          />
        </Link>

        <nav
          aria-label="Portal navigation"
          className="flex min-h-0 w-full flex-1 flex-col gap-1 overflow-y-auto overscroll-contain px-2 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;

            return (
              <Link
                key={item.id}
                aria-current={isActive ? "page" : undefined}
                href={item.href}
                className={`group relative flex min-h-[58px] w-full shrink-0 flex-col items-center justify-center rounded-[14px] px-1 py-2 outline-none transition-[background-color,color,transform,box-shadow] duration-200 active:scale-[0.98] motion-reduce:transform-none ${
                  isActive
                    ? "bg-brand-gold-light text-brand-ink shadow-[0_8px_18px_rgba(18,20,15,0.2)]"
                    : "text-brand-gold-light hover:bg-[#35382c] hover:text-brand-ivory focus-visible:bg-[#35382c] focus-visible:text-brand-ivory"
                } focus-visible:ring-2 focus-visible:ring-brand-gold-light focus-visible:ring-offset-2 focus-visible:ring-offset-brand-ink`}
              >
                {isActive ? (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-gold-strong"
                  />
                ) : null}
                <Icon
                  aria-hidden="true"
                  className="h-5 w-5 transition-transform duration-200 group-hover:-translate-y-0.5 motion-reduce:transform-none"
                  strokeWidth={isActive ? 2.25 : 1.8}
                />
                <span
                  className={`mt-1 text-[11px] leading-none sm:text-xs ${
                    isActive ? "font-semibold" : "font-medium"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex shrink-0 flex-col items-center gap-2 border-t border-[#4b452f] px-2 py-3">
        <div className="flex w-full flex-col items-center gap-1.5">
          <div
            style={{ backgroundColor: avatarColor }}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#ebcc90] text-sm font-bold text-brand-ivory shadow-[0_4px_12px_rgba(18,20,15,0.24)]"
          >
            {initial}
          </div>
          <span className="max-w-[72px] truncate text-center text-[11px] font-semibold leading-tight text-brand-gold-light sm:max-w-[88px] sm:text-xs">
            {userName}
          </span>
        </div>
        {isAuthenticated ? (
          <button
            aria-label="Log out"
            className="group flex min-h-12 w-full flex-col items-center justify-center rounded-[14px] px-1 py-2 text-brand-gold-light outline-none transition-[background-color,color,transform] duration-200 hover:bg-[#35382c] hover:text-brand-ivory active:scale-[0.98] focus-visible:bg-[#35382c] focus-visible:text-brand-ivory focus-visible:ring-2 focus-visible:ring-brand-gold-light focus-visible:ring-offset-2 focus-visible:ring-offset-brand-ink motion-reduce:transform-none"
            onClick={() => signOut({ redirectTo: "/login" })}
            title="Log out"
            type="button"
          >
            <LogOut
              aria-hidden="true"
              className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transform-none"
              strokeWidth={1.8}
            />
            <span className="mt-1 text-[11px] font-medium leading-none sm:text-xs">
              Log out
            </span>
          </button>
        ) : null}
      </div>
    </aside>
  );
}
