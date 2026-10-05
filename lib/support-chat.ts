export type SupportChatAction = {
  href: string;
  label: string;
};

export type SupportChatMessage = {
  action?: SupportChatAction;
  from: "support" | "user";
  text: string;
};

type SupportChatContext = {
  lastTopic?: SupportTopic;
  projectTitle?: string;
  recentMessages?: SupportChatMessage[];
  userName?: string;
};

export type SupportTopic =
  | "account"
  | "application"
  | "onboarding"
  | "payment"
  | "referral"
  | "safety"
  | "task";

type SupportReply = {
  action?: SupportChatAction;
  text: string;
  topic?: SupportTopic;
};

const SUPPORT_ACTION: SupportChatAction = {
  href: "/help-center#contact-support",
  label: "Contact support",
};

function includesAny(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term));
}

function pickText(options: string[], context: SupportChatContext) {
  const previousReplies = new Set(
    (context.recentMessages ?? [])
      .filter((message) => message.from === "support")
      .map((message) => message.text.trim().toLowerCase()),
  );
  const freshOption = options.find(
    (option) => !previousReplies.has(option.trim().toLowerCase()),
  );

  if (freshOption) {
    return freshOption;
  }

  const supportReplyCount = (context.recentMessages ?? []).filter(
    (message) => message.from === "support",
  ).length;

  return `${options[supportReplyCount % options.length]} Tell me what changed on your latest attempt so I can take the next step with you.`;
}

function textReply(
  options: string[],
  context: SupportChatContext,
  topic?: SupportTopic,
): SupportReply {
  return {
    text: pickText(options, context),
    topic,
  };
}

function safetyReply(context: SupportChatContext): SupportReply {
  return {
    action: SUPPORT_ACTION,
    text: pickText(
      [
        "That sounds important. Please stop sharing information for now, change your password if you still have access, and contact support with the sender, link, and time of the incident. I will never ask for your password or verification code.",
        "Please pause the conversation with that person and do not send any more codes, documents, or payment details. Secure your account, save the message as evidence, and use the support link below so the team can investigate the sender and timeline.",
        "Treat this as a security concern. Do not click further links or approve a payment; change your password, keep the suspicious message, and tell support exactly what was requested and when it happened.",
      ],
      context,
    ),
    topic: "safety",
  };
}

function followUpReply(context: SupportChatContext): SupportReply | null {
  const topic = context.lastTopic;

  if (!topic) {
    return null;
  }

  if (topic === "payment") {
    return textReply(
      [
        "Understood. What status do you see beside it: awaiting payment, approved, or failed? That tells us whether it is still in review or needs support to investigate.",
        "Thanks, that helps. Please check the payment or withdrawal history and tell me the latest status, amount, and date shown there. An approved status with no balance change needs a different check from a failed request.",
        "Let us trace it one step further. Is the amount missing from your wallet, still waiting in the withdrawal list, or showing an error? Please share the exact status wording, but never send passwords or verification codes.",
      ],
      context,
      "payment",
    );
  }

  if (topic === "onboarding") {
    return textReply(
      [
        "Which step is holding you up - identity, phone verification, or the review after submission? Tell me the step name and the exact message on screen.",
        "Let us continue from there. Did the issue happen while selecting documents, entering your phone code, or waiting for the review to finish? I can point you to the right next action once I know which stage stopped.",
        "Check whether the page says the information is invalid, the code expired, or the review is still pending. Those statuses mean different things, so send me only the status wording and not the document or code itself.",
      ],
      context,
      "onboarding",
    );
  }

  if (topic === "task") {
    return textReply(
      [
        "Is the problem with opening the instructions, completing the work, or uploading the finished file? Tell me what you tried and where it stopped.",
        "I can help you get the task unstuck. Are you missing the brief, unsure what the deliverable should contain, or seeing an upload error? The task title and error text are enough - do not include private client data.",
        "Let us separate the work issue from the submission issue. Can you open the project, save the finished file in the requested format, and see the upload control? Tell me which of those three steps fails.",
      ],
      context,
      "task",
    );
  }

  if (topic === "application") {
    return textReply(
      [
        "Is the application still pending, or are you blocked before the form can be submitted? If there is an error, send its wording and the step where it appeared.",
        "Let us check the application stage. Does it appear in your applications list, show as pending review, or disappear before submission completes? That will tell us whether this is a status delay or a form problem.",
        "I can help trace that application. Tell me the role or project title, whether you reached the confirmation screen, and the latest status you can see. Please leave out passwords and identity documents.",
      ],
      context,
      "application",
    );
  }

  return null;
}

