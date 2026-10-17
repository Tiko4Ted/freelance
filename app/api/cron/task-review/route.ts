import { NextResponse } from "next/server";

import { TaskReviewService } from "@/lib/services/task-review-service";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await TaskReviewService.runOnce();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Task review cron failed", error);
    return NextResponse.json(
      { error: "Unable to process task reviews" },
      { status: 500 },
    );
  }
}
