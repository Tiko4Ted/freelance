"use client";

import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useRef, useState } from "react";

const TRANSITION_MS = 1000;

type JobDetailShellProps = {
  children: ReactNode;
  closeHref: string;
};

export function JobDetailShell({ children, closeHref }: JobDetailShellProps) {
  const router = useRouter();
  const shellRef = useRef<HTMLElement | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isOpen, setIsOpen] = useState(false);

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
    setIsOpen(false);
    timeoutRef.current = setTimeout(() => {
      router.push(closeHref);
    }, TRANSITION_MS);
  }

  return (
    <main
      className="fixed inset-0 z-50 overflow-y-auto bg-[#f7f6fb] px-5 py-14 text-[#242536] sm:px-8"
      ref={shellRef}
      style={{
        transform: isOpen ? "translate3d(0, 0, 0)" : "translate3d(0, 100dvh, 0)",
        transition: `transform ${TRANSITION_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`,
        willChange: "transform",
      }}
    >
      <div className="fixed inset-x-0 top-0 z-10 h-10 bg-[#334856]/70 backdrop-blur-md" />
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
