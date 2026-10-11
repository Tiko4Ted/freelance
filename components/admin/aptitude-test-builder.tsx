"use client";

import { useState } from "react";

type Option = { id: string; label: string };
type Question = { id: string; prompt: string; options: Option[]; correctOptionId: string };

const DEFAULT_PROMPTS = [
  "Which action best follows the project brief before work begins?",
  "What should you do when a requirement is unclear?",
  "Which evidence is strongest for a quality decision?",
  "How should you handle a hard-negative example?",
  "What belongs in a concise reviewer note?",
  "Which response is safest when the image does not prove a claim?",
  "What should you check before uploading a deliverable?",
  "How should confidential project material be handled?",
  "When should a case be escalated?",
  "What is the best way to resolve conflicting instructions?",
  "Which behavior improves consistency across a batch?",
  "What should a correction explain?",
  "How should low-quality source images affect a judgment?",
  "What makes a final answer reviewable?",
  "When is an answer ready to submit?",
];

function makeQuestions(): Question[] {
  return DEFAULT_PROMPTS.map((prompt, index) => ({
    id: `question-${index + 1}`,
    prompt,
    options: [
      { id: "a", label: "Follow the written acceptance criteria and record the evidence" },
      { id: "b", label: "Guess quickly and omit anything uncertain" },
      { id: "c", label: "Use an unrelated example from another project" },
      { id: "d", label: "Submit without checking the required fields" },
    ],
    correctOptionId: "a",
  }));
}

function updateQuestion(
  questions: Question[],
  index: number,
  update: (question: Question) => Question,
) {
  return questions.map((question, questionIndex) =>
    questionIndex === index ? update(question) : question,
  );
}

export function AptitudeTestBuilder() {
  const [passingCorrect, setPassingCorrect] = useState(12);
  const [questions, setQuestions] = useState(makeQuestions);

  function setPrompt(index: number, prompt: string) {
    setQuestions((current) => updateQuestion(current, index, (question) => ({ ...question, prompt })));
  }

  function setOption(index: number, optionIndex: number, label: string) {
    setQuestions((current) =>
      updateQuestion(current, index, (question) => ({
        ...question,
        options: question.options.map((option, currentOptionIndex) =>
          currentOptionIndex === optionIndex ? { ...option, label } : option,
        ),
      })),
    );
  }

  function setCorrectOption(index: number, correctOptionId: string) {
    setQuestions((current) => updateQuestion(current, index, (question) => ({ ...question, correctOptionId })));
  }

  const definition = JSON.stringify({ passingCorrect, questions });

  return (
    <section className="rounded-2xl border border-brand-sand bg-brand-canvas/55 p-4 sm:p-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-gold-strong">
            Aptitude gate
          </p>
          <h3 className="mt-1 text-base font-semibold text-brand-ink">Set the project test</h3>
          <p className="mt-1 text-xs leading-5 text-brand-muted">
            Workers must answer at least the passing score. Each question has four choices and one correct answer.
          </p>
        </div>
        <label className="grid gap-1 text-xs font-semibold text-brand-muted">
          Passing score
          <input
            className="h-10 w-28 rounded-lg border border-brand-sand bg-brand-ivory px-3 text-sm text-brand-ink outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
            max={15}
            min={1}
            onChange={(event) => setPassingCorrect(Number(event.target.value))}
            type="number"
            value={passingCorrect}
          />
        </label>
      </div>
      <input name="aptitudeTest" type="hidden" value={definition} />
      <div className="mt-5 space-y-3">
        {questions.map((question, questionIndex) => (
          <details className="rounded-xl border border-brand-sand bg-brand-ivory p-3" key={question.id} open={questionIndex === 0}>
            <summary className="cursor-pointer text-sm font-semibold text-brand-ink">
              Question {questionIndex + 1}
            </summary>
            <div className="mt-3 space-y-3">
              <label className="grid gap-1 text-xs font-semibold text-brand-muted">
                Prompt
                <textarea
                  className="min-h-16 rounded-lg border border-brand-sand bg-brand-canvas/50 px-3 py-2 text-sm font-normal text-brand-ink outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
                  onChange={(event) => setPrompt(questionIndex, event.target.value)}
                  value={question.prompt}
                />
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                {question.options.map((option, optionIndex) => (
                  <label className="grid gap-1 text-xs font-semibold text-brand-muted" key={option.id}>
                    Option {option.id.toUpperCase()}
                    <input
                      className="h-10 rounded-lg border border-brand-sand bg-brand-canvas/50 px-3 text-sm font-normal text-brand-ink outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
                      onChange={(event) => setOption(questionIndex, optionIndex, event.target.value)}
                      value={option.label}
                    />
                  </label>
                ))}
              </div>
              <label className="grid max-w-48 gap-1 text-xs font-semibold text-brand-muted">
                Correct option
                <select
                  className="h-10 rounded-lg border border-brand-sand bg-brand-canvas/50 px-3 text-sm text-brand-ink outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold"
                  onChange={(event) => setCorrectOption(questionIndex, event.target.value)}
                  value={question.correctOptionId}
                >
                  {question.options.map((option) => (
                    <option key={option.id} value={option.id}>{option.id.toUpperCase()}</option>
                  ))}
                </select>
              </label>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
