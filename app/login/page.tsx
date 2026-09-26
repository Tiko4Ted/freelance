import Link from "next/link";

import { LoginForm } from "@/components/auth/login-form";
import { BrandLogo } from "@/components/brand-logo";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams: Promise<{
    callbackUrl?: string;
    verified?: string;
  }>;
};

function safeCallbackUrl(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/home";
  }

  return value;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const callbackUrl = safeCallbackUrl(params.callbackUrl);
  const emailVerified = params.verified === "1";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_18%_22%,rgba(235,204,144,0.28),transparent_30%),linear-gradient(135deg,#f7f3ea,#fffdf8)] text-brand-ink">
      <section className="mx-auto grid min-h-screen max-w-5xl items-center gap-8 px-6 py-8 md:grid-cols-[1fr_24rem] md:px-8">
        <div>
          <Link aria-label="Trinity-AI home" href="/">
            <BrandLogo
              imageClassName="h-11 w-11 shadow-sm"
              nameClassName="text-sm font-semibold text-brand-ink"
              showName
            />
          </Link>
          <p className="mt-8 text-sm font-semibold uppercase tracking-[0.16em] text-brand-gold-strong">
            Welcome back
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-brand-ink md:text-5xl">
            Sign in
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-brand-muted">
            Access referral links, submitted candidates, wallet history, and
            payout setup.
          </p>
        </div>
        <div className="rounded-2xl border border-brand-sand bg-brand-ivory p-6 shadow-brand-card">
          <LoginForm
            callbackUrl={callbackUrl}
            emailVerified={emailVerified}
          />
        </div>
      </section>
    </main>
  );
}
