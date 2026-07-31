import type { PublicJobView } from "@/lib/services/job-service";

type JobDetailCopy = {
  intro: string;
  scope: string[];
  qualifications: string[];
  note?: string;
};

function getSkillLabels(job: PublicJobView) {
  return job.skills.map((skill) => skill.label);
}

function getPrimarySkill(job: PublicJobView) {
  return getSkillLabels(job)[0] ?? "domain expertise";
}

function isAudioRole(job: PublicJobView) {
  const searchable = [job.title, ...getSkillLabels(job)].join(" ").toLowerCase();
  return searchable.includes("audio") || searchable.includes("voice");
}

function isCrmOperationsRole(job: PublicJobView) {
  return job.title.toLowerCase().includes("crm operations specialist");
}

function sentenceList(items: string[]) {
  if (!items.length) {
    return "relevant domain tools and workflows";
  }

  if (items.length === 1) {
    return items[0].toLowerCase();
  }

  const normalized = items.map((item) => item.toLowerCase());
  return `${normalized.slice(0, -1).join(", ")}, and ${
    normalized[normalized.length - 1]
  }`;
}

export function buildJobDetailCopy(job: PublicJobView): JobDetailCopy {
  const primarySkill = getPrimarySkill(job);
  const skillSummary = sentenceList(getSkillLabels(job).slice(0, 4));

  if (isCrmOperationsRole(job)) {
    return {
      intro:
        "micro1 is engaging CRM Operations Specialists to support a customer's project focused on optimizing sales and customer relationship management processes. In this role, you'll apply your expertise to help train next-generation AI systems. Your work will shape how models learn, reason, and perform through high-quality, real-world input. No prior experience in AI is required - your domain knowledge is what matters. This is an opportunity to leverage your CRM operations skills and deep knowledge of platforms like Salesforce and HubSpot, directly impacting the way leading organizations manage and grow customer relationships.",
      scope: [
        "Evaluate and provide input on CRM workflows, sales processes, and automation logic using Salesforce, HubSpot, and other leading platforms.",
        "Document current sales operations practices, identifying pain points and opportunities for process improvement.",
        "Contribute real-world examples, scenarios, and feedback reflecting best practices in CRM operations and sales enablement.",
        "Review, analyze, and annotate CRM data, records, and user interactions to support AI training objectives.",
        "Assess and validate AI system outputs for accuracy and alignment with actual sales operations.",
        "Collaborate on content generation and review for documentation, training materials, and process guides related to CRM tools.",
      ],
      qualifications: [
        "3+ years of hands-on experience in CRM and sales operations, with demonstrated expertise in Salesforce and HubSpot.",
        "Proficiency with additional platforms such as Close, Apollo, Salesloft, Intercom, Freshdesk, Shopify, Crayon, or Funnel is highly valued.",
        "Track record of optimizing sales processes, implementing automations, and managing CRM data integrity.",
        "Strong analytical and process-mapping abilities, with a detail-oriented approach to complex business workflows.",
        "Effective written and verbal communication skills to deliver clear documentation and actionable feedback.",
        "Experience providing feedback or training in process improvement or software implementation contexts is a plus.",
        "No formal degree required; practical expertise and platform fluency are the primary criteria.",
      ],
    };
  }

  if (isAudioRole(job)) {
    return {
      intro: `micro1 is engaging ${job.title} to contribute their advanced skills to a dynamic customer project. In this role, you'll apply your expertise to help train next-generation AI systems. Your work will shape how models learn, reason, and perform through high-quality, real-world input. No prior experience in AI is required - your domain knowledge is what matters. We seek professionals with a strong background in recording professional-grade audio, preferably with experience delivering content for linguistics, voice technology, or media production purposes. This opportunity is ideal for specialists who take pride in the precision, clarity, and authenticity of their delivered recordings and who thrive in remote, results-driven project environments.`,
      scope: [
        `Record high-quality audio samples using professional-grade equipment, adhering to specified guidelines and standards.`,
        `Deliver clear, authentic voice recordings across a range of prompts and scenarios to ensure coverage of diverse linguistic data.`,
        `Participate in a sample submission process, providing an audio sample that demonstrates your expertise and equipment capabilities.`,
        `Collaborate closely via written and verbal communication to clarify requirements and implement feedback on recordings.`,
        `Ensure all deliverables meet project specifications for clarity, accuracy, and format.`,
        `Document recording processes and provide insight into best practices for capturing natural, high-fidelity speech.`,
        `Engage with the project team to resolve queries and contribute subject-matter knowledge where needed.`,
      ],
      qualifications: [
        `Native-level language proficiency, with an authentic accent and excellent fluency where language expertise is required.`,
        `At least three years of hands-on experience in professional audio recording, preferably in voice, broadcast, or content production domains.`,
        `Demonstrable access to and expertise in using professional audio recording equipment, including studio microphones, soundproofing, or audio editing tools.`,
        `Strong attention to detail and a commitment to producing accurate, high-quality recordings.`,
        `Ability to communicate clearly and efficiently in both written and spoken forms.`,
        `Experience working on remote projects or in distributed teams, maintaining accountability and timely delivery of audio assets.`,
        `Familiarity with best practices in audio file management, labeling, and secure digital transfer.`,
      ],
      note:
        "Please note that you will need your professional audio equipment during the interview.",
    };
  }

  return {
    intro: `micro1 is engaging ${job.title} to contribute advanced ${primarySkill.toLowerCase()} expertise to a dynamic customer project. In this role, you'll apply your expertise to help train next-generation AI systems. Your work will shape how models learn, reason, and perform through high-quality, real-world input. No prior experience in AI is required - your domain knowledge is what matters. We seek professionals with a strong background in ${skillSummary}, preferably with experience delivering precise, well-reasoned work in remote, results-driven project environments.`,
    scope: [
      `Review project guidelines and complete domain-specific tasks with careful attention to accuracy, clarity, and completeness.`,
      `Apply expertise in ${skillSummary} to evaluate prompts, outputs, examples, or deliverables for a customer project.`,
      `Produce clear written feedback that explains reasoning, flags issues, and supports consistent quality standards.`,
      `Collaborate remotely with project coordinators and respond to feedback or clarification requests as needed.`,
      `Validate work against provided rubrics, formatting requirements, and domain-specific acceptance criteria.`,
      `Document edge cases, assumptions, and quality concerns so the project team can improve task instructions over time.`,
      `Meet agreed project deliverables and timelines while maintaining a high standard of professional judgment.`,
    ],
    qualifications: [
      `Demonstrated professional experience or advanced knowledge in ${primarySkill.toLowerCase()} or a closely related field.`,
      `Strong command of ${skillSummary}, with the ability to apply that knowledge to ambiguous real-world tasks.`,
      `Excellent written communication skills and the ability to explain complex decisions clearly.`,
      `Strong attention to detail and a commitment to producing accurate, high-quality work.`,
      `Ability to follow nuanced project instructions and adapt to feedback from a distributed team.`,
      `Experience working independently in remote, deadline-driven environments.`,
      `Familiarity with quality assurance workflows, structured review, or technical documentation is preferred.`,
    ],
  };
}
