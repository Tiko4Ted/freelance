"use client";

import { Eye } from "lucide-react";
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
  referralCode,
}: {
  job: PublicJobView;
  referralCode?: string;
}) {
  const skills = visibleSkills(job);

  return (
    <article className="flex min-h-[20rem] flex-col overflow-hidden rounded-md border border-[#d7dce8] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.06)]">
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
        <p className="mt-2 text-sm font-medium text-[#667085]">micro1</p>
        <p className="mt-3 text-sm font-semibold text-[#3a4254]">
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
              Pay:{" "}
              <span className="font-semibold text-[#202235]">
                {job.formattedHourlyPay}
              </span>
            </p>
          ) : null}
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
    <section className="mx-auto max-w-[1128px] px-4 pb-14 lg:px-0">
      <label className="sr-only">
        Search by job title
        <input
          onChange={(event) => setQuery(event.target.value)}
          type="search"
          value={query}
        />
      </label>

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
