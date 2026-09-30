import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { safeCallbackUrl } from "@/lib/auth/callback-url";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams: Promise<{
    callbackUrl?: string;
    verified?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const callbackUrl = safeCallbackUrl(params.callbackUrl);
  const emailVerified = params.verified === "1";

  return (
    <AuthShell
      description="Access your referrals, projects, submitted work, and payout history."
      eyebrow="Welcome back"
      title="Sign in"
    >
      <LoginForm callbackUrl={callbackUrl} emailVerified={emailVerified} />
    </AuthShell>
  );
}
