import assert from "node:assert/strict";
import test from "node:test";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { ApplicationStatus } from "@prisma/client";

import { ApplicationActions } from "../components/admin/application-actions";
import { JobCreateForm } from "../components/admin/job-create-form";
import { HomeProjectToggle } from "../components/admin/home-project-toggle";
import { ApplicationSubmissionPage } from "../components/application-feedback";
import { HomeDashboardClient } from "../components/home-dashboard-client";
import { JobBoard } from "../components/jobs/job-board";
import { LoginForm } from "../components/auth/login-form";
import { PortalSidebar } from "../components/portal-sidebar";
import { ReferralClient } from "../components/referral-client";

test("authenticated portal sidebar renders a logout control", () => {
  const markup = renderToStaticMarkup(
    createElement(PortalSidebar, {
      activeTab: "home",
      isAuthenticated: true,
      userName: "Ada",
    }),
  );

  assert.match(markup, /aria-label="Log out"/);
  assert.match(markup, />Log out</);
  assert.match(markup, /aria-label="Portal navigation"/);
  assert.match(markup, /aria-current="page"/);
  assert.match(markup, /text-brand-gold-light/);
  assert.doesNotMatch(markup, /text-brand-gold-light\/70/);
  assert.doesNotMatch(markup, /Informational notification dot/);
});

test("login renders confirmation after email verification", () => {
  const markup = renderToStaticMarkup(
    createElement(LoginForm, {
      callbackUrl: "/home",
      emailVerified: true,
    }),
  );

  assert.match(markup, /Email verified\. Sign in to continue\./);
  assert.match(markup, /role="status"/);
});

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

test("referral page shows and copies the Trinity referral URL", () => {
  const referralLink =
    "https://freelance-nu-swart.vercel.app/referral/jobs?referralCode=TRINITY-123";
  const markup = renderToStaticMarkup(
    createElement(ReferralClient, {
      referralLink,
      userName: "Ada",
    }),
  );

  assert.match(markup, /freelance-nu-swart\.vercel\.app\/referral\/jobs/);
  assert.match(markup, /referralCode=TRINITY-123/);
  assert.doesNotMatch(markup, /joinhandshake/i);
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

test("empty dashboard does not render demo projects or task workspace", () => {
  const markup = renderToStaticMarkup(
    createElement(HomeDashboardClient, {
      userName: "Ada",
      paymentSummary: {
        formattedAwaitingPayment: "$0.00",
        formattedHoursWorked: "0",
      },
      projects: [],
    }),
  );

  assert.doesNotMatch(markup, /Project Artifacts/);
  assert.doesNotMatch(markup, /Project Rewrite/);
  assert.doesNotMatch(markup, /Project Aid/);
  assert.doesNotMatch(markup, /Ready to preview/);
  assert.doesNotMatch(markup, /Demo flow/);
  assert.doesNotMatch(markup, /Start task/);
  assert.doesNotMatch(markup, /Task details/);
  assert.doesNotMatch(markup, /Project details/);
});

test("admin job form exposes home placement and participant capacity", () => {
  const markup = renderToStaticMarkup(createElement(JobCreateForm));

  assert.match(markup, /name="showOnHome"/);
  assert.match(markup, /name="openings"/);
  assert.match(markup, /Show on home/);
});

test("admin can flag existing jobs and edit their remaining spots", () => {
  const markup = renderToStaticMarkup(
    createElement(HomeProjectToggle, {
      jobId: "job-1",
      openings: 3,
      showOnHome: false,
    }),
  );

  assert.match(markup, /Show on home/);
  assert.match(markup, /Remaining participant spots/);
  assert.match(markup, /Save spots/);
  assert.match(markup, /value="3"/);
});

test("dashboard renders flagged database projects as summary cards", () => {
  const markup = renderToStaticMarkup(
    createElement(HomeDashboardClient, {
      userName: "Ada",
      paymentSummary: {
        formattedAwaitingPayment: "$0.00",
        formattedHoursWorked: "0",
      },
      projects: [],
      featuredProjects: [
        {
          id: "job-featured",
          title: "AI Quality Review",
          description: "Review model output for accuracy and clarity.",
          companyName: "Trinity-AI",
          openings: 2,
          formattedPayout: "$300",
          formattedHourlyPay: null,
          skills: [{ id: "skill-review", label: "Review" }],
        },
      ],
    }),
  );

  assert.match(markup, /Featured projects/);
  assert.match(markup, /AI Quality Review/);
  assert.match(markup, /2 spots left/);
  assert.match(markup, /\/jobs\/job-featured/);
  assert.doesNotMatch(markup, /Start task/);
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
