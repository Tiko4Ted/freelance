import { NextResponse } from "next/server";

import { JobService } from "@/lib/services/job-service";

export async function GET() {
  const jobs = await JobService.listActiveJobs();

  return NextResponse.json({ jobs });
}
