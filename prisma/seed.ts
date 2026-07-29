import { PayoutTrigger, PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

type DemoJob = {
  title: string;
  description: string;
  payoutAmountCents: number;
  payoutType?: PayoutTrigger;
  currency?: string;
  companyName?: string;
  openings: number;
  hourlyMinCents: number;
  hourlyMaxCents: number;
  postedDaysAgo: number;
  isHighDemand?: boolean;
  skills: string[];
};

const demoJobs: DemoJob[] = [
  {
    title: "GitHub Contributor",
    description:
      "Review open-source repositories, resolve focused issues, and improve documentation across developer tooling projects.",
    payoutAmountCents: 180000,
    companyName: "ReferralJobs",
    openings: 30,
    hourlyMinCents: 5000,
    hourlyMaxCents: 15000,
    postedDaysAgo: 0,
    isHighDemand: true,
    skills: ["Python3", "Java", "Rust", "GitHub", "Code review", "Testing"],
  },
  {
    title: "Materials Expert",
    description:
      "Analyze technical papers, classify material properties, and produce evidence-backed summaries for model evaluation tasks.",
    payoutAmountCents: 140000,
    openings: 1,
    hourlyMinCents: 8000,
    hourlyMaxCents: 10000,
    postedDaysAgo: 0,
    skills: [
      "Materials science",
      "Materials characterization",
      "Technical literature review",
      "Metallurgy",
      "Polymers",
    ],
  },
  {
    title: "Aerodynamics Expert",
    description:
      "Evaluate aerodynamic simulations, annotate engineering reasoning, and write concise feedback on complex physics tasks.",
    payoutAmountCents: 160000,
    openings: 1,
    hourlyMinCents: 8000,
    hourlyMaxCents: 10000,
    postedDaysAgo: 0,
    isHighDemand: true,
    skills: [
      "Aerodynamics",
      "Computational fluid dynamics",
      "Technical writing",
      "Simulation review",
      "Physics",
    ],
  },
  {
    title: "Street Performing Musician",
    description:
      "Assess music performance prompts and provide expert judgment on live performance, audience interaction, and musicianship.",
    payoutAmountCents: 90000,
    openings: 1,
    hourlyMinCents: 10000,
    hourlyMaxCents: 30000,
    postedDaysAgo: 0,
    skills: [
      "Live music performance",
      "Musical instrument proficiency",
      "Public performance",
      "Improvisation",
    ],
  },
  {
    title: "Biologist",
    description:
      "Validate biology answers, review wet-lab reasoning, and produce high-quality feedback for scientific model evaluation.",
    payoutAmountCents: 120000,
    openings: 100,
    hourlyMinCents: 7000,
    hourlyMaxCents: 9000,
    postedDaysAgo: 1,
    isHighDemand: true,
    skills: ["Biology", "Molecular biology", "Wet labs", "Cell biology"],
  },
  {
    title: "Microbiologist",
    description:
      "Review microbiology workflows, classify experimental protocols, and evaluate answers involving organisms and lab methods.",
    payoutAmountCents: 120000,
    openings: 100,
    hourlyMinCents: 7000,
    hourlyMaxCents: 9000,
    postedDaysAgo: 1,
    isHighDemand: true,
    skills: ["Biology", "Microbiology", "Chemistry", "Lab methods"],
  },
  {
    title: "PowerPoint Specialist",
    description:
      "Create and evaluate slide workflows, formatting decisions, and presentation automation tasks for office productivity projects.",
    payoutAmountCents: 70000,
    openings: 99,
    hourlyMinCents: 2000,
    hourlyMaxCents: 6000,
    postedDaysAgo: 1,
    isHighDemand: true,
    skills: [
      "Microsoft PowerPoint",
      "Microsoft Excel",
      "Microsoft Word",
      "Slide design",
      "Office automation",
    ],
  },
  {
    title: "Excel Specialist",
    description:
      "Evaluate spreadsheet formulas, office XML tasks, and structured spreadsheet transformations for business users.",
    payoutAmountCents: 70000,
    openings: 100,
    hourlyMinCents: 2000,
    hourlyMaxCents: 6000,
    postedDaysAgo: 1,
    isHighDemand: true,
    skills: [
      "Microsoft Excel",
      "Office Open XML",
      "Microsoft PowerPoint",
      "Formulas",
      "Data cleanup",
    ],
  },
  {
    title: "Privacy Annotation Specialist",
    description:
      "Review legal and privacy documents, classify sensitive clauses, and support quality assurance for redaction workflows.",
    payoutAmountCents: 130000,
    openings: 10,
    hourlyMinCents: 10500,
    hourlyMaxCents: 14000,
    postedDaysAgo: 1,
    skills: ["Contract review", "Quality assurance", "Ediscovery", "Privacy"],
  },
  {
    title: "Document Reviewer",
    description:
      "Review document batches, identify issues, and validate outputs for legal and compliance-oriented workflows.",
    payoutAmountCents: 95000,
    openings: 10,
    hourlyMinCents: 6300,
    hourlyMaxCents: 11900,
    postedDaysAgo: 1,
    skills: ["Review data", "Identify issues", "Validate outputs", "Compliance"],
  },
  {
    title: "Word and PDF Expert",
    description:
      "Evaluate document formatting, PDF editing, and conversion tasks across complex business-document workflows.",
    payoutAmountCents: 65000,
    openings: 49,
    hourlyMinCents: 2000,
    hourlyMaxCents: 5500,
    postedDaysAgo: 1,
    isHighDemand: true,
    skills: ["Microsoft Word", "PDF editing tools", "Document formatting"],
  },
  {
    title: "Litigator / Practicing Attorney",
    description:
      "Review legal reasoning tasks, evaluate litigation strategy prompts, and provide high-signal feedback on attorney workflows.",
    payoutAmountCents: 160000,
    openings: 20,
    hourlyMinCents: 10000,
    hourlyMaxCents: 15000,
    postedDaysAgo: 1,
    isHighDemand: true,
    skills: [
      "Legal reasoning",
      "Litigation practice",
      "Analytical rigor",
      "Legal writing",
    ],
  },
  {
    title: "Event Planner",
    description:
      "Assess event planning prompts, logistics tradeoffs, vendor coordination, and client communication quality.",
    payoutAmountCents: 80000,
    openings: 10,
    hourlyMinCents: 5000,
    hourlyMaxCents: 10100,
    postedDaysAgo: 1,
    isHighDemand: true,
    skills: ["Event planning", "Coordination", "Client communication", "Budgeting"],
  },
  {
    title: "Bioinformatics Scientist",
    description:
      "Review computational biology tasks, evaluate sequence-analysis reasoning, and validate scientific explanations.",
    payoutAmountCents: 145000,
    openings: 50,
    hourlyMinCents: 9000,
    hourlyMaxCents: 12000,
    postedDaysAgo: 1,
    skills: ["Medicinal chemistry", "Bioinformatics", "Python", "Genomics"],
  },
  {
    title: "Computational Biology Expert",
    description:
      "Evaluate biology and chemistry tasks involving computational methods, structured reasoning, and scientific data review.",
    payoutAmountCents: 145000,
    openings: 50,
    hourlyMinCents: 9000,
    hourlyMaxCents: 12000,
    postedDaysAgo: 1,
    skills: ["Medicinal chemistry", "Computational biology", "Data review"],
  },
  {
    title: "Data Annotator",
    description:
      "Classify examples, review data labels, and improve quality for structured AI evaluation datasets.",
    payoutAmountCents: 45000,
    payoutType: PayoutTrigger.TASK_1,
    openings: 20,
    hourlyMinCents: 600,
    hourlyMaxCents: 1000,
    postedDaysAgo: 3,
    skills: ["Data annotation", "Attention to detail", "Quality review"],
  },
  {
    title: "PhD Physicist",
    description:
      "Evaluate advanced physics prompts, verify derivations, and produce careful reasoning for model-quality benchmarks.",
    payoutAmountCents: 150000,
    openings: 100,
    hourlyMinCents: 7000,
    hourlyMaxCents: 9000,
    postedDaysAgo: 3,
    isHighDemand: true,
    skills: ["Physics", "Science", "Critical thinking", "Research"],
  },
  {
    title: "Junior Mainframe Developer",
    description:
      "Review COBOL and mainframe prompts, validate code snippets, and help evaluate legacy-system modernization tasks.",
    payoutAmountCents: 135000,
    openings: 25,
    hourlyMinCents: 9000,
    hourlyMaxCents: 12000,
    postedDaysAgo: 3,
    isHighDemand: true,
    skills: ["COBOL", "Mainframe", "JCL", "Debugging"],
  },
  {
    title: "Mainframe Developer",
    description:
      "Evaluate advanced COBOL and enterprise mainframe tasks with attention to correctness and production constraints.",
    payoutAmountCents: 145000,
    openings: 25,
    hourlyMinCents: 9000,
    hourlyMaxCents: 12600,
    postedDaysAgo: 3,
    isHighDemand: true,
    skills: ["COBOL", "Mainframe", "Enterprise systems", "Batch jobs"],
  },
  {
    title: "Enterprise AI Productivity Specialist",
    description:
      "Assess enterprise workflow prompts, AI automation ideas, and productivity improvements across complex operations.",
    payoutAmountCents: 130000,
    openings: 50,
    hourlyMinCents: 8000,
    hourlyMaxCents: 15000,
    postedDaysAgo: 3,
    isHighDemand: true,
    skills: [
      "Enterprise AI productivity",
      "AI workflow design",
      "Workflow automation",
      "Operations",
    ],
  },
  {
    title: "Strategic Project Lead, Finance Expertise",
    description:
      "Review finance-oriented strategy tasks, evaluate operating plans, and synthesize business recommendations.",
    payoutAmountCents: 150000,
    openings: 1,
    hourlyMinCents: 8000,
    hourlyMaxCents: 9000,
    postedDaysAgo: 5,
    isHighDemand: true,
    skills: ["Leadership", "Data operations", "Human data", "Finance"],
  },
  {
    title: "Strategic Project Lead, Medical Expertise",
    description:
      "Evaluate healthcare and medical-domain tasks that require careful judgment, structured review, and project leadership.",
    payoutAmountCents: 150000,
    openings: 1,
    hourlyMinCents: 8000,
    hourlyMaxCents: 9000,
    postedDaysAgo: 5,
    isHighDemand: true,
    skills: ["Leadership", "Medical expertise", "Human data", "Operations"],
  },
  {
    title: "Strategic Project Lead, Legal Expertise",
    description:
      "Lead review of legal-domain evaluation tasks, coordinate quality checks, and synthesize legal operations feedback.",
    payoutAmountCents: 150000,
    openings: 1,
    hourlyMinCents: 8000,
    hourlyMaxCents: 9000,
    postedDaysAgo: 5,
    isHighDemand: true,
    skills: ["Leadership", "Legal expertise", "Human data", "Operations"],
  },
  {
    title: "Senior Full-Stack Engineer",
    description:
      "Build production web applications with TypeScript, React, Node.js, and PostgreSQL for venture-backed product teams.",
    payoutAmountCents: 250000,
    companyName: "ReferralJobs",
    openings: 8,
    hourlyMinCents: 8500,
    hourlyMaxCents: 14000,
    postedDaysAgo: 6,
    isHighDemand: true,
    skills: ["TypeScript", "React", "Node.js", "PostgreSQL", "Testing"],
  },
  {
    title: "Product Designer",
    description:
      "Own interaction design, prototyping, and design systems for B2B SaaS products with complex operational workflows.",
    payoutAmountCents: 150000,
    openings: 4,
    hourlyMinCents: 6500,
    hourlyMaxCents: 11000,
    postedDaysAgo: 7,
    skills: ["Product design", "Prototyping", "Design systems", "UX research"],
  },
];

function postedAt(daysAgo: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
}

async function seedJob(job: DemoJob) {
  const createdJob = await prisma.job.upsert({
    where: { title: job.title },
    update: {
      description: job.description,
      payoutAmountCents: job.payoutAmountCents,
      payoutType: job.payoutType ?? PayoutTrigger.HOURS_10,
      currency: job.currency ?? "USD",
      companyName: job.companyName ?? "ReferralJobs",
      openings: job.openings,
      hourlyMinCents: job.hourlyMinCents,
      hourlyMaxCents: job.hourlyMaxCents,
      postedAt: postedAt(job.postedDaysAgo),
      isHighDemand: job.isHighDemand ?? false,
      isActive: true,
    },
    create: {
      title: job.title,
      description: job.description,
      payoutAmountCents: job.payoutAmountCents,
      payoutType: job.payoutType ?? PayoutTrigger.HOURS_10,
      currency: job.currency ?? "USD",
      companyName: job.companyName ?? "ReferralJobs",
      openings: job.openings,
      hourlyMinCents: job.hourlyMinCents,
      hourlyMaxCents: job.hourlyMaxCents,
      postedAt: postedAt(job.postedDaysAgo),
      isHighDemand: job.isHighDemand ?? false,
      isActive: true,
    },
    select: { id: true },
  });

  await prisma.jobSkill.deleteMany({
    where: { jobId: createdJob.id },
  });

  await prisma.jobSkill.createMany({
    data: job.skills.map((label) => ({
      jobId: createdJob.id,
      label,
    })),
  });
}

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

  await Promise.all(demoJobs.map(seedJob));
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
