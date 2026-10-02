import { PayoutTrigger } from "@prisma/client";

export type TaskAssignmentJob = {
  title: string;
  description: string;
  companyName: string;
  payoutType: PayoutTrigger;
  showOnHome?: boolean;
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
  taskPacket?: string[];
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

function buildHomeProjectTask(job: TaskAssignmentJob): TaskTemplate | null {
  if (!job.showOnHome) {
    return null;
  }

  if (job.title === "Image Tagging & Classification Assistant") {
    return {
      category: "Image labeling task packet",
      complexity:
        "Accessible: the packet is text-based and uses a fixed label set, so careful observation and consistent decisions matter more than specialist knowledge.",
      estimatedTime: "60 to 90 minutes including labeling, quality check, and upload.",
      task: [
        "Complete every item in the image packet below. Create one output row per item and do not skip uncertain cases.",
        "Choose exactly one primary label from the allowed list. Add secondary labels only when the description clearly supports them.",
        "Use confidence High, Medium, or Low and explain every Low-confidence decision in the notes column.",
      ],
      taskPacket: [
        "Allowed primary labels: person, vehicle, animal, food, furniture, electronics, document, sign, building, outdoor scene.",
        "IMG-001: A red bicycle leans against a brick wall beside a sidewalk; no person is visible.",
        "IMG-002: One person holds a paper map beside a parked blue car at a roadside pull-off.",
        "IMG-003: A dining table has a bowl of oranges, a ceramic mug, and a folded newspaper.",
        "IMG-004: A laptop is open on a wooden desk beside a phone and a pair of headphones.",
        "IMG-005: A dog is sitting on a rug next to a low fabric sofa in a living room.",
        "IMG-006: A storefront has a large green sign reading 'MART' above its entrance.",
        "IMG-007: A delivery van is stopped in front of a warehouse with a loading bay.",
        "IMG-008: A stack of printed forms and an identity card sits on a white office desk.",
        "IMG-009: Two people stand under umbrellas on a paved city square after rain.",
        "IMG-010: A microwave, kettle, and toaster are arranged on a kitchen counter.",
        "IMG-011: A red apple is on a plate beside a knife and a folded napkin.",
        "IMG-012: A small concrete building is surrounded by grass, trees, and a gravel path.",
      ],
      deliverables: [
        "A CSV or spreadsheet with columns: item_id, primary_label, secondary_labels, confidence, notes.",
        "A short quality note naming any item where the description supported more than one reasonable label.",
        "The final filename or upload reference needed for reviewer evaluation.",
      ],
      reviewCriteria: [
        "Every packet item has exactly one primary label.",
        "Labels follow the allowed list and secondary labels are supported by the source description.",
        "Confidence and uncertainty notes are used consistently.",
      ],
    };
  }

  if (job.title === "Audio Transcription & Timestamping Assistant") {
    return {
      category: "Audio transcription task packet",
      complexity:
        "Accessible: the packet contains a short two-speaker recording script, and the main requirements are accurate wording, timestamps, and speaker changes.",
      estimatedTime: "90 minutes to 2 hours including transcription, quality check, and upload.",
      task: [
        "Create a timestamped transcript from the audio packet below. Use timestamps at the start of every speaker turn.",
        "Use Speaker 1 and Speaker 2 consistently, preserve meaningful words and numbers, and mark an unclear word as [inaudible] instead of guessing.",
        "Add a final quality note with the total number of speaker turns and any wording that needs reviewer confirmation.",
      ],
      taskPacket: [
        "Recording A-01 source, duration 00:54. Use the source turns below to produce the transcript deliverable.",
        "[00:00] Speaker 1: I moved the delivery review to Thursday morning so the team has one more day to check the files.",
        "[00:07] Speaker 2: That works for me. Should the checklist include the missing invoice numbers from last week?",
        "[00:14] Speaker 1: Yes, include them in a separate column and mark the three records that still need confirmation.",
        "[00:21] Speaker 2: I found two duplicate customer names, but the order numbers are different.",
        "[00:28] Speaker 1: Keep both rows for now and add a note explaining why they were not merged.",
        "[00:35] Speaker 2: Understood. I will finish the first pass today and upload the spreadsheet before five.",
        "[00:43] Speaker 1: Please include the file version in the submission note so the reviewer can compare changes.",
        "[00:50] Speaker 2: I will. I am starting with the records that have the clearest source documents.",
      ],
      deliverables: [
        "A TXT, DOCX, or CSV transcript with columns or lines for timestamp, speaker, and transcript text.",
        "A quality note with total speaker turns, any unclear wording, and the final duration recorded as 00:54.",
        "The final filename or upload reference needed for evaluation.",
      ],
      reviewCriteria: [
        "All eight speaker turns are present and ordered correctly.",
        "Timestamps appear at the start of each turn and speaker labels do not change mid-conversation.",
        "Numbers, punctuation, and the required quality note are accurate.",
      ],
    };
  }

  if (job.title === "Document Data Entry & Quality Check Assistant") {
    return {
      category: "Document data-entry task packet",
      complexity:
        "Accessible: the packet uses a fixed schema and short source records; accuracy, formatting, and clearly flagged exceptions are the main requirements.",
      estimatedTime: "60 to 90 minutes including entry, quality check, and upload.",
      task: [
        "Transfer every source record from the document packet below into the required output columns without changing the source values.",
        "Use ISO dates (YYYY-MM-DD), numbers without currency symbols in the amount column, and the status values Paid, Pending, or Review.",
        "Do not invent missing information. Leave the field blank and explain the exception in the notes column.",
      ],
      taskPacket: [
        "Output columns: record_id, supplier, invoice_date, amount_usd, status, source_issue, notes.",
        "DOC-001 | Kijani Office Supply | 2026-08-04 | 248.50 | Paid",
        "DOC-002 | Northstar Couriers | 2026-08-07 | 91.00 | Pending",
        "DOC-003 | Mwezi Foods | 2026-08-08 | 1,420.75 | Paid",
        "DOC-004 | Blue Harbor Printing | 2026-08-11 | 365.00 | Review | invoice date is partially unreadable in the source",
        "DOC-005 | Atlas Safety Services | 2026-08-13 | 780.00 | Pending",
        "DOC-006 | Greenline Internet | 2026-08-15 | 129.99 | Paid",
        "DOC-007 | Kipepeo Cleaning | 2026-08-18 | 210.00 | Review | supplier name appears as 'Kipepeo Clean.' on the source",
        "DOC-008 | Umoja Furniture | 2026-08-20 | 1,050.00 | Paid",
        "DOC-009 | East Ridge Repairs | 2026-08-22 | 64.25 | Pending",
        "DOC-010 | Sunrise Water | 2026-08-25 | 87.50 | Review | amount is shown as '87.5' and must be normalized to two decimals",
      ],
      deliverables: [
        "A CSV or spreadsheet containing all ten records and the required output columns.",
        "A quality note identifying DOC-004, DOC-007, and DOC-010 and explaining how each exception was handled.",
        "The final filename or upload reference needed for reviewer evaluation.",
      ],
      reviewCriteria: [
        "All ten records are present and amounts are copied without arithmetic changes.",
        "Dates, status values, and output columns follow the required format.",
        "Unreadable or inconsistent source details are flagged rather than silently corrected.",
      ],
    };
  }

  return null;
}

function buildTemplate(job: TaskAssignmentJob): TaskTemplate {
  const homeProjectTask = buildHomeProjectTask(job);

  if (homeProjectTask) {
    return homeProjectTask;
  }

  const source = searchableText(job);
  const skills = sentenceList(skillLabels(job).slice(0, 4));

  if (
    hasAny(source, [
      "image tagging",
      "image classification",
      "image labeling",
      "object classification",
    ])
  ) {
    return {
      category: "Image labeling work sample",
      complexity:
        "Accessible: no specialist background is required, but careful reading and consistent labels matter throughout the packet.",
      estimatedTime: "60 to 90 minutes including download, labeling, quality check, and upload.",
      task: [
        "Download the image packet, labeling guide, and submission template.",
        "Tag the objects and scenes shown in each image using only the labels allowed by the guide.",
        "Review uncertain images against the examples and flag anything the instructions do not cover.",
        "Check that every image has a label and that the completed file is ready to upload for evaluation.",
      ],
      deliverables: [
        "The completed image-label table or annotation file in the supplied format.",
        "A short note listing any unclear examples or instruction questions.",
        "The final filename or upload reference needed for reviewer evaluation.",
      ],
      reviewCriteria: [
        "Labels match the written guide and examples.",
        "No images or required fields are missing.",
        "Unclear cases are flagged instead of guessed.",
      ],
    };
  }

  if (
    hasAny(source, [
      "transcription",
      "timestamping",
      "speaker labels",
    ])
  ) {
    return {
      category: "Audio transcription work sample",
      complexity:
        "Accessible: the task uses short recordings and a clear style guide; accuracy and careful listening are the main requirements.",
      estimatedTime: "90 minutes to 2 hours including download, transcription, quality check, and upload.",
      task: [
        "Download the audio packet, transcription guide, and transcript template.",
        "Type the spoken words accurately, add timestamps at the required intervals, and apply speaker labels from the guide.",
        "Mark unclear words using the approved notation instead of inventing a guess.",
        "Play back the recording while checking the completed transcript before uploading it for evaluation.",
      ],
      deliverables: [
        "The completed transcript with timestamps and speaker labels.",
        "A short quality note listing any unclear audio or sections that need reviewer attention.",
        "The final filename or upload reference needed for evaluation.",
      ],
      reviewCriteria: [
        "The transcript follows the supplied style and timestamp rules.",
        "Speaker changes and unclear audio are marked consistently.",
        "The uploaded file opens correctly and covers the full recording.",
      ],
    };
  }

  if (
    hasAny(source, [
      "data entry",
      "document data",
      "document review",
      "spreadsheet basics",
      "quality checking",
    ])
  ) {
    return {
      category: "Document data entry work sample",
      complexity:
        "Accessible: the work is guided by a template and examples, with accuracy and repeatable checking more important than specialist knowledge.",
      estimatedTime: "60 to 90 minutes including download, entry, quality check, and upload.",
      task: [
        "Download the document packet, data-entry guide, and spreadsheet template.",
        "Copy the requested fields from each source document into the matching template columns.",
        "Compare each entry against the source, correct formatting issues, and flag missing or unreadable information.",
        "Run a final row-by-row check before uploading the completed workbook for evaluation.",
      ],
      deliverables: [
        "The completed spreadsheet or CSV in the supplied format.",
        "A short quality note listing missing fields, unreadable documents, or corrected issues.",
        "The final filename or upload reference needed for reviewer evaluation.",
      ],
      reviewCriteria: [
        "Required fields are copied accurately from the source documents.",
        "Formatting and missing-value rules are followed consistently.",
        "The uploaded file opens correctly and includes all assigned rows.",
      ],
    };
  }

  if (
    hasAny(source, [
      "audio",
      "voice",
      "recording",
      "podcast",
      "subtitle",
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
        "Download the task brief and supplied response packet before starting.",
        `Evaluate eight short model responses related to ${skills}.`,
        "Rank each response for accuracy, instruction following, clarity, and safety.",
        "Write a compact rubric with four scoring levels and apply it consistently.",
        "Flag ambiguous cases and explain what evidence would improve confidence.",
        "Check the scorecard and rubric for completeness before uploading them for evaluation.",
      ],
      deliverables: [
        "An uploaded scoring table for all eight responses.",
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
      ...(template.taskPacket?.length
        ? [{ heading: "Task packet", lines: template.taskPacket }]
        : []),
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
          "Your home page status will move to Pending task review after you submit.",
          "Cash is credited only after reviewers mark the completed work successful and payout eligibility is confirmed.",
          template.partnerPaymentNote ??
            "If the task involves another participant, include their name and contact details in the submission notes for operations review.",
        ],
      },
    ],
  };
}
