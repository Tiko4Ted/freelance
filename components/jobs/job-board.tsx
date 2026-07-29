"use client";

import { Eye, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import type { PublicJobView } from "@/lib/services/job-service";

type JobBoardProps = {
  jobs: PublicJobView[];
  referralCode?: string;
};

function withReferral(href: string, referralCode?: string) {
  if (!referralCode) {
    return href;
  }

  return `${href}?ref=${encodeURIComponent(referralCode)}`;
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
  referralCode,
}: {
  job: PublicJobView;
  referralCode?: string;
}) {
  const skills = visibleSkills(job);

  return (
    <article className="flex min-h-[21rem] flex-col overflow-hidden rounded-md border border-[#cfd7ff] bg-white shadow-[0_1px_0_rgba(91,104,180,0.08)]">
      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="text-[#65708a]">{job.postedAtLabel}</span>
          {job.isNew ? (
            <span className="rounded bg-[#f2ddff] px-2 py-0.5 text-[#8b3cc2]">
              New
            </span>
          ) : null}
          {job.isHighDemand ? (
            <span className="rounded bg-[#d7f7f0] px-2 py-0.5 text-[#047a66]">
              High demand
            </span>
          ) : null}
        </div>

        <h2 className="mt-4 text-lg font-semibold leading-snug text-[#202235]">
          {job.title}
        </h2>
        <p className="mt-2 text-xs font-medium text-[#667085]">
          {job.companyName} <span className="px-2 text-[#b3b8ca]">|</span>
          {openingLabel(job.openings)}
        </p>

        <div className="mt-4">
          <p className="text-xs font-semibold text-[#667085]">
            Required skills
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {skills.visible.map((skill) => (
              <span
                className="rounded border border-[#d9deef] bg-white px-2.5 py-1 text-xs font-medium text-[#4c5875]"
                key={skill.id}
              >
                {skill.label}
              </span>
            ))}
            {skills.hiddenCount ? (
              <span className="rounded border border-[#d9deef] bg-[#fbfcff] px-2.5 py-1 text-xs font-semibold text-[#6f78a8]">
                +{skills.hiddenCount}
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-auto pt-5 text-sm">
          {job.formattedHourlyPay ? (
            <p className="text-[#586279]">
              Job pay:{" "}
              <span className="font-semibold text-[#202235]">
                {job.formattedHourlyPay}
              </span>
            </p>
          ) : null}
          <p className="mt-1 text-[#586279]">
            Referral payout:{" "}
            <span className="font-semibold text-[#126d61]">
              {job.formattedPayout}
            </span>
          </p>
          <p className="mt-1 text-xs text-[#7a8298]">
            {job.payoutTriggerLabel}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-[3.25rem_1fr] border-t border-[#cfd7ff] bg-[#f5f7ff]">
        <Link
          aria-label={`View details for ${job.title}`}
          className="flex h-11 items-center justify-center border-r border-[#cfd7ff] text-[#6470ff] transition hover:bg-white"
          href={withReferral(`/jobs/${job.id}`, referralCode)}
          title="View details"
        >
          <Eye aria-hidden="true" className="h-4 w-4" strokeWidth={2.25} />
          <span className="sr-only">View details</span>
        </Link>
        <Link
          className="flex h-11 items-center justify-center text-sm font-semibold text-[#2d3150] transition hover:bg-white"
          href={withReferral(`/jobs/${job.id}/apply`, referralCode)}
        >
          Apply now
        </Link>
      </div>
    </article>
  );
}

export function JobBoard({ jobs, referralCode }: JobBoardProps) {
  const [query, setQuery] = useState("");
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

  return (
    <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-[#69728a]">
          {filteredJobs.length} of {jobs.length} roles shown
        </p>
        <label className="relative block w-full sm:max-w-xs">
          <span className="sr-only">Search by job title</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7c85a2]"
            strokeWidth={2}
          />
          <input
            className="h-11 w-full rounded-full border border-[#d3d9f7] bg-white px-11 text-sm text-[#202235] outline-none transition placeholder:text-[#949bb0] focus:border-[#727bff] focus:ring-4 focus:ring-[#dfe3ff]"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by job title..."
            type="search"
            value={query}
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredJobs.map((job) => (
          <JobCard job={job} key={job.id} referralCode={referralCode} />
        ))}
      </div>

      {filteredJobs.length === 0 ? (
        <div className="mt-8 rounded-md border border-[#cfd7ff] bg-white p-6 text-sm font-medium text-[#586279]">
          No roles match that search.
        </div>
      ) : null}
    </section>
  );
}
