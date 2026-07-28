import Link from "next/link";

import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="mx-auto grid min-h-screen max-w-5xl items-center gap-8 px-6 py-8 md:grid-cols-[1fr_24rem] md:px-8">
        <div>
          <Link className="text-sm font-medium text-teal-700" href="/">
            ReferralJobs
          </Link>
          <h1 className="mt-5 text-3xl font-semibold text-slate-950 md:text-5xl">
            Create account
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
            Create referral links for open roles and track candidate progress
            from application through payout.
          </p>
        </div>
        <div className="border border-slate-200 bg-white p-5">
          <RegisterForm />
        </div>
      </section>
    </main>
  );
}
