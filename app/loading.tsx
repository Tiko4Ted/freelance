export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-canvas px-6 text-brand-ink">
      <div className="flex w-full max-w-sm flex-col items-center text-center">
        <div className="h-3 w-3 animate-pulse rounded-full bg-brand-gold-strong" />
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-brand-muted">
          Trinity-AI
        </p>
        <p className="mt-2 text-sm text-brand-muted">Loading your workspace…</p>
      </div>
    </main>
  );
}
