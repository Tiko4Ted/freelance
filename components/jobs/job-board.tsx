"use client";

import { Eye, Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { JobDetailContent } from "@/components/jobs/job-detail-content";
import { JobDetailShell } from "@/components/jobs/job-detail-shell";
import type { PublicJobView } from "@/lib/services/job-service";

type JobBoardProps = {
  headerCopy: string;
  jobs: PublicJobView[];
  referralCode?: string;
};

function withReferral(href: string, referralCode?: string) {
  if (!referralCode) {
    return href;
  }

  return `${href}?referralCode=${encodeURIComponent(referralCode)}`;
}

function openingLabel(openings: number) {
  return `${openings} ${openings === 1 ? "opening" : "openings"}`;
}

function visibleSkills(job: PublicJobView) {
  return {
    visible: job.skills.slice(0, 3),
    hiddenCount: Math.max(0, job.skills.length - 3),
  };
}

function JobCard({
  job,
  onView,
  referralCode,
}: {
  job: PublicJobView;
  onView: (job: PublicJobView) => void;
  referralCode?: string;
}) {
  const skills = visibleSkills(job);

  return (
    <article className="relative flex min-h-[15.9rem] flex-col gap-1 rounded-md border border-brand-sand bg-[#f1ebdf] p-1 shadow-brand-card">
      <div className="flex flex-1 flex-col rounded bg-brand-ivory p-3.5">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="text-brand-muted">{job.postedAtLabel}</span>
          {job.isNew ? (
            <span className="rounded bg-[#f2e8d7] px-2 py-0.5 text-brand-gold-strong">
              New
            </span>
          ) : null}
          {job.isHighDemand ? (
            <span className="rounded bg-[#d7f7f0] px-2 py-0.5 text-[#047a66]">
              High demand
            </span>
          ) : null}
        </div>

        <h2 className="mt-3 text-[17px] font-medium leading-snug text-brand-ink">
          {job.title}
        </h2>
        <p className="mt-2 text-xs font-medium text-brand-muted">
          Trinity-AI <span className="px-2 text-brand-sand">|</span>
          {openingLabel(job.openings)}
        </p>

        <div className="mt-3">
          <p className="text-[11px] font-medium text-brand-muted">
            Required skills
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {skills.visible.map((skill) => (
              <span
                className="rounded border border-brand-sand bg-brand-ivory px-2.5 py-1 text-xs font-normal text-brand-muted"
                key={skill.id}
              >
                {skill.label}
              </span>
            ))}
            {skills.hiddenCount ? (
              <span className="group relative rounded border border-brand-sand bg-brand-ivory px-2.5 py-1 text-xs font-normal text-brand-muted">
                +{skills.hiddenCount}
                <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden min-w-40 -translate-x-1/2 rounded-md border border-brand-sand bg-brand-ivory px-3 py-2 text-left text-xs font-medium leading-5 text-brand-ink shadow-brand-card group-hover:block">
                  {job.skills.slice(3).map((skill) => skill.label).join(", ")}
                </span>
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-auto pt-3 text-sm">
          {job.formattedHourlyPay ? (
            <p className="text-brand-muted">
              Pay:{" "}
              <span className="font-semibold text-brand-ink">
                {job.formattedHourlyPay}
              </span>
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-[2.75rem_1fr] gap-1">
        <button
          aria-label={`View details for ${job.title}`}
          className="flex h-9 items-center justify-center rounded border border-brand-sand bg-brand-ivory text-brand-gold-strong transition hover:border-brand-gold hover:bg-[#f2e8d7] focus:outline-none focus:ring-2 focus:ring-brand-gold/30"
          onClick={() => onView(job)}
          title="View details"
          type="button"
        >
          <Eye aria-hidden="true" className="h-4 w-4" strokeWidth={2.25} />
          <span className="sr-only">View details</span>
        </button>
        <Link
          className="flex h-9 items-center justify-center rounded border border-brand-ink bg-brand-ink text-sm font-semibold text-brand-ivory transition hover:bg-[#35392c] focus:outline-none focus:ring-2 focus:ring-brand-gold/40"
          href={withReferral(`/jobs/${job.id}/apply`, referralCode)}
        >
          Apply now
        </Link>
      </div>
    </article>
  );
}

export function JobBoard({ headerCopy, jobs, referralCode }: JobBoardProps) {
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<PublicJobView | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredJobs = useMemo(() => {
    if (!normalizedQuery) {
      return jobs;
    }

    return jobs.filter((job) => {
      const searchable = [
        job.title,
        job.companyName,
        ...job.skills.map((skill) => skill.label),
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedQuery);
    });
  }, [jobs, normalizedQuery]);

  useEffect(() => {
    if (!searchOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !searchContainerRef.current?.contains(event.target)
      ) {
        setSearchOpen(false);
        setQuery("");
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [searchOpen]);

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,253,248,0.18)_0%,rgba(247,243,234,0.9)_76%,#f7f3ea_100%),radial-gradient(ellipse_at_47%_10%,rgba(182,138,85,0.3)_0%,rgba(182,138,85,0.12)_24%,transparent_46%),radial-gradient(ellipse_at_53%_14%,rgba(255,253,248,0.95)_0%,rgba(255,253,248,0.3)_18%,transparent_34%),linear-gradient(135deg,#f2e8d7_0%,#ded6c8_36%,#fffdf8_70%,#f7f3ea_100%)]" />
        <div className="relative mx-auto max-w-[1128px] px-4 py-[35px] lg:px-0">
          <div className="flex min-h-10 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
            <h1 className="max-w-[760px] text-[28px] font-semibold leading-[1.18] tracking-[-0.015em] text-brand-ink">
              {headerCopy}
            </h1>

            <div
              className="hidden min-h-10 shrink-0 justify-end lg:flex"
              ref={searchContainerRef}
            >
              {searchOpen ? (
                <label className="block w-[248px] max-w-[calc(100vw-2rem)]">
                  <span className="sr-only">Search by job title</span>
                  <span className="relative block">
                    <Search
                      aria-hidden="true"
                      className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-muted"
                      strokeWidth={2}
                    />
                    <input
                      className="h-10 w-full rounded-full border border-brand-sand bg-brand-ivory px-11 text-sm text-brand-ink outline-none placeholder:text-brand-muted focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20"
                      onChange={(event) => setQuery(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Escape") {
                          setSearchOpen(false);
                          setQuery("");
                        }
                      }}
                      placeholder="Search by job title..."
                      ref={searchInputRef}
                      type="search"
                      value={query}
                    />
                    {query ? (
                      <button
                        aria-label="Clear job search"
                        className="absolute right-3 top-1/2 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-brand-muted transition hover:bg-[#f2e8d7] hover:text-brand-ink"
                        onClick={() => {
                          setQuery("");
                          searchInputRef.current?.focus();
                        }}
                        type="button"
                      >
                        <X aria-hidden="true" className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </span>
                </label>
              ) : (
                <button
                  aria-label="Open job search"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-brand-sand bg-brand-ivory text-brand-muted shadow-brand-card transition hover:border-brand-gold hover:text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-gold/20"
                  onClick={() => {
                    setSearchOpen(true);
                    requestAnimationFrame(() => searchInputRef.current?.focus());
                  }}
                  type="button"
                >
                  <Search aria-hidden="true" className="h-5 w-5" strokeWidth={2} />
                </button>
              )}
            </div>

            <label className="block w-full max-w-[248px] self-end lg:hidden">
              <span className="sr-only">Search by job title</span>
              <span className="relative block">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-muted"
                  strokeWidth={2}
                />
                <input
                  className="h-10 w-full rounded-full border border-brand-sand bg-brand-ivory px-11 text-sm text-brand-ink outline-none placeholder:text-brand-muted focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by job title..."
                  type="search"
                  value={query}
                />
                {query ? (
                  <button
                    aria-label="Clear job search"
                    className="absolute right-3 top-1/2 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-brand-muted transition hover:bg-[#f2e8d7] hover:text-brand-ink"
                    onClick={() => setQuery("")}
                    type="button"
                  >
                    <X aria-hidden="true" className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </span>
            </label>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-[1128px] px-4 pb-14 lg:px-0">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredJobs.map((job) => (
            <JobCard
              job={job}
              key={job.id}
              onView={setSelectedJob}
              referralCode={referralCode}
            />
          ))}
        </div>

        {filteredJobs.length === 0 ? (
          <div className="mt-8 rounded-md border border-brand-sand bg-brand-ivory p-6 text-sm font-medium text-brand-muted shadow-brand-card">
            No roles match that search.
          </div>
        ) : null}
      </section>
      {selectedJob ? (
        <JobDetailShell onCloseComplete={() => setSelectedJob(null)}>
          <JobDetailContent job={selectedJob} />
        </JobDetailShell>
      ) : null}
    </>
  );
}