export function getSupportChatReply(
  input: string,
  context: SupportChatContext = {},
): SupportReply {
  const message = input.trim().toLowerCase();

  if (!message) {
    return textReply(
      [
        "Tell me what happened and I will help you narrow it down. Include the page or feature, the last action you took, and the exact status or error you saw.",
        "I am ready to work through it with you. Start with what you were trying to do, what happened instead, and whether the issue is still happening now.",
      ],
      context,
    );
  }

  if (
    includesAny(message, [
      "hack",
      "scam",
      "fraud",
      "phish",
      "stolen",
      "unauthorized",
      "someone accessed",
      "verification code",
      "password shared",
      "bank details",
      "money missing",
      "suspicious",
    ])
  ) {
    return safetyReply(context);
  }

  if (includesAny(message, ["hi", "hello", "hey", "good morning", "good afternoon"])) {
    const greeting = context.userName ? `Hi ${context.userName}` : "Hi there";

    return textReply(
      [
        `${greeting} - what can I help you sort out today: a task, application, payment, or account issue? Tell me what you expected to happen and what you saw instead.`,
        `${greeting}. I can stay with you while we work through the problem. Which part should we start with - onboarding, a project, an application, a payment, or signing in?`,
      ],
      context,
    );
  }

  if (includesAny(message, ["thank", "thanks", "appreciate"])) {
    return textReply(
      [
        "You are welcome. If anything changes, send me the exact status or message you see and we can work through the next step together.",
        "You are welcome. Keep the page or status handy, and come back with the latest wording if the problem continues. I will use that update instead of starting over.",
      ],
      context,
      context.lastTopic,
    );
  }

  if (message === "yes" || message === "no" || message === "not sure") {
    return (
      followUpReply(context) ??
      textReply(
        [
          "No problem. Tell me a little more about what you are seeing and I will point you to the right next step.",
          "That is okay. Give me the last action you took and the message or status that followed, and I will help you narrow it down.",
        ],
        context,
      )
    );
  }

  if (includesAny(message, ["pay", "paid", "payout", "wallet", "balance", "withdraw"])) {
    return textReply(
      [
        "I can help trace that. Is it a balance that has not updated, a payment still under review, or a withdrawal that failed? Share the status, amount, and date shown in the app - never share account secrets.",
        "Let us narrow down the payment issue before taking action. Is the money missing from your wallet, waiting in a withdrawal, or marked failed? The exact status and date will help me choose the right next step.",
        "I can stay with this until we identify the handoff point. Tell me whether the payment was expected from a completed project, a wallet balance, or a withdrawal request, and what status you see now.",
      ],
      context,
      "payment",
    );
  }

  if (includesAny(message, ["onboard", "identity", "phone verify", "verification", "review"])) {
    return textReply(
      [
        "Let us narrow it down. Are you stuck on identity details, phone verification, or the review after onboarding was submitted? Tell me the exact status and I will explain the next step.",
        "I can help with the onboarding handoff. Which screen are you on, what did you submit or enter, and did the app show an error, an expired code, or a pending review?",
        "For privacy, do not paste your identity document or verification code here. Just tell me the step name and the message shown after you tried it.",
      ],
      context,
      "onboarding",
    );
  }

  if (includesAny(message, ["task", "instruction", "upload", "submit", "file", "brief", "project work"])) {
    const projectNote = context.projectTitle ? ` for ${context.projectTitle}` : "";

    return textReply(
      [
        `I can help with the work${projectNote}. Are you trying to open the instructions, finish the task, or upload your completed file? Tell me where the process stops and I will take it one step at a time.`,
        `Let us get${projectNote} moving. Do you need clarification on the brief, help checking the deliverable, or help with the upload? Share the non-sensitive error text if there is one.`,
        `I can guide you through${projectNote}. First tell me whether the issue is access, understanding the instructions, completing the work, or submitting the file.`,
      ],
      context,
      "task",
    );
  }

  if (includesAny(message, ["apply", "application", "pending", "role", "job", "accepted"])) {
    return textReply(
      [
        "I can check the application path with you. Is it pending review, or did something stop you from submitting it? Include the role name and exact status if you have them.",
        "Let us locate the point where it stopped. Did you finish the form and see a confirmation, or are you still blocked by a required field or page error?",
        "Tell me whether the application is missing, pending, approved, or rejected, and what you expected to happen next. I will explain the meaning of that state before suggesting an action.",
      ],
      context,
      "application",
    );
  }

  if (includesAny(message, ["refer", "referral", "invite", "invited"])) {
    return textReply(
      [
        "Referral credit is recorded when someone joins through your link, and the bonus becomes qualified only after eligible paid work. Are you asking about the link, the person status, or the count on your referrals page?",
        "I can help trace the referral. Tell me whether the link was opened, whether the person registered, or whether the completed work has not appeared yet. Each stage is tracked differently.",
        "Referral progress can take more than one step: link attribution, registration, eligible work, and payout qualification. Which of those stages is not matching what you expected?",
      ],
      context,
      "referral",
    );
  }

  if (includesAny(message, ["login", "sign in", "password", "account", "email"])) {
    return textReply(
      [
        "If you cannot sign in, use the same email you registered with and avoid creating a second account. What happens when you try - wrong credentials, an unverified email, or a page error?",
        "Let us separate the sign-in problem from the account status. Have you verified your email, are you using the original registration address, and what exact message appears after submitting the form?",
        "For account safety, do not send your password here. Tell me whether the issue is the email, password, verification link, or a page that fails to load, and I will guide the next check.",
      ],
      context,
      "account",
    );
  }

  return textReply(
    [
      "I can help with that. What were you trying to do, and what did you see instead? A short error message or status is enough, and I will keep the next reply focused on that step.",
      "Let us work from the last action rather than guessing. Tell me the page, the action you took, and the result you expected compared with what actually happened.",
      "I need one more detail to point you correctly: is this about access, onboarding, a task, an application, payment, or a referral? Add the exact message if the app displayed one.",
    ],
    context,
    context.lastTopic,
  );
}
