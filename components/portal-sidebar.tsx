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

export function PortalSidebar({
  activeTab,
  userName = "Teddy",
  avatarColor = "#765027",
  isAuthenticated = false,
}: PortalSidebarProps) {
  const initial = (userName.trim()[0] || "T").toUpperCase();

  const navItems = [
    {
      id: "home" as const,
      label: "Home",
      href: "/home",
      icon: Home,
      hasDot: false,
    },
    {
      id: "apply" as const,
      label: "Apply",
      href: "/apply",
      icon: ShoppingBag,
      hasDot: false,
    },
    {
      id: "onboarding" as const,
      label: "Onboarding",
      href: "/onboarding",
      icon: ClipboardList,
      hasDot: true,
    },
    {
      id: "referrals" as const,
      label: "Referrals",
      href: "/referral",
      icon: UserPlus,
      hasDot: false,
    },
    {
      id: "payments" as const,
      label: "Payments",
      href: "/wallet",
      icon: Wallet,
      hasDot: false,
    },
    {
      id: "help" as const,
      label: "Help",
      href: "/help-center",
      icon: LifeBuoy,
      hasDot: true,
    },
    {
      id: "profile" as const,
      label: "Profile",
      href: "/profile",
      icon: User,
      hasDot: false,
    },
  ];

  return (
    <aside className="sticky top-0 z-40 flex h-dvh w-[88px] shrink-0 select-none flex-col items-center overflow-hidden border-r border-brand-gold/25 bg-brand-ink py-0">
      {/* Top Logo */}
      <div className="flex min-h-0 w-full flex-1 flex-col items-center">
        <Link
          href="/home"
          aria-label="Trinity-AI home"
          className="group my-0 flex shrink-0 items-center justify-center rounded-xl py-0 outline-none transition focus-visible:shadow-brand-focus"
        >
          <BrandLogo
            className="m-0 p-0"
            imageClassName="m-0 h-11 w-11 p-0 ring-1 ring-brand-gold/35"
            size={44}
          />
        </Link>

        {/* Navigation Items */}
        <nav className="my-0 flex min-h-0 w-full flex-1 flex-col items-center gap-0 overflow-y-auto overscroll-contain py-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;

            return (
              <div
                key={item.id}
                className="relative my-0 flex shrink-0 items-center"
              >
                <Link
                  href={item.href}
                  className={`group relative my-0 flex w-[58px] flex-col items-center justify-center rounded-xl py-2 outline-none transition-all focus-visible:ring-2 focus-visible:ring-brand-gold-light focus-visible:ring-offset-2 focus-visible:ring-offset-brand-ink ${
                    isActive
                      ? "bg-brand-gold text-brand-ink shadow-[0_7px_18px_rgba(0,0,0,0.16)]"
                      : "text-brand-gold-light/70 hover:bg-white/5 hover:text-brand-gold-light"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 transition-transform group-hover:scale-105 ${
                      isActive ? "text-brand-ink" : "text-current"
                    }`}
                    strokeWidth={isActive ? 2.25 : 1.75}
                  />
                  <span
                    className={`mt-0.5 text-[11px] leading-tight ${
                      isActive
                        ? "font-semibold text-brand-ink"
                        : "font-medium text-current"
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>

                {/* Informational notification dot */}
                {item.hasDot ? (
                  <span
                    aria-hidden="true"
                    className="absolute -right-2 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-brand-gold-light ring-2 ring-brand-ink"
                  />
                ) : null}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Bottom User Profile */}
      <div className="mt-3 flex shrink-0 flex-col items-center gap-2">
        <div
          style={{ backgroundColor: avatarColor }}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-gold-light/40 text-sm font-bold text-brand-ivory shadow-sm"
        >
          {initial}
        </div>
        <span className="max-w-[76px] truncate text-center text-xs font-medium text-brand-gold-light/80">
          {userName}
        </span>
        {isAuthenticated ? (
          <div className="border-t border-brand-gold/20 pt-2">
            <button
              aria-label="Log out"
              className="group flex h-12 w-[58px] flex-col items-center justify-center rounded-xl text-brand-gold-light/70 outline-none transition-colors hover:bg-white/5 hover:text-brand-gold-light focus-visible:ring-2 focus-visible:ring-brand-gold-light focus-visible:ring-offset-2 focus-visible:ring-offset-brand-ink"
              onClick={() => signOut({ redirectTo: "/login" })}
              title="Log out"
              type="button"
            >
              <LogOut
                aria-hidden="true"
                className="h-5 w-5 transition-transform group-hover:translate-x-0.5"
                strokeWidth={1.75}
              />
              <span className="mt-1 text-[11px] font-medium leading-tight">
                Log out
              </span>
            </button>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
