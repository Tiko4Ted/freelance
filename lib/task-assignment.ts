import { PayoutTrigger } from "@prisma/client";

export type TaskAssignmentJob = {
  title: string;
  description: string;
  companyName: string;
  payoutType: PayoutTrigger;
  skills: { label: string }[];
};

export type TaskAssignmentApplication = {
  id: string;
  candidateName: string;
  job: TaskAssignmentJob;
};

export type TaskAssignmentSection = {
  heading: string;
  lines: string[];
};

export type TaskAssignment = {
  title: string;
  fileBaseName: string;
  sections: TaskAssignmentSection[];
};

type TaskTemplate = {
  category: string;
  complexity: string;
  estimatedTime: string;
  task: string[];
  deliverables: string[];
  reviewCriteria: string[];
  partnerPaymentNote?: string;
};

function skillLabels(job: TaskAssignmentJob) {
  return job.skills.map((skill) => skill.label).filter(Boolean);
}

function searchableText(job: TaskAssignmentJob) {
  return [job.title, job.description, ...skillLabels(job)]
    .join(" ")
    .toLowerCase();
}

function hasAny(source: string, terms: string[]) {
  return terms.some((term) => source.includes(term));
}

function sentenceList(items: string[]) {
  if (!items.length) {
    return "the role requirements";
  }

  if (items.length === 1) {
    return items[0];
  }

  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function slugify(value: string) {
  return value
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function inferConversationLanguage(job: TaskAssignmentJob) {
  const languages = [
    "English",
    "Spanish",
    "French",
    "German",
    "Portuguese",
    "Arabic",
    "Japanese",
    "Korean",
    "Hindi",
    "Mandarin",
  ];
  const source = searchableText(job);

  return (
    languages.find((language) => source.includes(language.toLowerCase())) ??
    "the language or accent specified for this role"
  );
}

function buildAudioConversationTask(job: TaskAssignmentJob): TaskTemplate {
  const language = inferConversationLanguage(job);

  return {
    category: "Conversation recording",
    complexity: "Moderate: natural speech quality, clean recording, and complete metadata matter more than a complex script.",
    estimatedTime: "45 to 90 minutes including setup, recording, review, and upload.",
    task: [
      `Record a 12 to 18 minute natural conversation with a friend in ${language}. Keep the conversation unscripted, respectful, and realistic.`,
      "Choose two everyday topics such as work, learning, shopping, travel, technology, health, family routines, or local services.",
      "Both speakers should contribute meaningfully. Avoid one-word answers, long silent gaps, background music, or reading from a prepared script.",
      "Record in a quiet room using the best microphone available to you. Start with each participant stating first name, language, date, and consent to submit the recording for review.",
    ],
    deliverables: [
      "One audio or video file containing the full conversation.",
      "A short submission note with language, duration, device used, both participant names, and your friend's email for partner payout review.",
      "A brief quality note listing any background noise, interruptions, or sections reviewers should know about.",
    ],
    reviewCriteria: [
      "Conversation sounds natural and matches the required language or accent.",
      "Audio is clear enough to understand both speakers without repeated playback.",
      "Both participants gave consent and participated throughout the recording.",
      "Submission notes include the partner payout contact and recording metadata.",
    ],
    partnerPaymentNote:
      "For conversation tasks, both participants are reviewed for payment after the completed recording is uploaded and approved. Include your friend's payout contact in the submission notes so operations can process that review.",
  };
}

function buildTemplate(job: TaskAssignmentJob): TaskTemplate {
  const source = searchableText(job);
  const skills = sentenceList(skillLabels(job).slice(0, 4));

  if (
    hasAny(source, [
      "audio",
      "voice",
      "recording",
      "podcast",
      "subtitle",
      "transcription",
      "conversation",
      "localization producer",
    ])
  ) {
    return buildAudioConversationTask(job);
  }

  if (
    hasAny(source, [
      "developer",
      "code",
      "api",
      "software",
      "react",
      "next.js",
      "node.js",
      "python",
      "java",
      "rust",
      "go",
      "qa tester",
    ])
  ) {
    return {
      category: "Technical work sample",
      complexity: "Moderate: small enough to complete carefully, but broad enough to show practical judgment.",
      estimatedTime: "2 to 3 hours.",
      task: [
        `Complete a focused ${job.title.toLowerCase()} work sample using ${skills}.`,
        "Review the provided scenario: a remote client has a small production issue, unclear acceptance criteria, and one missing quality check.",
        "Create or review the implementation approach, document the issue, propose the fix, and include a short test plan.",
        "Keep the solution scoped to the smallest reliable change and explain any tradeoffs.",
      ],
      deliverables: [
        "A code file, patch, repository link, or technical review document.",
        "A one-page note describing the issue, approach, tests, and remaining risks.",
        "Screenshots or command output if the task involves UI behavior or automated checks.",
      ],
      reviewCriteria: [
        "Work is correct, readable, and aligned with the role's technical skills.",
        "Reasoning is clear and the test plan is realistic.",
        "The solution avoids unnecessary complexity and handles edge cases called out in the brief.",
      ],
    };
  }

  if (
    hasAny(source, [
      "ai",
      "llm",
      "prompt",
      "model",
      "annotation",
      "synthetic data",
      "rubric",
      "response reviewer",
    ])
  ) {
    return {
      category: "AI evaluation work sample",
      complexity: "Moderate: the task requires consistent judgment, not advanced research.",
      estimatedTime: "90 minutes to 2 hours.",
      task: [
        `Evaluate eight short model responses related to ${skills}.`,
        "Rank each response for accuracy, instruction following, clarity, and safety.",
        "Write a compact rubric with four scoring levels and apply it consistently.",
        "Flag ambiguous cases and explain what evidence would improve confidence.",
      ],
      deliverables: [
        "A completed scoring table for all eight responses.",
        "A short rubric and a paragraph explaining the hardest judgment call.",
        "Any corrections or ideal-answer notes needed for low-quality responses.",
      ],
      reviewCriteria: [
        "Scores are consistent with the written rubric.",
        "Feedback is specific, fair, and grounded in the role domain.",
        "The submission separates facts, assumptions, and uncertainty.",
      ],
    };
  }

  if (
    hasAny(source, [
      "data",
      "analytics",
      "dashboard",
      "sql",
      "excel",
      "reporting",
      "business intelligence",
      "spreadsheet",
    ])
  ) {
    return {
      category: "Data analysis work sample",
      complexity: "Moderate: enough rows and ambiguity to show analytical judgment without requiring a full BI build.",
      estimatedTime: "2 hours.",
      task: [
        `Analyze a small remote-work dataset using ${skills}.`,
        "Clean obvious inconsistencies, define three useful metrics, and identify two trends that would matter to a client.",
        "Prepare a concise dashboard sketch or table with the key numbers and a recommendation.",
      ],
      deliverables: [
        "A spreadsheet, SQL notes, notebook, or dashboard screenshot.",
        "A one-page findings summary with metrics, assumptions, and recommendations.",
        "A list of data quality issues found during the review.",
      ],
      reviewCriteria: [
        "Metrics are calculated consistently and explained plainly.",
        "Recommendations follow from the data rather than generic advice.",
        "Data cleaning decisions are documented.",
      ],
    };
  }

  if (
    hasAny(source, [
      "design",
      "figma",
      "visual",
      "brand",
      "template",
      "motion",
      "video editor",
      "canva",
    ])
  ) {
    return {
      category: "Design review work sample",
      complexity: "Moderate: a realistic design pass with clear rationale, not a full redesign.",
      estimatedTime: "2 to 3 hours.",
      task: [
        `Create or critique a focused digital asset for a client workflow using ${skills}.`,
        "Improve hierarchy, spacing, accessibility, and visual consistency for one screen, template, or short media asset.",
        "Write notes explaining the design decisions and what you would test next.",
      ],
      deliverables: [
        "A design file, exported image, presentation, or annotated review.",
        "A short before-and-after explanation or critique summary.",
        "A checklist covering accessibility, consistency, and content clarity.",
      ],
      reviewCriteria: [
        "Visual decisions solve the stated user or client problem.",
        "The work is polished, legible, and consistent.",
        "Rationale is practical and tied to the role requirements.",
      ],
    };
  }

  if (
    hasAny(source, [
      "marketing",
      "seo",
      "ads",
      "campaign",
      "content strategist",
      "growth",
      "email marketer",
      "conversion",
    ])
  ) {
    return {
      category: "Marketing analysis work sample",
      complexity: "Moderate: strategic judgment with a small amount of quantitative reasoning.",
      estimatedTime: "90 minutes to 2 hours.",
      task: [
        `Audit a sample campaign or content funnel using ${skills}.`,
        "Identify three issues, rewrite one weak asset, and propose a test that could improve conversion or reach.",
        "Prioritize recommendations by expected impact and effort.",
      ],
      deliverables: [
        "A short audit memo or annotated campaign review.",
        "One rewritten ad, email, landing section, or content brief.",
        "A prioritized action list with metrics to monitor.",
      ],
      reviewCriteria: [
        "Recommendations are concrete and measurable.",
        "Copy or content edits match the target audience.",
        "The proposed test is realistic and tied to a clear metric.",
      ],
    };
  }

  if (
    hasAny(source, [
      "support",
      "assistant",
      "moderator",
      "crm",
      "operations",
      "customer success",
      "back office",
      "zendesk",
      "intercom",
      "hubspot",
      "salesforce",
    ])
  ) {
    return {
      category: "Operations workflow work sample",
      complexity: "Moderate: realistic queue handling and judgment without excessive volume.",
      estimatedTime: "90 minutes to 2 hours.",
      task: [
        `Process a sample queue for a ${job.title.toLowerCase()} role using ${skills}.`,
        "Triage 12 sample tickets, records, or requests into priority groups.",
        "Draft three customer-safe responses or internal notes and recommend one process improvement.",
      ],
      deliverables: [
        "A completed triage table or CRM-style notes.",
        "Three response drafts or internal updates.",
        "A short process-improvement recommendation.",
      ],
      reviewCriteria: [
        "Priorities are sensible and clearly explained.",
        "Responses are accurate, concise, and professional.",
        "The process recommendation would reduce repeat issues or manual work.",
      ],
    };
  }

  if (
    hasAny(source, [
      "writer",
      "writing",
      "editor",
      "localization",
      "translator",
      "transcript",
      "research writer",
      "grant writer",
    ])
  ) {
    return {
      category: "Writing and localization work sample",
      complexity: "Moderate: requires accuracy, tone control, and editorial judgment.",
      estimatedTime: "90 minutes to 2 hours.",
      task: [
        `Prepare a polished content sample aligned with ${skills}.`,
        "Edit or localize a 600 to 900 word source draft for clarity, accuracy, and audience fit.",
        "Add reviewer notes explaining terminology choices, factual concerns, and style-guide decisions.",
      ],
      deliverables: [
        "The edited, translated, or rewritten document.",
        "A short change log explaining the most important edits.",
        "A list of unresolved questions or assumptions.",
      ],
      reviewCriteria: [
        "Final copy is clear, accurate, and appropriate for the audience.",
        "Terminology and tone choices are consistent.",
        "Reviewer notes show careful judgment rather than surface editing only.",
      ],
    };
  }

  if (
    hasAny(source, [
      "security",
      "soc",
      "pentest",
      "vulnerability",
      "grc",
      "threat",
      "devsecops",
    ])
  ) {
    return {
      category: "Security review work sample",
      complexity: "Moderate: practical risk analysis with prioritized remediation.",
      estimatedTime: "2 hours.",
      task: [
        `Review a sample system, report, or workflow using ${skills}.`,
        "Identify five risks or findings, rate severity, and distinguish confirmed issues from assumptions.",
        "Write remediation guidance that a product or engineering team could act on.",
      ],
      deliverables: [
        "A findings table with severity, evidence, impact, and recommendation.",
        "A short executive summary for a non-security stakeholder.",
        "Any follow-up questions needed before implementation.",
      ],
      reviewCriteria: [
        "Severity ratings are proportionate and justified.",
        "Recommendations are concrete and actionable.",
        "The submission avoids overstating uncertain findings.",
      ],
    };
  }

  if (
    hasAny(source, [
      "finance",
      "bookkeeper",
      "accounting",
      "tax",
      "payroll",
      "reconciliation",
      "fp&a",
      "quickbooks",
      "xero",
    ])
  ) {
    return {
      category: "Finance operations work sample",
      complexity: "Moderate: accuracy and audit trail are more important than volume.",
      estimatedTime: "90 minutes to 2 hours.",
      task: [
        `Complete a sample finance review using ${skills}.`,
        "Reconcile a small set of transactions, identify exceptions, and prepare a client-ready summary.",
        "Explain assumptions and note any records that require follow-up.",
      ],
      deliverables: [
        "A reconciliation table or workbook.",
        "A short exception report with recommended next steps.",
        "A summary of assumptions and missing information.",
      ],
      reviewCriteria: [
        "Calculations are accurate and traceable.",
        "Exceptions are clearly separated from completed items.",
        "The summary is suitable for a client or manager.",
      ],
    };
  }

  if (
    hasAny(source, [
      "legal",
      "contract",
      "privacy",
      "ediscovery",
      "policy",
      "document reviewer",
      "compliance specialist",
    ])
  ) {
    return {
      category: "Legal and compliance review work sample",
      complexity: "Moderate: careful issue spotting without requiring legal advice.",
      estimatedTime: "2 hours.",
      task: [
        `Review a sample document set related to ${skills}.`,
        "Identify key clauses, risks, missing information, and items that need escalation.",
        "Prepare neutral reviewer notes without giving formal legal advice.",
      ],
      deliverables: [
        "An issue table with clause, concern, severity, and recommended follow-up.",
        "A short summary of the highest-priority risks.",
        "A list of assumptions and documents needed for a complete review.",
      ],
      reviewCriteria: [
        "Issues are specific and tied to the document text.",
        "Notes are neutral, professional, and appropriately caveated.",
        "Escalation items are clearly separated from routine comments.",
      ],
    };
  }

  if (
    hasAny(source, [
      "tutor",
      "education",
      "curriculum",
      "assessment",
      "instructional",
      "learning",
      "teaching",
    ])
  ) {
    return {
      category: "Education work sample",
      complexity: "Moderate: tests teaching clarity and assessment design.",
      estimatedTime: "90 minutes to 2 hours.",
      task: [
        `Create a short learning artifact using ${skills}.`,
        "Write a mini-lesson, five assessment questions, answer key, and feedback guidance for common mistakes.",
        "Make the material suitable for remote learners and explain the learning objective.",
      ],
      deliverables: [
        "A lesson outline or learner-facing explanation.",
        "Five assessment questions with answer key.",
        "Feedback notes for two common incorrect answers.",
      ],
      reviewCriteria: [
        "Learning objective is clear and matched to the assessment.",
        "Explanations are accurate and accessible.",
        "Feedback helps a learner improve rather than only marking wrong answers.",
      ],
    };
  }

  if (
    hasAny(source, [
      "product",
      "project coordinator",
      "scrum",
      "ux researcher",
      "qa coordinator",
      "workflow",
      "stakeholder",
    ])
  ) {
    return {
      category: "Product and project work sample",
      complexity: "Moderate: structured thinking with realistic prioritization.",
      estimatedTime: "2 hours.",
      task: [
        `Prepare a concise project artifact for a ${job.title.toLowerCase()} role using ${skills}.`,
        "Turn an ambiguous client request into goals, requirements, risks, milestones, and acceptance criteria.",
        "Prioritize the first delivery cycle and explain what you would defer.",
      ],
      deliverables: [
        "A one-page project brief, PRD, research plan, or delivery plan.",
        "A prioritized backlog or milestone list.",
        "A risk and dependency note with proposed mitigations.",
      ],
      reviewCriteria: [
        "The plan is realistic and easy for a team to execute.",
        "Tradeoffs and deferred items are explicit.",
        "Acceptance criteria are testable.",
      ],
    };
  }

  if (
    hasAny(source, [
      "sales",
      "lead",
      "partnership",
      "proposal",
      "outbound",
      "prospecting",
      "pipeline",
      "revenue",
    ])
  ) {
    return {
      category: "Sales and lead generation work sample",
      complexity: "Moderate: research quality and personalization matter more than list size.",
      estimatedTime: "90 minutes to 2 hours.",
      task: [
        `Build a small sales workflow sample using ${skills}.`,
        "Research eight target accounts or prospects from a provided profile, qualify each one, and write two personalized outreach messages.",
        "Explain why four prospects should be prioritized first.",
      ],
      deliverables: [
        "A prospect table with qualification notes.",
        "Two outreach drafts tailored to different prospect types.",
        "A short prioritization rationale.",
      ],
      reviewCriteria: [
        "Prospect selection follows the target profile.",
        "Outreach is specific, concise, and professional.",
        "Prioritization reflects business value and likelihood to engage.",
      ],
    };
  }

  if (
    hasAny(source, [
      "science",
      "engineering",
      "biology",
      "chemistry",
      "physics",
      "materials",
      "aerodynamics",
      "research",
      "simulation",
      "technical evaluator",
    ])
  ) {
    return {
      category: "Expert review work sample",
      complexity: "Moderate: domain reasoning and clear evidence are required, but no lab work is expected.",
      estimatedTime: "2 to 3 hours.",
      task: [
        `Review a technical scenario related to ${skills}.`,
        "Evaluate the reasoning, identify errors or unsupported claims, and write a corrected explanation.",
        "List what evidence, calculations, or references would be needed for a final expert decision.",
      ],
      deliverables: [
        "A structured expert review memo.",
        "A corrected explanation or annotated solution.",
        "A list of assumptions, evidence gaps, and quality concerns.",
      ],
      reviewCriteria: [
        "Domain reasoning is accurate and well explained.",
        "Claims are separated from assumptions.",
        "The review is understandable to both technical and operations reviewers.",
      ],
    };
  }

  return {
    category: "Role-specific work sample",
    complexity: "Moderate: complete a realistic task that shows judgment, quality, and communication.",
    estimatedTime: "90 minutes to 3 hours.",
    task: [
      `Complete a practical work sample for the ${job.title} role using ${skills}.`,
      "Review the job description, identify the expected outcome, and prepare a concise deliverable that matches the role.",
      "Include notes explaining your approach, assumptions, and how you checked quality.",
    ],
    deliverables: [
      "The completed work sample in the most relevant file format.",
      "A short notes document explaining approach, assumptions, and quality checks.",
      "Any supporting screenshots, links, or references needed for review.",
    ],
    reviewCriteria: [
      "Submission is aligned with the job description and listed skills.",
      "The work is complete, clear, and appropriately scoped.",
      "Notes make the reviewer's job easier.",
    ],
  };
}

export function buildTaskAssignment(
  application: TaskAssignmentApplication,
): TaskAssignment {
  const template = buildTemplate(application.job);
  const skills = skillLabels(application.job);

  return {
    title: `${application.job.title} Task Brief`,
    fileBaseName: `${slugify(application.job.title)}-task-brief`,
    sections: [
      {
        heading: "Candidate and role",
        lines: [
          `Candidate: ${application.candidateName}`,
          `Application ID: ${application.id}`,
          `Company: ${application.job.companyName}`,
          `Role: ${application.job.title}`,
          `Task category: ${template.category}`,
          `Required skills: ${skills.length ? skills.join(", ") : "Role-specific expertise"}`,
        ],
      },
      {
        heading: "Before you start",
        lines: [
          "Read the job description carefully and make sure your work sample matches the actual role.",
          template.complexity,
          `Estimated time: ${template.estimatedTime}`,
          application.job.payoutType === PayoutTrigger.TASK_1
            ? "This is a one-task assignment. Submit once the deliverable is complete."
            : "This assignment starts the work-review process. Additional hours may be reviewed separately when required by the role.",
        ],
      },
      {
        heading: "Task to complete",
        lines: template.task,
      },
      {
        heading: "What to submit",
        lines: template.deliverables,
      },
      {
        heading: "Review checklist",
        lines: template.reviewCriteria,
      },
      {
        heading: "After upload",
        lines: [
          "Your dashboard status will move to Pending task review after you submit.",
          "Cash is credited only after reviewers mark the completed work successful and payout eligibility is confirmed.",
          template.partnerPaymentNote ??
            "If the task involves another participant, include their name and contact details in the submission notes for operations review.",
        ],
      },
    ],
  };
}
