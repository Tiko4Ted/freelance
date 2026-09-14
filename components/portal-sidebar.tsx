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
  avatarColor = "#c2410c",
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
    <aside className="sticky top-0 z-40 flex h-screen w-[88px] flex-col items-center justify-between border-r border-slate-200/90 bg-white py-6 select-none shrink-0">
      {/* Top Logo */}
      <div className="flex flex-col items-center">
        <Link
          href="/home"
          aria-label="Go to Home"
          className="group flex items-center justify-center transition-transform hover:scale-105"
        >
          <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-9 w-9"
          >
            <defs>
              <linearGradient
                id="portalLogoGrad"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#0ea5e9" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>
            </defs>
            <path
              d="M 28 78 C 24 64, 30 38, 48 24 C 62 14, 78 18, 80 32 C 82 48, 62 58, 40 60 C 26 61, 16 70, 20 80 C 25 90, 42 86, 56 78 C 72 68, 84 52, 85 38"
              stroke="url(#portalLogoGrad)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
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
                  className={`group relative flex h-[62px] w-[62px] flex-col items-center justify-center rounded-2xl transition-all ${
                    isActive
                      ? "bg-[#eef2ff] text-[#2563eb]"
                      : "text-[#64748b] hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon
                    className={`h-[22px] w-[22px] transition-transform group-hover:scale-105 ${
                      isActive ? "text-[#2563eb]" : "text-[#64748b]"
                    }`}
                    strokeWidth={isActive ? 2.25 : 1.75}
                  />
                  <span
                    className={`mt-1 text-[11px] leading-tight ${
                      isActive
                        ? "font-semibold text-[#2563eb]"
                        : "font-medium text-[#64748b]"
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>

                {/* Blue notification dot on the right side of the item */}
                {item.hasDot ? (
                  <span
                    aria-hidden="true"
                    className="absolute -right-2 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-[#2563eb] ring-2 ring-white"
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
          className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm"
        >
          {initial}
        </div>
        <span className="mt-1.5 max-w-[76px] truncate text-center text-xs font-medium text-slate-700">
          {userName}
        </span>
      </div>
    </aside>
  );
}
