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

const DIGITAL_JOB_DATA_RULES = [
  "Each seeded job must be deliverable online or remotely.",
  "Each seeded job must include a title, description, hourly pay range, openings, posted-date spread, demand flag, and skill tags.",
  "Each seeded job must have at least 30 openings.",
  "Posted dates are spread across the last 28 days so the New flag appears naturally for recent roles.",
  "High-demand flags are assigned to AI, software, data, security, cloud, healthcare, legal, and revenue roles plus a deterministic share of the remaining catalog.",
];

const DIGITAL_JOB_TARGET_COUNT = 520;

const freelanceIdentityReferences = [
  {
    freelanceIdCode: "FL-BRIAN-BWOSI-001",
    serialNumber: "SER-BWOSI-001",
    legalName: "Brian Bwosi",
    dateOfBirth: "1998-01-01",
  },
  {
    freelanceIdCode: "FL-AMINA-HASSAN-002",
    serialNumber: "SER-HASSAN-002",
    legalName: "Amina Hassan",
    dateOfBirth: "1996-06-14",
  },
  {
    freelanceIdCode: "FL-DAVID-KIMANI-003",
    serialNumber: "SER-KIMANI-003",
    legalName: "David Kimani",
    dateOfBirth: "1994-09-22",
  },
  {
    freelanceIdCode: "FL-MARIA-SANTOS-004",
    serialNumber: "SER-SANTOS-004",
    legalName: "Maria Santos",
    dateOfBirth: "1992-03-08",
  },
  {
    freelanceIdCode: "FL-PRIYA-SHAH-005",
    serialNumber: "SER-SHAH-005",
    legalName: "Priya Shah",
    dateOfBirth: "1997-11-30",
  },
];

