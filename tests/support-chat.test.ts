import assert from "node:assert/strict";
import test from "node:test";

import { getSupportChatReply } from "../lib/support-chat";

test("support chat gives a focused payment follow-up", () => {
  const firstReply = getSupportChatReply("My payment is missing");
  const followUp = getSupportChatReply("yes", {
    lastTopic: firstReply.topic,
  });

  assert.equal(firstReply.topic, "payment");
  assert.match(firstReply.text, /balance|review|withdrawal/i);
  assert.match(followUp.text, /awaiting payment|approved|failed/i);
});

test("support chat uses project context for task questions", () => {
  const reply = getSupportChatReply("I cannot upload my work", {
    projectTitle: "Document Quality Review",
  });

  assert.equal(reply.topic, "task");
  assert.match(reply.text, /Document Quality Review/);
  assert.match(reply.text, /instructions|finish|upload/i);
});

test("serious safety messages escalate with a support action", () => {
  const reply = getSupportChatReply("Someone asked me for my verification code");

  assert.equal(reply.topic, "safety");
  assert.equal(reply.action?.href, "/help-center#contact-support");
  assert.match(reply.text, /password|verification code|support/i);
});

test("support chat avoids the old generic live-chat response", () => {
  const reply = getSupportChatReply("I am not sure what to do");

  assert.doesNotMatch(reply.text, /once live chat is connected/i);
  assert.match(reply.text, /what were you trying to do/i);
});

test("support chat continues a topic with a new, more detailed follow-up", () => {
  const firstReply = getSupportChatReply("My payment is missing");
  const firstFollowUp = getSupportChatReply("yes", {
    lastTopic: firstReply.topic,
    recentMessages: [{ from: "support", text: firstReply.text }],
  });
  const secondFollowUp = getSupportChatReply("yes", {
    lastTopic: firstFollowUp.topic,
    recentMessages: [
      { from: "support", text: firstReply.text },
      { from: "user", text: "yes" },
      { from: "support", text: firstFollowUp.text },
    ],
  });

  assert.notEqual(firstFollowUp.text, firstReply.text);
  assert.notEqual(secondFollowUp.text, firstFollowUp.text);
  assert.match(secondFollowUp.text, /wallet|withdrawal|status/i);
});

test("support chat avoids repeating an earlier generic reply", () => {
  const previousReply = getSupportChatReply("I am not sure what to do");
  const nextReply = getSupportChatReply("I am still confused", {
    recentMessages: [{ from: "support", text: previousReply.text }],
  });

  assert.notEqual(nextReply.text, previousReply.text);
  assert.match(nextReply.text, /page|action|status|feature/i);
});
