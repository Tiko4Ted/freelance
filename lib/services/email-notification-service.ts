import { ApplicationStatus, Role } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

type EmailRecipient = {
  email: string;
  name?: string | null;
};

type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

type EmailSendResult =
  | { status: "sent"; id: string | null }
  | { status: "skipped" };

type NotificationJob = {
  id: string;
  title: string;
  description: string;
  companyName: string;
  payoutAmountCents: number;
  currency: string;
  skills?: { label: string }[];
};

type NotificationApplication = {
  id: string;
  candidateEmail: string;
  candidateName: string;
  status: ApplicationStatus;
  job: {
    id: string;
    title: string;
    companyName: string;
  };
};

const DEFAULT_FROM = "Trinity-AI <onboarding@resend.dev>";
const DEFAULT_APP_URL = "https://freelance-nu-swart.vercel.app";

const statusLabels: Record<ApplicationStatus, string> = {
  APPLIED: "Application received",
  CERTIFYING: "Submission under review",
  CERTIFIED: "Certified",
  MATCHED: "Matched",
  ACTIVE: "Active",
  PAYOUT_ELIGIBLE: "Payment eligible",
  PAID: "Paid",
  EXPIRED: "Expired",
  REJECTED: "Not selected",
};

const statusMessages: Record<ApplicationStatus, string> = {
  APPLIED:
    "Your application is in review. We will email you again when there is an update.",
  CERTIFYING:
    "Your submitted task is being reviewed. We will update you once the review is complete.",
  CERTIFIED:
    "You cleared the application review and can continue from your home dashboard.",
  MATCHED:
    "You have been matched to the project. Open your dashboard to review the next step.",
  ACTIVE:
    "Your project is active. You can open your dashboard, review the brief, and start working.",
  PAYOUT_ELIGIBLE:
    "Your work is eligible for payment. Check your wallet for payout details.",
  PAID: "Your payment has been marked as paid.",
  EXPIRED:
    "This application has expired. You can still browse other available projects.",
  REJECTED:
    "This application was not selected. You can continue applying to other projects.",
};

function appUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_URL ??
    process.env.AUTH_URL ??
    DEFAULT_APP_URL
  ).replace(/\/$/, "");
}

function emailFrom() {
  return process.env.EMAIL_FROM ?? DEFAULT_FROM;
}

function formatCurrency(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    currency,
    style: "currency",
  }).format(cents / 100);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buttonHtml(href: string, label: string) {
  return `<a href="${escapeHtml(
    href,
  )}" style="display:inline-block;border-radius:10px;background:#22251d;color:#fffdf8;font-weight:700;text-decoration:none;padding:12px 18px">${escapeHtml(
    label,
  )}</a>`;
}

function layoutHtml({
  body,
  heading,
  preview,
}: {
  body: string;
  heading: string;
  preview: string;
}) {
  return `<!doctype html>
<html>
  <body style="margin:0;background:#f7f3ea;color:#22251d;font-family:Arial,sans-serif">
    <span style="display:none!important;opacity:0;color:transparent;height:0;width:0;overflow:hidden">${escapeHtml(
      preview,
    )}</span>
    <div style="max-width:620px;margin:0 auto;padding:32px 20px">
      <div style="border:1px solid #dfcfad;border-radius:16px;background:#fffdf8;padding:28px">
        <p style="margin:0 0 18px;font-size:13px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#b18430">Trinity-AI</p>
        <h1 style="margin:0 0 16px;font-size:24px;line-height:1.25;color:#22251d">${escapeHtml(
          heading,
        )}</h1>
        ${body}
        <p style="margin:28px 0 0;font-size:12px;line-height:1.6;color:#6f7168">You are receiving this because you have a Trinity-AI account or application.</p>
      </div>
    </div>
  </body>
</html>`;
}

export function buildEmailDeliveryTestEmail(to: string): EmailMessage {
  return {
    to,
    subject: "Trinity-AI email delivery test",
    text: [
      "Trinity-AI email delivery test",
      "",
      "This message was sent by a Trinity-AI administrator to verify production email delivery.",
      "If you received it, the Resend integration is accepting and delivering email.",
    ].join("\n"),
    html: layoutHtml({
      heading: "Email delivery is working",
      preview: "Trinity-AI production email delivery test.",
      body: `
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#334155">This message was sent by a Trinity-AI administrator to verify production email delivery.</p>
        <p style="margin:0;font-size:15px;line-height:1.7;color:#334155">If you received it, the Resend integration is accepting and delivering email.</p>
      `,
    }),
  };
}