const baseDemoJobs: DemoJob[] = [
  {
    title: "GitHub Contributor",
    description:
      "Review open-source repositories, resolve focused issues, and improve documentation across developer tooling projects.",
    payoutAmountCents: 180000,
    companyName: "micro1",
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
    companyName: "micro1",
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

type DigitalJobFamily = {
  family: string;
  roles: string[];
  specialties: string[];
  skills: string[];
  minHourlyCents: number;
  maxHourlyCents: number;
  payoutAmountCents: number;
  highDemandEvery: number;
  descriptionFocus: string;
};

const digitalJobFamilies: DigitalJobFamily[] = [
  {
    family: "Software Engineering",
    roles: [
      "Developer",
      "Engineer",
      "Code Reviewer",
      "Technical Reviewer",
      "Automation Specialist",
      "QA Tester",
      "API Integrator",
    ],
    specialties: [
      "React",
      "Next.js",
      "Node.js",
      "Python",
      "Java",
      "Rust",
      "Go",
      "Ruby on Rails",
      "PHP",
      "Laravel",
      "WordPress",
      "Shopify",
    ],
    skills: [
      "TypeScript",
      "GitHub",
      "API integration",
      "Testing",
      "Code review",
      "Debugging",
      "CI/CD",
    ],
    minHourlyCents: 5000,
    maxHourlyCents: 15000,
    payoutAmountCents: 180000,
    highDemandEvery: 2,
    descriptionFocus:
      "building, reviewing, testing, and improving production software for remote client projects",
  },
  {
    family: "AI and Data",
    roles: [
      "AI Trainer",
      "LLM Evaluator",
      "Prompt Engineer",
      "Data Annotator",
      "Model Response Reviewer",
      "RAG Specialist",
      "Synthetic Data Writer",
    ],
    specialties: [
      "Healthcare",
      "Finance",
      "Legal",
      "Coding",
      "Math",
      "Multilingual",
      "Safety",
      "Reasoning",
      "Computer Vision",
      "Speech",
    ],
    skills: [
      "Prompt engineering",
      "Data annotation",
      "AI evaluation",
      "Rubric design",
      "Critical thinking",
      "LLMs",
      "Quality assurance",
    ],
    minHourlyCents: 2500,
    maxHourlyCents: 12000,
    payoutAmountCents: 140000,
    highDemandEvery: 2,
    descriptionFocus:
      "reviewing AI outputs, writing evaluation rubrics, and preparing high-quality training data",
  },
  {
    family: "Data Analytics",
    roles: [
      "Data Analyst",
      "BI Developer",
      "Dashboard Builder",
      "Spreadsheet Modeler",
      "SQL Analyst",
      "Analytics Engineer",
    ],
    specialties: [
      "Power BI",
      "Tableau",
      "Looker",
      "Excel",
      "Python",
      "Marketing",
      "Product",
      "Revenue",
    ],
    skills: [
      "SQL",
      "Dashboards",
      "Data cleaning",
      "Reporting",
      "Excel",
      "Analytics",
      "Business intelligence",
    ],
    minHourlyCents: 3500,
    maxHourlyCents: 10000,
    payoutAmountCents: 115000,
    highDemandEvery: 3,
    descriptionFocus:
      "turning remote business data into dashboards, reports, and structured recommendations",
  },
  {
    family: "Design and Creative",
    roles: [
      "Designer",
      "Visual QA Specialist",
      "Template Designer",
      "Brand Designer",
      "Motion Designer",
      "Video Editor",
    ],
    specialties: [
      "UI/UX",
      "Figma",
      "Graphic",
      "Canva",
      "Presentation",
      "Web",
      "Social Media",
      "3D",
    ],
    skills: [
      "Visual design",
      "Figma",
      "Design systems",
      "Layout",
      "Branding",
      "Content review",
      "Prototyping",
    ],
    minHourlyCents: 2500,
    maxHourlyCents: 8500,
    payoutAmountCents: 95000,
    highDemandEvery: 4,
    descriptionFocus:
      "creating and reviewing digital assets, interfaces, templates, and visual deliverables",
  },
  {
    family: "Digital Marketing",
    roles: [
      "Specialist",
      "Campaign Manager",
      "SEO Analyst",
      "Content Strategist",
      "PPC Analyst",
      "Growth Marketer",
      "Email Marketer",
    ],
    specialties: [
      "Google Ads",
      "Meta Ads",
      "TikTok Ads",
      "B2B SaaS",
      "Ecommerce",
      "Local SEO",
      "Affiliate",
      "Marketing Analytics",
    ],
    skills: [
      "Campaign analysis",
      "SEO",
      "Copywriting",
      "Analytics",
      "Conversion optimization",
      "A/B testing",
      "Audience research",
    ],
    minHourlyCents: 2000,
    maxHourlyCents: 9000,
    payoutAmountCents: 90000,
    highDemandEvery: 3,
    descriptionFocus:
      "planning, reviewing, and optimizing remote marketing campaigns and content workflows",
  },
  {
    family: "Customer and Operations",
    roles: [
      "Support Specialist",
      "Virtual Assistant",
      "Community Moderator",
      "CRM Coordinator",
      "Operations Analyst",
      "Customer Success Specialist",
      "Back Office Specialist",
    ],
    specialties: [
      "Zendesk",
      "Intercom",
      "HubSpot",
      "Salesforce",
      "Shopify",
      "Healthcare Admin",
      "SaaS",
      "Marketplace",
    ],
    skills: [
      "Customer support",
      "Remote collaboration",
      "Documentation",
      "CRM",
      "Quality assurance",
      "Issue triage",
      "Process improvement",
    ],
    minHourlyCents: 1200,
    maxHourlyCents: 5500,
    payoutAmountCents: 65000,
    highDemandEvery: 4,
    descriptionFocus:
      "handling digital operations, support queues, CRM updates, and remote customer workflows",
  },
  {
    family: "Writing and Localization",
    roles: [
      "Content Writer",
      "Technical Writer",
      "Copy Editor",
      "Localization Reviewer",
      "Transcript Editor",
      "Research Writer",
      "Grant Writer",
    ],
    specialties: [
      "English",
      "Spanish",
      "French",
      "German",
      "Portuguese",
      "Arabic",
      "Japanese",
      "Korean",
      "Medical",
      "Legal",
      "Fintech",
    ],
    skills: [
      "Writing",
      "Editing",
      "Localization",
      "Research",
      "Style guides",
      "Fact checking",
      "Content QA",
    ],
    minHourlyCents: 1800,
    maxHourlyCents: 9500,
    payoutAmountCents: 85000,
    highDemandEvery: 4,
    descriptionFocus:
      "writing, editing, translating, and reviewing online content for accuracy and clarity",
  },
  {
    family: "Audio and Media",
    roles: [
      "Voice Actor",
      "Audio Reviewer",
      "Podcast Editor",
      "Subtitle Specialist",
      "Video QA Specialist",
      "Localization Producer",
    ],
    specialties: [
      "English",
      "Spanish",
      "Portuguese",
      "French",
      "German",
      "Hindi",
      "Arabic",
      "Mandarin",
      "YouTube",
      "E-learning",
    ],
    skills: [
      "Audio recording",
      "Audio editing",
      "Transcription",
      "Subtitles",
      "Media QA",
      "Voice work",
      "File formatting",
    ],
    minHourlyCents: 1500,
    maxHourlyCents: 7500,
    payoutAmountCents: 80000,
    highDemandEvery: 4,
    descriptionFocus:
      "recording, editing, reviewing, and localizing remote audio and video deliverables",
  },
  {
    family: "Cybersecurity",
    roles: [
      "Security Reviewer",
      "SOC Analyst",
      "Pentest Report Reviewer",
      "Cloud Security Analyst",
      "GRC Analyst",
      "Vulnerability Triage Specialist",
    ],
    specialties: [
      "Web App",
      "AWS",
      "Azure",
      "GCP",
      "Network",
      "Identity",
      "Compliance",
      "DevSecOps",
    ],
    skills: [
      "Cybersecurity",
      "Risk analysis",
      "Vulnerability review",
      "Security documentation",
      "Cloud security",
      "Compliance",
      "Threat modeling",
    ],
    minHourlyCents: 4500,
    maxHourlyCents: 15000,
    payoutAmountCents: 170000,
    highDemandEvery: 2,
    descriptionFocus:
      "reviewing remote security tasks, triaging findings, and documenting practical remediation steps",
  },
  {
    family: "Finance and Business",
    roles: [
      "Bookkeeper",
      "Financial Analyst",
      "Accounting Reviewer",
      "Tax Prep Assistant",
      "FP&A Analyst",
      "Payroll Specialist",
    ],
    specialties: [
      "QuickBooks",
      "Xero",
      "Excel",
      "Ecommerce",
      "Startup",
      "Real Estate",
      "Crypto",
      "Nonprofit",
    ],
    skills: [
      "Accounting",
      "Financial analysis",
      "Bookkeeping",
      "Excel",
      "Reconciliation",
      "Reporting",
      "Quality review",
    ],
    minHourlyCents: 2000,
    maxHourlyCents: 10000,
    payoutAmountCents: 110000,
    highDemandEvery: 3,
    descriptionFocus:
      "reviewing financial records, preparing digital reports, and supporting remote business operations",
  },
  {
    family: "Legal and Compliance",
    roles: [
      "Document Reviewer",
      "Contract Analyst",
      "Privacy Analyst",
      "Compliance Specialist",
      "Legal Researcher",
      "Policy Reviewer",
    ],
    specialties: [
      "US",
      "EU",
      "Commercial",
      "M&A",
      "Employment",
      "Data Privacy",
      "Ediscovery",
      "IP",
    ],
    skills: [
      "Contract review",
      "Legal research",
      "Compliance",
      "Privacy",
      "Risk assessment",
      "Document review",
      "Policy analysis",
    ],
    minHourlyCents: 4000,
    maxHourlyCents: 15000,
    payoutAmountCents: 160000,
    highDemandEvery: 2,
    descriptionFocus:
      "reviewing contracts, policies, privacy material, and legal datasets for remote client projects",
  },
  {
    family: "Education and Tutoring",
    roles: [
      "Online Tutor",
      "Curriculum Reviewer",
      "Assessment Writer",
      "Instructional Designer",
      "Learning QA Specialist",
    ],
    specialties: [
      "Math",
      "Physics",
      "Chemistry",
      "Biology",
      "Computer Science",
      "English",
      "Business",
      "Medical",
    ],
    skills: [
      "Teaching",
      "Assessment design",
      "Curriculum review",
      "Subject expertise",
      "Feedback writing",
      "Remote instruction",
      "Learning outcomes",
    ],
    minHourlyCents: 1800,
    maxHourlyCents: 9000,
    payoutAmountCents: 90000,
    highDemandEvery: 3,
    descriptionFocus:
      "creating, reviewing, and improving online lessons, assessments, and learning feedback",
  },
  {
    family: "Product and Project",
    roles: [
      "Product Manager",
      "Project Coordinator",
      "Scrum Master",
      "Product Ops Specialist",
      "UX Researcher",
      "QA Coordinator",
    ],
    specialties: [
      "SaaS",
      "AI Tools",
      "Ecommerce",
      "Mobile Apps",
      "B2B",
      "Fintech",
      "Healthtech",
      "Edtech",
    ],
    skills: [
      "Product management",
      "Project planning",
      "Stakeholder communication",
      "User research",
      "Agile",
      "Documentation",
      "Workflow design",
    ],
    minHourlyCents: 3500,
    maxHourlyCents: 13000,
    payoutAmountCents: 150000,
    highDemandEvery: 3,
    descriptionFocus:
      "coordinating remote digital projects, clarifying requirements, and improving product workflows",
  },
  {
    family: "Sales and Lead Generation",
    roles: [
      "Sales Development Representative",
      "Lead Researcher",
      "Partnerships Coordinator",
      "Proposal Writer",
      "CRM Data Specialist",
      "Outbound Campaign Specialist",
    ],
    specialties: [
      "B2B SaaS",
      "IT Services",
      "Healthcare",
      "Ecommerce",
      "Real Estate",
      "Recruiting",
      "Cybersecurity",
      "Marketing Services",
    ],
    skills: [
      "Lead generation",
      "CRM",
      "Prospecting",
      "Email outreach",
      "Research",
      "Sales operations",
      "Pipeline management",
    ],
    minHourlyCents: 1500,
    maxHourlyCents: 8000,
    payoutAmountCents: 85000,
    highDemandEvery: 3,
    descriptionFocus:
      "researching prospects, maintaining CRM data, and supporting remote sales workflows",
  },
  {
    family: "Engineering and Science Expertise",
    roles: [
      "Subject Matter Expert",
      "Technical Evaluator",
      "Research Reviewer",
      "Simulation Reviewer",
      "Data Reviewer",
    ],
    specialties: [
      "Mechanical Engineering",
      "Electrical Engineering",
      "Semiconductors",
      "Materials Science",
      "Civil Engineering",
      "Robotics",
      "Chemistry",
      "Pharmacology",
      "Biology",
      "Statistics",
    ],
    skills: [
      "Technical review",
      "Scientific reasoning",
      "Research analysis",
      "Engineering",
      "Quality assurance",
      "Domain expertise",
      "Technical writing",
    ],
    minHourlyCents: 5000,
    maxHourlyCents: 16000,
    payoutAmountCents: 180000,
    highDemandEvery: 2,
    descriptionFocus:
      "evaluating specialized science and engineering tasks for online expert-review projects",
  },
];

const HIGH_DEMAND_TERMS = [
  "ai",
  "llm",
  "software",
  "engineer",
  "developer",
  "data",
  "security",
  "cloud",
  "healthcare",
  "medical",
  "legal",
  "sales",
  "revenue",
  "science",
  "cybersecurity",
];

function uniqueItems(items: string[]) {
  return [...new Set(items.filter(Boolean))];
}

function normalizeBaseJob(job: DemoJob, index: number): DemoJob {
  return {
    ...job,
    openings: Math.max(30, job.openings),
    postedDaysAgo: index % 28,
    isHighDemand: job.isHighDemand ?? index % 3 === 0,
  };
}

function generatedJobDescription(
  family: DigitalJobFamily,
  specialty: string,
  role: string,
) {
  return `Complete remote ${family.family.toLowerCase()} work as a ${specialty} ${role.toLowerCase()} by ${family.descriptionFocus}. Deliver clear written notes, follow project guidelines, review outputs for quality, and collaborate asynchronously with coordinators.`;
}

function generatedSkills(
  family: DigitalJobFamily,
  specialty: string,
  role: string,
  index: number,
) {
  const rotatedSkills = [
    ...family.skills.slice(index % family.skills.length),
    ...family.skills.slice(0, index % family.skills.length),
  ];

  return uniqueItems([specialty, role, ...rotatedSkills]).slice(0, 7);
}

function isHighDemandJob(
  family: DigitalJobFamily,
  title: string,
  index: number,
) {
  const searchable = `${family.family} ${title}`.toLowerCase();
  return (
    HIGH_DEMAND_TERMS.some((term) => searchable.includes(term)) ||
    index % family.highDemandEvery === 0
  );
}

function buildDigitalJobCatalog(targetCount: number) {
  const jobs = baseDemoJobs.map(normalizeBaseJob);
  const titles = new Set(jobs.map((job) => job.title.toLowerCase()));
  let index = jobs.length;

  for (const family of digitalJobFamilies) {
    for (const specialty of family.specialties) {
      for (const role of family.roles) {
        if (jobs.length >= targetCount) {
          return jobs;
        }

        const title = `${specialty} ${role}`;

        if (titles.has(title.toLowerCase())) {
          continue;
        }

        const hourlyMinCents = family.minHourlyCents + (index % 3) * 500;
        const hourlyMaxCents = Math.max(
          hourlyMinCents + 1000,
          family.maxHourlyCents + (index % 4) * 500,
        );

        jobs.push({
          title,
          description: generatedJobDescription(family, specialty, role),
          payoutAmountCents: family.payoutAmountCents,
          companyName: "micro1",
          openings: 30 + ((index * 7) % 121),
          hourlyMinCents,
          hourlyMaxCents,
          postedDaysAgo: index % 28,
          isHighDemand: isHighDemandJob(family, title, index),
          skills: generatedSkills(family, specialty, role, index),
        });

        titles.add(title.toLowerCase());
        index += 1;
      }
    }
  }

  if (jobs.length < targetCount) {
    throw new Error(
      `Digital job catalog only generated ${jobs.length} jobs; expected at least ${targetCount}.`,
    );
  }

  return jobs;
}

function validateJobCatalog(jobs: DemoJob[]) {
  if (DIGITAL_JOB_DATA_RULES.length < 5) {
    throw new Error("Digital job data rules are incomplete.");
  }

  if (jobs.length < 500) {
    throw new Error(`Expected at least 500 jobs, received ${jobs.length}.`);
  }

  const titles = new Set<string>();

  for (const job of jobs) {
    if (titles.has(job.title.toLowerCase())) {
      throw new Error(`Duplicate job title: ${job.title}`);
    }

    titles.add(job.title.toLowerCase());

    if (!job.description.trim()) {
      throw new Error(`Missing description for ${job.title}`);
    }

    if (job.openings < 30) {
      throw new Error(`${job.title} has fewer than 30 openings.`);
    }

    if (job.hourlyMinCents <= 0 || job.hourlyMaxCents <= job.hourlyMinCents) {
      throw new Error(`${job.title} has an invalid hourly pay range.`);
    }

    if (job.postedDaysAgo < 0 || job.postedDaysAgo > 27) {
      throw new Error(`${job.title} is outside the supported posted-date range.`);
    }

    if (job.skills.length === 0) {
      throw new Error(`Missing skills for ${job.title}`);
    }
  }
}

const demoJobs = buildDigitalJobCatalog(DIGITAL_JOB_TARGET_COUNT);

function postedAt(daysAgo: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
}

function chunkItems<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

async function seedJob(job: DemoJob) {
  const createdJob = await prisma.job.upsert({
    where: { title: job.title },
    update: {
      description: job.description,
      payoutAmountCents: job.payoutAmountCents,
      payoutType: job.payoutType ?? PayoutTrigger.HOURS_10,
      currency: job.currency ?? "USD",
      companyName: job.companyName ?? "micro1",
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
      companyName: job.companyName ?? "micro1",
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
  validateJobCatalog(demoJobs);
  console.info(
    `Seeding ${demoJobs.length} digital jobs using ${DIGITAL_JOB_DATA_RULES.length} catalog rules.`,
  );

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

  for (const identity of freelanceIdentityReferences) {
    await prisma.freelanceIdentityReference.upsert({
      where: { freelanceIdCode: identity.freelanceIdCode },
      update: {
        serialNumber: identity.serialNumber,
        legalName: identity.legalName,
        dateOfBirth: new Date(`${identity.dateOfBirth}T00:00:00.000Z`),
        isActive: true,
      },
      create: {
        freelanceIdCode: identity.freelanceIdCode,
        serialNumber: identity.serialNumber,
        legalName: identity.legalName,
        dateOfBirth: new Date(`${identity.dateOfBirth}T00:00:00.000Z`),
        isActive: true,
      },
    });
  }

  for (const jobBatch of chunkItems(demoJobs, 3)) {
    await Promise.all(jobBatch.map(seedJob));
  }

  await prisma.job.updateMany({
    where: {
      openings: {
        lt: 30,
      },
    },
    data: {
      openings: 30,
    },
  });
}

async function run() {
  if (process.argv.includes("--validate-only")) {
    validateJobCatalog(demoJobs);
    console.info(
      `Validated ${demoJobs.length} digital jobs using ${DIGITAL_JOB_DATA_RULES.length} catalog rules.`,
    );
    return;
  }

  await main();
}

run()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
