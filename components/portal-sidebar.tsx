"use client";

import Link from "next/link";
import {
  Home,
  ShoppingBag,
  ClipboardList,
  UserPlus,
  LifeBuoy,
  User,
  Wallet,
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
}

export function PortalSidebar({
  activeTab,
  userName = "Teddy",
  avatarColor = "#765027",
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
    <aside className="sticky top-0 z-40 flex h-screen w-[88px] shrink-0 select-none flex-col items-center justify-between border-r border-brand-gold/25 bg-brand-ink py-6">
      {/* Top Logo */}
      <div className="flex flex-col items-center">
        <Link
          href="/home"
          aria-label="Trinity-AI home"
          className="group flex items-center justify-center rounded-xl outline-none transition focus-visible:shadow-brand-focus"
        >
          <BrandLogo
            imageClassName="h-11 w-11 ring-1 ring-brand-gold/35"
            size={44}
          />
        </Link>

        {/* Navigation Items */}
        <nav className="mt-8 flex flex-col items-center gap-3">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;

            return (
              <div key={item.id} className="relative flex items-center">
                <Link
                  href={item.href}
                  className={`group relative flex h-[62px] w-[62px] flex-col items-center justify-center rounded-2xl outline-none transition-all focus-visible:ring-2 focus-visible:ring-brand-gold-light focus-visible:ring-offset-2 focus-visible:ring-offset-brand-ink ${
                    isActive
                      ? "bg-brand-gold text-brand-ink shadow-[0_7px_18px_rgba(0,0,0,0.16)]"
                      : "text-brand-gold-light/70 hover:bg-white/5 hover:text-brand-gold-light"
                  }`}
                >
                  <Icon
                    className={`h-[22px] w-[22px] transition-transform group-hover:scale-105 ${
                      isActive ? "text-brand-ink" : "text-current"
                    }`}
                    strokeWidth={isActive ? 2.25 : 1.75}
                  />
                  <span
                    className={`mt-1 text-[11px] leading-tight ${
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
      <div className="flex flex-col items-center">
        <div
          style={{ backgroundColor: avatarColor }}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-gold-light/40 text-sm font-bold text-brand-ivory shadow-sm"
        >
          {initial}
        </div>
        <span className="mt-1.5 max-w-[76px] truncate text-center text-xs font-medium text-brand-gold-light/80">
          {userName}
        </span>
      </div>
    </aside>
  );
}
