import { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { requireRole } from "@/lib/auth/session";
import { HomeProjectPricingError } from "@/lib/home-project-pricing";
import {
  AdminJobService,
  type AdminTaskBriefUpload,
} from "@/lib/services/admin-job-service";
import { EmailNotificationService } from "@/lib/services/email-notification-service";
import { adminCreateJobSchema } from "@/lib/validation/admin";

const MAX_BRIEF_BYTES = 4 * 1024 * 1024;

function textValue(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
}

async function readCreateRequest(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return { body: await request.json(), taskBrief: undefined };
  }

  const form = await request.formData();
  const aptitudeTestValue = textValue(form, "aptitudeTest");
  let aptitudeTest: unknown;

  try {
    aptitudeTest = aptitudeTestValue ? JSON.parse(aptitudeTestValue) : undefined;
  } catch {
    throw new Error("INVALID_APTITUDE_TEST");
  }

  const file = form.get("taskBrief");
  let taskBrief: AdminTaskBriefUpload | undefined;
  if (file instanceof File && file.size > 0) {
    if (
      file.size > MAX_BRIEF_BYTES ||
      (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf"))
    ) {
      throw new Error("INVALID_PROJECT_BRIEF");
    }

    taskBrief = {
      fileName: file.name.slice(0, 255),
      mimeType: "application/pdf",
      content: Buffer.from(await file.arrayBuffer()),
    };
  }

  return {
    taskBrief,
    body: {
      title: textValue(form, "title"),
      description: textValue(form, "description"),
      payoutAmountCents: textValue(form, "payoutAmountCents"),
      payoutType: textValue(form, "payoutType"),
      currency: textValue(form, "currency"),
      companyName: textValue(form, "companyName"),
      openings: textValue(form, "openings"),
      hourlyMinCents: textValue(form, "hourlyMinCents") || null,
      hourlyMaxCents: textValue(form, "hourlyMaxCents") || null,
      isHighDemand: form.get("isHighDemand") === "on",
      showOnHome: form.get("showOnHome") === "on",
      isActive: true,
      isAiTask: true,
      skills: textValue(form, "skills")
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
      aptitudeTest,
    },
  };
}

export async function GET() {
  try {
    await requireRole(Role.ADMIN);
    const jobs = await AdminJobService.listJobs();

    return NextResponse.json({ jobs });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    await requireRole(Role.ADMIN);
    const { body, taskBrief } = await readCreateRequest(request);
    const input = adminCreateJobSchema.parse(body);
    if (request.headers.get("content-type")?.includes("multipart/form-data") && !taskBrief) {
      return NextResponse.json(
        { error: "Upload a PDF project brief before creating the draft" },
        { status: 400 },
      );
    }
    const job = await AdminJobService.createJob(input, taskBrief);
    if (job.showOnHome && job.isActive && job.openings > 0) {
      await EmailNotificationService.notifyUsersOfNewJob(job);
    }

    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid job input", issues: error.flatten() },
        { status: 400 },
      );
    }

    if (error instanceof HomeProjectPricingError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (
      error instanceof Error &&
      ["INVALID_APTITUDE_TEST", "INVALID_PROJECT_BRIEF"].includes(error.message)
    ) {
      return NextResponse.json(
        { error: "Upload a PDF brief and provide a valid aptitude test" },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Unable to create job" }, { status: 500 });
  }
}
