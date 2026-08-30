import Link from "next/link";

import { LoginForm } from "@/components/auth/login-form";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams: Promise<{
    callbackUrl?: string;
  }>;
};

function safeCallbackUrl(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const callbackUrl = safeCallbackUrl(params.callbackUrl);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="mx-auto grid min-h-screen max-w-5xl items-center gap-8 px-6 py-8 md:grid-cols-[1fr_24rem] md:px-8">
        <div>
          <Link className="text-sm font-medium text-teal-700" href="/">
            ReferralJobs
          </Link>
          <h1 className="mt-5 text-3xl font-semibold text-slate-950 md:text-5xl">
            Sign in
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
            Access referral links, submitted candidates, wallet history, and
            payout setup.
          </p>
        </div>
        <div className="border border-slate-200 bg-white p-5">
          <LoginForm callbackUrl={callbackUrl} />
        </div>
      </section>
    </main>
  );
}