export function buildWelcomeVerificationEmail(input: {
  name: string;
  to: string;
  verificationUrl: string;
}): EmailMessage {
  const greeting = input.name.trim() ? `Hi ${input.name.trim()},` : "Hi,";

  return {
    to: input.to,
    subject: "Welcome to Trinity-AI — verify your email",
    text: [
      greeting,
      "",
      "Welcome to Trinity-AI. Your account has been created.",
      "Verify your email address using the secure link below. The link expires in 24 hours.",
      "",
      input.verificationUrl,
      "",
      "If you did not create this account, you can ignore this email.",
    ].join("\n"),
    html: layoutHtml({
      heading: "Welcome to Trinity-AI",
      preview: "Verify your email address to finish setting up your account.",
      body: `
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#334155">${escapeHtml(greeting)}</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#334155">Your account has been created. Verify your email address to confirm that it belongs to you.</p>
        <p style="margin:0 0 22px">${buttonHtml(input.verificationUrl, "Verify email")}</p>
        <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#64748b">This secure link expires in 24 hours.</p>
        <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b">If you did not create this account, you can ignore this email.</p>
      `,
    }),
  };
}

export function buildNewJobEmail(job: NotificationJob, recipient: EmailRecipient) {
  const applyUrl = `${appUrl()}/jobs/${job.id}/apply`;
  const skills = job.skills?.map((skill) => skill.label).filter(Boolean) ?? [];
  const skillText = skills.length ? skills.slice(0, 5).join(", ") : "Project review";
  const subject = `New Trinity-AI project: ${job.title}`;
  const greeting = recipient.name ? `Hi ${recipient.name},` : "Hi,";
  const text = [
    greeting,
    "",
    `A new Trinity-AI project is available: ${job.title}.`,
    `Company: ${job.companyName}`,
    `Expected pay: ${formatCurrency(job.payoutAmountCents, job.currency)}`,
    `Skills: ${skillText}`,
    "",
    `Apply here: ${applyUrl}`,
  ].join("\n");

  return {
    html: layoutHtml({
      heading: "A new project is available",
      preview: `${job.title} is now open on Trinity-AI.`,
      body: `
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#334155">${escapeHtml(
          greeting,
        )}</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#334155">A new project just opened on Trinity-AI.</p>
        <div style="margin:18px 0;border:1px solid #e2e8f0;border-radius:12px;padding:16px;background:#f8fafc">
          <p style="margin:0 0 6px;font-size:17px;font-weight:800;color:#0f172a">${escapeHtml(
            job.title,
          )}</p>
          <p style="margin:0 0 10px;font-size:14px;line-height:1.6;color:#475569">${escapeHtml(
            job.description,
          )}</p>
          <p style="margin:0;font-size:13px;line-height:1.7;color:#475569"><strong>Company:</strong> ${escapeHtml(
            job.companyName,
          )}</p>
          <p style="margin:0;font-size:13px;line-height:1.7;color:#475569"><strong>Expected pay:</strong> ${escapeHtml(
            formatCurrency(job.payoutAmountCents, job.currency),
          )}</p>
          <p style="margin:0;font-size:13px;line-height:1.7;color:#475569"><strong>Skills:</strong> ${escapeHtml(
            skillText,
          )}</p>
        </div>
        <p style="margin:22px 0 0">${buttonHtml(applyUrl, "Apply to project")}</p>
      `,
    }),
    subject,
    text,
    to: recipient.email,
  };
}

export function buildApplicationSubmittedEmail(
  application: NotificationApplication,
) {
  const dashboardUrl = `${appUrl()}/home`;
  const subject = `Application received: ${application.job.title}`;
  const text = [
    `Hi ${application.candidateName},`,
    "",
    `Your application for ${application.job.title} has been received.`,
    `Current status: ${statusLabels[application.status]}`,
    "",
    statusMessages[application.status],
    "",
    `Track it here: ${dashboardUrl}`,
  ].join("\n");

  return {
    html: layoutHtml({
      heading: "Your application was received",
      preview: `Your ${application.job.title} application is now ${statusLabels[
        application.status
      ].toLowerCase()}.`,
      body: `
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#334155">Hi ${escapeHtml(
          application.candidateName,
        )},</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#334155">Your application for <strong>${escapeHtml(
          application.job.title,
        )}</strong> has been received.</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#334155"><strong>Current status:</strong> ${escapeHtml(
          statusLabels[application.status],
        )}</p>
        <p style="margin:0 0 22px;font-size:15px;line-height:1.7;color:#334155">${escapeHtml(
          statusMessages[application.status],
        )}</p>
        <p style="margin:0">${buttonHtml(dashboardUrl, "Open dashboard")}</p>
      `,
    }),
    subject,
    text,
    to: application.candidateEmail,
  };
}

