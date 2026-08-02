"use client";

export default function GlobalError() {
  return (
    <html lang="en">
      <body>
        <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-100">
          <div className="max-w-md space-y-3 text-center">
            <h1 className="text-2xl font-semibold">Something went wrong</h1>
            <p className="text-sm text-slate-300">
              The request could not be completed. Try refreshing the page.
            </p>
          </div>
        </main>
      </body>
    </html>
  );
}
