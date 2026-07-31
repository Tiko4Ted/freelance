"use client";

import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useRef, useState } from "react";

const OPEN_TRANSITION_MS = 1000;
const CLOSE_TRANSITION_MS = 500;

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
    timeoutRef.current = setTimeout(completeClose, CLOSE_TRANSITION_MS + 100);
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
      className="fixed inset-0 z-50 overflow-y-auto bg-[#f7f6fb] px-5 py-14 text-[#242536] sm:px-8"
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
      <div className="fixed inset-x-0 top-0 z-10 h-10 rounded-t-xl bg-[#334856]/70 backdrop-blur-md" />
      <button
        aria-label="Close job details"
        className="fixed right-0 top-0 z-20 flex h-10 w-10 items-center justify-center text-3xl font-light leading-none text-white"
        onClick={handleClose}
        type="button"
      >
        &times;
      </button>
      {children}
    </main>
  );
}
