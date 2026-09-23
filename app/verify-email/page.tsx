import type { Metadata } from "next";
import Link from "next/link";

import { VerifyEmailForm } from "@/components/auth/verify-email-form";
import { BrandLogo } from "@/components/brand-logo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Verify email | Trinity-AI",
  referrer: "no-referrer",
};

type VerifyEmailPageProps = {
  searchParams: Promise<{
    token?: string | string[];
  }>;
};

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : null;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_18%_22%,rgba(235,204,144,0.28),transparent_30%),linear-gradient(135deg,#f7f3ea,#fffdf8)] px-6 py-10 text-brand-ink">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md flex-col justify-center">
        <Link aria-label="Trinity-AI home" className="mx-auto" href="/">
          <BrandLogo
            imageClassName="h-12 w-12 shadow-sm"
            nameClassName="text-sm font-semibold text-brand-ink"
            showName
          />
        </Link>
        <div className="mt-8 rounded-2xl border border-brand-sand bg-brand-ivory p-7 shadow-brand-card">
          <p className="text-center text-sm font-semibold uppercase tracking-[0.16em] text-brand-gold-strong">
            Account security
          </p>
          <h1 className="mt-3 text-center text-3xl font-semibold text-brand-ink">
            Verify your email
          </h1>
          <div className="mt-6">
            <VerifyEmailForm token={token} />
          </div>
        </div>
      </section>
    </main>
  );
}
