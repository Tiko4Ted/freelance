import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export const dynamic = "force-dynamic";

type RegisterPageProps = {
  searchParams: Promise<{
    callbackUrl?: string;
    referralCode?: string;
  }>;
};

function safeCallbackUrl(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/home";
  }

  return value;
}

function getReferralCode(callbackUrl: string, directReferralCode?: string) {
  if (directReferralCode) {
    return directReferralCode;
  }

  try {
    return new URL(callbackUrl, "https://trinity-ai.invalid").searchParams.get(
      "referralCode",
    ) ?? undefined;
  } catch {
    return undefined;
  }
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;
  const callbackUrl = safeCallbackUrl(params.callbackUrl);
  const referralCode = getReferralCode(callbackUrl, params.referralCode);

  return (
    <AuthShell
      description="Create your account to share roles, track applications, and see what happens next."
      eyebrow="Join Trinity-AI"
      title="Create account"
    >
      <RegisterForm callbackUrl={callbackUrl} referralCode={referralCode} />
    </AuthShell>
  );
}
