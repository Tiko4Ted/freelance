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

function safetyReply(): SupportReply {
  return {
    action: SUPPORT_ACTION,
    text:
      "That sounds important. Please stop sharing information for now, change your password if you still have access, and send support the sender, link, and time of the incident. I will never ask for your password or verification code.",
    topic: "safety",
  };
}

function followUpReply(context: SupportChatContext): SupportReply | null {
  const message = context.lastTopic;

  if (!message) {
    return null;
  }

  if (message === "payment") {
    return {
      text:
        "Understood. What status do you see beside it: awaiting payment, approved, or failed? That will tell us whether it is still in review or needs support to investigate.",
      topic: "payment",
    };
  }

  if (message === "onboarding") {
    return {
      text:
        "Okay. Which step is holding you up—identity, phone verification, or the review after submission?",
      topic: "onboarding",
    };
  }

  if (message === "task") {
    return {
      text:
        "Got it. Is the problem with opening the instructions, completing the work, or uploading the finished file?",
      topic: "task",
    };
  }

  if (message === "application") {
    return {
      text:
        "Thanks. Is the application still pending, or are you blocked before the form can be submitted?",
      topic: "application",
    };
  }

  return null;
}

export function getSupportChatReply(
  input: string,
  context: SupportChatContext = {},
): SupportReply {
  const message = input.trim().toLowerCase();

  if (!message) {
    return {
      text: "Tell me what happened and I’ll help you narrow it down.",
    };
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
    return safetyReply();
  }

  if (includesAny(message, ["hi", "hello", "hey", "good morning", "good afternoon"])) {
    const greeting = context.userName ? `Hi ${context.userName}` : "Hi there";

    return {
      text: `${greeting} — what can I help you sort out: a task, your application, payment, or your account?`,
    };
  }

  if (includesAny(message, ["thank", "thanks", "appreciate"])) {
    return {
      text: "You’re welcome. If anything changes, send me the exact status or message you see and we can work through it.",
      topic: context.lastTopic,
    };
  }

  if (message === "yes" || message === "no" || message === "not sure") {
    return (
      followUpReply(context) ?? {
        text: "No problem. Tell me a little more about what you’re seeing and I’ll point you to the right next step.",
      }
    );
  }

  if (includesAny(message, ["pay", "paid", "payout", "wallet", "balance", "withdraw"])) {
    return {
      text:
        "I can help with that. Is this about a balance that has not updated, a payment still under review, or a withdrawal that failed?",
      topic: "payment",
    };
  }

  if (includesAny(message, ["onboard", "identity", "phone verify", "verification", "review"])) {
    return {
      text:
        "Let’s narrow it down. Are you stuck on identity details, phone verification, or the review after onboarding was submitted?",
      topic: "onboarding",
    };
  }

  if (includesAny(message, ["task", "instruction", "upload", "submit", "file", "brief", "project work"])) {
    const projectNote = context.projectTitle
      ? ` for ${context.projectTitle}`
      : "";

    return {
      text: `I can help with the work${projectNote}. Are you trying to open the instructions, finish the task, or upload your completed file?`,
      topic: "task",
    };
  }

  if (includesAny(message, ["apply", "application", "pending", "role", "job", "accepted"])) {
    return {
      text:
        "I can check the application path with you. Is it pending review, or did something stop you from submitting it?",
      topic: "application",
    };
  }

  if (includesAny(message, ["refer", "referral", "invite", "invited"])) {
    return {
      text:
        "Referral credit is recorded when someone joins through your link. The bonus only becomes qualified after they complete eligible paid work. Are you asking about the link or the count on your referrals page?",
      topic: "referral",
    };
  }

  if (includesAny(message, ["login", "sign in", "password", "account", "email"])) {
    return {
      text:
        "If you cannot sign in, use the same email you registered with and avoid creating a second account. What happens when you try—wrong credentials, an unverified email, or a page error?",
      topic: "account",
    };
  }

  return {
    text:
      "I can help with that. What were you trying to do, and what did you see instead? A short error message or status is enough.",
    topic: context.lastTopic,
  };
}
