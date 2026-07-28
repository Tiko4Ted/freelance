import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const demoJobs = [
  {
    title: "Senior Full-Stack Engineer",
    description:
      "Build production web applications with TypeScript, React, Node.js, and PostgreSQL for venture-backed product teams.",
    payoutAmountCents: 250000,
    currency: "USD",
  },
  {
    title: "AI Workflow Automation Specialist",
    description:
      "Design and ship internal AI automations that connect business systems, reduce manual operations, and improve reporting.",
    payoutAmountCents: 180000,
    currency: "USD",
  },
  {
    title: "Product Designer",
    description:
      "Own interaction design, prototyping, and design systems for B2B SaaS products with complex operational workflows.",
    payoutAmountCents: 150000,
    currency: "USD",
  },
  {
    title: "Data Engineer",
    description:
      "Create reliable data pipelines, warehouse models, and quality checks for analytics and customer-facing data products.",
    payoutAmountCents: 220000,
    currency: "USD",
  },
  {
    title: "One-Task Security Reviewer",
    description:
      "Complete focused application security reviews and provide concise vulnerability reports with remediation steps.",
    payoutAmountCents: 75000,
    payoutType: "TASK_1" as const,
    currency: "USD",
  },
];

async function main() {
  const passwordHash = await bcrypt.hash("admin-password", 12);

  await prisma.user.upsert({
    where: { email: "admin@referraljobs.test" },
    update: {
      name: "ReferralJobs Admin",
      role: Role.ADMIN,
    },
    create: {
      email: "admin@referraljobs.test",
      name: "ReferralJobs Admin",
      passwordHash,
      role: Role.ADMIN,
    },
  });

  for (const job of demoJobs) {
    await prisma.job.upsert({
      where: { title: job.title },
      update: job,
      create: job,
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
