"use client";

import { useState } from "react";

type CopyReferralLinkProps = {
  url: string;
};

export function CopyReferralLink({ url }: CopyReferralLinkProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      <button
        className="inline-flex h-10 items-center justify-center border border-slate-950 bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-teal-700"
        onClick={handleCopy}
        type="button"
      >
        {copied ? "Copied ✓" : "Copy link"}
      </button>
      <a
        className="inline-flex h-10 items-center justify-center border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-950 transition hover:border-teal-700 hover:text-teal-700"
        href={url}
        rel="noreferrer"
        target="_blank"
      >
        Open
      </a>
    </div>
  );
}
