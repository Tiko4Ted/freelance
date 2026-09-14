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
      <div className="rounded-3xl bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-500 p-8 sm:p-12 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 opacity-10">
          <Gift className="h-64 w-64" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-sm font-medium backdrop-blur-sm mb-6 border border-white/20">
            <Gift className="h-4 w-4" />
            Referral Program
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Refer and earn up to $300
          </h1>
          <p className="text-lg text-blue-50 font-medium max-w-lg leading-relaxed">
            Invite your friends to join {userName}&apos;s network. When they sign up and complete their first project, you both earn cash rewards.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Share Link Card */}
        <div className="md:col-span-2 rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Share your link</h2>
          <p className="text-slate-500 text-sm mb-6">
            Share this link via email, social media, or text message.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 overflow-hidden">
              <span className="text-slate-500 font-mono text-sm truncate select-all">
                {referralLink}
              </span>
            </div>
            <button
              onClick={copyToClipboard}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all shadow-sm ${
                copied 
                  ? "bg-green-500 text-white border border-green-600 hover:bg-green-600" 
                  : "bg-slate-900 text-white border border-slate-900 hover:bg-slate-800"
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
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm flex flex-col justify-center">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shrink-0">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-500">Total Referrals</div>
                <div className="text-2xl font-bold text-slate-900">0</div>
              </div>
            </div>
            <div className="h-px bg-slate-100 w-full" />
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600 shrink-0">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-500">Total Earned</div>
                <div className="text-2xl font-bold text-slate-900">$0.00</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-8">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 font-bold text-lg mb-4">
              1
            </div>
            <h3 className="font-semibold text-slate-900 text-base mb-2">Share your link</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Copy your unique referral link and send it to friends who might be interested.
            </p>
          </div>
          
          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 font-bold text-lg mb-4">
              2
            </div>
            <h3 className="font-semibold text-slate-900 text-base mb-2">They sign up & work</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Your friend signs up using your link and successfully completes their first project or task.
            </p>
          </div>

          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-600 font-bold text-lg mb-4">
              3
            </div>
            <h3 className="font-semibold text-slate-900 text-base mb-2">You both get paid</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Once their first project is verified, the bonus cash will be instantly added to both of your wallets.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
