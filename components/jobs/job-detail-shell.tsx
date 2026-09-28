"use client";

import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useRef, useState } from "react";
import { ArrowLeft, X } from "lucide-react";

const OPEN_TRANSITION_MS = 1000;
const CLOSE_TRANSITION_MS = 220;

type JobDetailShellProps = {
  children: ReactNode;
  closeHref?: string;
  onCloseComplete?: () => void;
};

export function JobDetailShell({
  children,
  closeHref,
  onCloseComplete,
}: JobDetailShellProps) {
  const router = useRouter();
  const closeCompletedRef = useRef(false);
  const shellRef = useRef<HTMLElement | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [transitionMs, setTransitionMs] = useState(OPEN_TRANSITION_MS);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    shellRef.current?.scrollTo({ top: 0 });

    const frame = requestAnimationFrame(() => {
      shellRef.current?.scrollTo({ top: 0 });
      setIsOpen(true);
    });

    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousBodyOverflow;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  function handleClose() {
    closeCompletedRef.current = false;
    setTransitionMs(CLOSE_TRANSITION_MS);
    setIsOpen(false);
    timeoutRef.current = setTimeout(completeClose, CLOSE_TRANSITION_MS + 80);
  }

  function completeClose() {
    if (closeCompletedRef.current) {
      return;
    }

    closeCompletedRef.current = true;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (onCloseComplete) {
      onCloseComplete();
      return;
    }

    if (closeHref) {
      router.push(closeHref);
    }
  }

  return (
    <main
      className="fixed inset-0 z-50 overflow-y-auto bg-brand-canvas px-4 pb-12 pt-20 text-brand-ink sm:px-8"
      ref={shellRef}
      style={{
        transform: isOpen ? "translate3d(0, 0, 0)" : "translate3d(0, 100dvh, 0)",
        transition: `transform ${transitionMs}ms cubic-bezier(0.16, 1, 0.3, 1)`,
        willChange: "transform",
      }}
      onTransitionEnd={(event) => {
        if (event.propertyName === "transform" && !isOpen) {
          completeClose();
        }
      }}
    >
      <div className="fixed inset-x-0 top-0 z-10 border-b border-brand-sand/80 bg-brand-ivory/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1040px] items-center justify-between px-1">
          <button
            className="inline-flex items-center gap-2 rounded-[10px] px-2 py-2 text-sm font-semibold text-brand-muted transition hover:bg-[var(--color-accent-soft)] hover:text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-gold/40"
            onClick={handleClose}
            type="button"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Back to roles
          </button>
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-gold-strong">
            Trinity-AI roles
          </span>
        </div>
      </div>
      <button
        aria-label="Close job details"
        className="fixed right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full text-brand-muted transition hover:bg-[var(--color-accent-soft)] hover:text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-gold"
        onClick={handleClose}
        type="button"
      >
        <X aria-hidden="true" className="h-4 w-4" />
      </button>
      {children}
    </main>
  );
}