export function buildApplicationStatusEmail(
  application: NotificationApplication,
  previousStatus?: ApplicationStatus,
) {
  const dashboardUrl = `${appUrl()}/home`;
  const subject = `Application update: ${application.job.title}`;
  const previousLine =
    previousStatus && previousStatus !== application.status
      ? `Previous status: ${statusLabels[previousStatus]}\n`
      : "";
  const text = [
    `Hi ${application.candidateName},`,
    "",
    `Your application for ${application.job.title} has been updated.`,
    previousLine + `New status: ${statusLabels[application.status]}`,
    "",
    statusMessages[application.status],
    "",
    `View your dashboard: ${dashboardUrl}`,
  ].join("\n");

  return {
    html: layoutHtml({
      heading: "Your application status changed",
      preview: `${application.job.title} is now ${statusLabels[
        application.status
      ].toLowerCase()}.`,
      body: `
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#334155">Hi ${escapeHtml(
          application.candidateName,
        )},</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#334155">Your application for <strong>${escapeHtml(
          application.job.title,
        )}</strong> has been updated.</p>
        ${
          previousStatus && previousStatus !== application.status
            ? `<p style="margin:0 0 8px;font-size:14px;line-height:1.7;color:#64748b"><strong>Previous status:</strong> ${escapeHtml(
                statusLabels[previousStatus],
              )}</p>`
            : ""
        }
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#334155"><strong>New status:</strong> ${escapeHtml(
          statusLabels[application.status],
        )}</p>
        <p style="margin:0 0 22px;font-size:15px;line-height:1.7;color:#334155">${escapeHtml(
          statusMessages[application.status],
        )}</p>
        <p style="margin:0">${buttonHtml(dashboardUrl, "Open dashboard")}</p>
      `,
    }),
    subject,
    text,
    to: application.candidateEmail,
  };
}

async function sendEmail(message: EmailMessage): Promise<EmailSendResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn("RESEND_API_KEY is not configured; email notification skipped.");
    return { status: "skipped" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    body: JSON.stringify({
      from: emailFrom(),
      html: message.html,
      subject: message.subject,
      text: message.text,
      to: message.to,
    }),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  const body = await response.text();

  if (!response.ok) {
    throw new Error(
      `Resend email failed with ${response.status}: ${body.slice(0, 500)}`,
    );
  }

  let id: string | null = null;
  try {
    const result: unknown = JSON.parse(body);
    if (
      result &&
      typeof result === "object" &&
      "id" in result &&
      typeof result.id === "string"
    ) {
      id = result.id;
    }
  } catch {
    // A successful provider response without JSON is still a successful send.
  }

  return { status: "sent", id };
}

async function sendSafely(message: EmailMessage) {
  try {
    await sendEmail(message);
  } catch (error) {
    console.error("Email notification failed", error);
  }
}

async function getApplication(applicationId: string) {
  return prisma.application.findUnique({
    where: { id: applicationId },
    select: {
      id: true,
      candidateEmail: true,
      candidateName: true,
      status: true,
      job: {
        select: {
          id: true,
          title: true,
          companyName: true,
        },
      },
    },
  });
}

export const EmailNotificationService = {
  async sendWelcomeVerificationEmail(input: {
    name: string;
    to: string;
    verificationUrl: string;
  }) {
    const result = await sendEmail(buildWelcomeVerificationEmail(input));

    if (result.status === "skipped") {
      throw new Error("EMAIL_PROVIDER_NOT_CONFIGURED");
    }

    return result;
  },

  async sendTestEmail(to: string) {
    const result = await sendEmail(buildEmailDeliveryTestEmail(to));

    if (result.status === "skipped") {
      throw new Error("EMAIL_PROVIDER_NOT_CONFIGURED");
    }

    return result;
  },

  async notifyApplicationStatusChanged(
    applicationId: string,
    previousStatus?: ApplicationStatus,
  ) {
    const application = await getApplication(applicationId);

    if (!application) {
      return;
    }

    if (previousStatus === application.status) {
      return;
    }

    await sendSafely(buildApplicationStatusEmail(application, previousStatus));
  },

  async notifyApplicationSubmitted(applicationId: string) {
    const application = await getApplication(applicationId);

    if (!application) {
      return;
    }

    await sendSafely(buildApplicationSubmittedEmail(application));
  },

  async notifyUsersOfNewJob(job: NotificationJob) {
    const recipients = await prisma.user.findMany({
      where: {
        role: {
          not: Role.ADMIN,
        },
      },
      select: {
        email: true,
        name: true,
      },
    });

    await Promise.all(
      recipients.map((recipient) => sendSafely(buildNewJobEmail(job, recipient))),
    );
  },
};
