import assert from "node:assert/strict";
import test from "node:test";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { ApplicationStatus } from "@prisma/client";

import { ApplicationActions } from "../components/admin/application-actions";
import { ApplicationSubmissionPage } from "../components/application-feedback";
import { HomeDashboardClient } from "../components/home-dashboard-client";
import { JobBoard } from "../components/jobs/job-board";

test("public jobs UI renders a referral-preserving application link", () => {
  const markup = renderToStaticMarkup(
    createElement(JobBoard, {
      headerCopy: "Open roles",
      referralCode: "REF CODE",
      jobs: [
        {
          id: "job-1",
          title: "AI Reviewer",
          description: "Review AI responses.",
          payoutAmountCents: 30000,
          payoutType: "TASK_1",
          currency: "USD",
          companyName: "Trinity-AI",
          openings: 2,
          hourlyMinCents: null,
          hourlyMaxCents: null,
          formattedHourlyPay: null,
          formattedPayout: "$300",
          payoutTriggerLabel: "after 1 completed task",
          postedAt: "2026-09-22T00:00:00.000Z",
          postedAtLabel: "Posted Today",
          isNew: true,
          isHighDemand: true,
          skills: [{ id: "skill-1", label: "Research" }],
          createdAt: "2026-09-22T00:00:00.000Z",
          updatedAt: "2026-09-22T00:00:00.000Z",
        },
      ],
    }),
  );

  assert.match(markup, /AI Reviewer/);
  assert.match(markup, /Apply now/);
  assert.match(markup, /\/jobs\/job-1\/apply\?referralCode=REF%20CODE/);
});

test("application submission UI renders the successful completion state", () => {
  const markup = renderToStaticMarkup(
    createElement(ApplicationSubmissionPage, {
      status: "success",
      message: "Your application was approved.",
      onClose: () => undefined,
    }),
  );

  assert.match(markup, /Submission received/);
  assert.match(markup, /Your application was approved/);
  assert.match(markup, /Go to home/);
});

test("dashboard UI renders application and payment state", () => {
  const markup = renderToStaticMarkup(
    createElement(HomeDashboardClient, {
      userName: "Ada",
      paymentSummary: {
        formattedAwaitingPayment: "$25.00",
        formattedHoursWorked: "10",
      },
      projects: [
        {
          id: "application-1",
          applicationId: "application-1",
          jobHref: "/jobs/job-1",
          appliedAt: "2026-09-22T00:00:00.000Z",
          title: "AI Reviewer",
          description: "Review AI responses.",
          companyName: "Trinity-AI",
          status: "CERTIFIED",
          statusLabel: "Ready to start",
          payoutLabel: "$25.00",
          payoutType: "Per approved task",
          skills: ["Research"],
          canSubmit: true,
          isSubmitted: false,
          briefHref: "/api/v1/applications/application-1/task-material",
          taskBrief: [],
        },
      ],
    }),
  );

  assert.match(markup, /AI Reviewer/);
  assert.match(markup, /Ready to start/);
  assert.match(markup, /\$25\.00/);
});

test("admin application controls render status and progress actions", () => {
  const markup = renderToStaticMarkup(
    createElement(ApplicationActions, {
      applicationId: "application-1",
      currentStatus: ApplicationStatus.ACTIVE,
      hoursLogged: 4,
      tasksCompleted: 0,
    }),
  );

  assert.match(markup, /ACTIVE/);
  assert.match(markup, />Save</);
  assert.match(markup, />Log</);
  assert.match(markup, /name="hoursLogged"/);
  assert.match(markup, /name="tasksCompleted"/);
});
