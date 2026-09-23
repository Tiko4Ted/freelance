"use client";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body>
        <main className="flex min-h-screen items-center justify-center bg-brand-ink px-6 text-brand-ivory">
          <div className="max-w-md space-y-3 rounded-2xl border border-brand-gold/40 bg-brand-ivory/5 p-8 text-center shadow-brand-card">
            <h1 className="text-2xl font-semibold">Something went wrong</h1>
            <p className="text-sm text-brand-ivory/70">
              The request could not be completed. Try refreshing the page.
            </p>
            <button
              className="inline-flex h-10 items-center justify-center rounded-lg border border-brand-gold px-4 text-sm font-semibold text-brand-gold-light transition hover:bg-brand-gold hover:text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-gold-light/40"
              onClick={reset}
              type="button"
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
