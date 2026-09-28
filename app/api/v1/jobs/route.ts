import { NextResponse } from "next/server";

import { JobService } from "@/lib/services/job-service";

export async function GET(request?: Request) {
  const searchParams = request
    ? new URL(request.url).searchParams
    : new URLSearchParams();

  if (searchParams.get("view") === "cards") {
    const parsedSkip = Number(searchParams.get("skip") ?? "0");
    const skip = Number.isFinite(parsedSkip)
      ? Math.max(0, Math.floor(parsedSkip))
      : 0;
    const page = await JobService.listActiveJobCards(skip);

    return NextResponse.json(page);
  }

  const jobs = await JobService.listActiveJobs();

  return NextResponse.json({ jobs });
}
