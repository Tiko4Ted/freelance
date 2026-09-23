"use client";

import { useState } from "react";
import {
  Gift,
  Copy,
  CheckCircle2,
  Users,
  DollarSign,
} from "lucide-react";

interface ReferralClientProps {
  userName?: string;
  referralCode?: string;
}

export function ReferralClient({
  userName = "Teddy",
  referralCode = "teddy123",
}: ReferralClientProps) {
  const [copied, setCopied] = useState(false);
  const referralLink = `https://joinhandshake.com/ref/${referralCode}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy!", err);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-brand-gold/40 bg-[radial-gradient(circle_at_88%_12%,rgba(235,204,144,0.2),transparent_34%),linear-gradient(135deg,#26291f,#35392c)] p-8 text-brand-ivory shadow-brand-card sm:p-12">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 text-brand-gold-light opacity-15">
          <Gift className="h-64 w-64" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-gold/50 bg-brand-gold/15 px-3 py-1 text-sm font-medium text-brand-gold-light backdrop-blur-sm">
            <Gift className="h-4 w-4" />
            Referral Program
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Refer and earn up to $300
          </h1>
          <p className="max-w-lg text-lg font-medium leading-relaxed text-brand-ivory/75">
            Invite your friends to join {userName}&apos;s network. When they sign up and complete their first project, you both earn cash rewards.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Share Link Card */}
        <div className="rounded-2xl border border-brand-sand bg-brand-ivory p-6 shadow-brand-card sm:p-8 md:col-span-2">
          <h2 className="mb-2 text-xl font-bold text-brand-ink">Share your link</h2>
          <p className="mb-6 text-sm text-brand-muted">
            Share this link via email, social media, or text message.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex flex-1 items-center overflow-hidden rounded-xl border border-brand-sand bg-brand-canvas/60 px-4 py-3">
              <span className="select-all truncate font-mono text-sm text-brand-muted">
                {referralLink}
              </span>
            </div>
            <button
              onClick={copyToClipboard}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all shadow-sm ${
                copied 
                  ? "bg-green-500 text-white border border-green-600 hover:bg-green-600" 
                  : "border border-brand-ink bg-brand-ink text-brand-ivory hover:bg-[#35392c] focus:outline-none focus:ring-2 focus:ring-brand-gold/40"
              }`}
            >
              {copied ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Link
                </>
              )}
            </button>
          </div>
        </div>

        {/* Stats Card */}
        <div className="flex flex-col justify-center rounded-2xl border border-brand-sand bg-brand-ivory p-6 shadow-brand-card">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#f2e8d7] text-brand-gold-strong">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-medium text-brand-muted">Total Referrals</div>
                <div className="text-2xl font-bold text-brand-ink">0</div>
              </div>
            </div>
            <div className="h-px w-full bg-brand-sand" />
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600 shrink-0">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-medium text-brand-muted">Total Earned</div>
                <div className="text-2xl font-bold text-brand-ink">$0.00</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="rounded-2xl border border-brand-sand bg-brand-ivory p-6 shadow-brand-card sm:p-8">
        <h2 className="mb-8 text-xl font-bold text-brand-ink">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="relative">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f2e8d7] text-lg font-bold text-brand-gold-strong">
              1
            </div>
            <h3 className="mb-2 text-base font-semibold text-brand-ink">Share your link</h3>
            <p className="text-sm leading-relaxed text-brand-muted">
              Copy your unique referral link and send it to friends who might be interested.
            </p>
          </div>
          
          <div className="relative">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-ink text-lg font-bold text-brand-gold-light">
              2
            </div>
            <h3 className="mb-2 text-base font-semibold text-brand-ink">They sign up & work</h3>
            <p className="text-sm leading-relaxed text-brand-muted">
              Your friend signs up using your link and successfully completes their first project or task.
            </p>
          </div>

          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-600 font-bold text-lg mb-4">
              3
            </div>
            <h3 className="mb-2 text-base font-semibold text-brand-ink">You both get paid</h3>
            <p className="text-sm leading-relaxed text-brand-muted">
              Once their first project is verified, the bonus cash will be instantly added to both of your wallets.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
