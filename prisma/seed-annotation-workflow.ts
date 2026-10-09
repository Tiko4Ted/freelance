import { AnnotationTaskType, Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const rubricSchema = {
  version: "1.2",
  criteria: [
    {
      id: "instruction_following",
      label: "Did the model adhere to all prompt constraints?",
      type: "boolean",
      required: true,
    },
    {
      id: "factuality",
      label: "Factual Accuracy & Hallucination Rate",
      type: "scale",
      min: 1,
      max: 5,
      labels: { "1": "Severe Hallucination", "5": "Completely Factually Sound" },
    },
    {
      id: "overall_preference",
      label: "Which response is better overall?",
      type: "categorical",
      options: [
        "model_a_much_better",
        "model_a_slightly_better",
        "tie",
        "model_b_slightly_better",
        "model_b_much_better",
      ],
      required: true,
    },
  ],
};

async function main() {
  const job = await prisma.job.findUniqueOrThrow({
    where: { title: "AI Response Quality Evaluator" },
    select: { id: true },
  });

  const project = await prisma.annotationProject.upsert({
    where: { jobId: job.id },
    update: {
      version: 2,
      description: "Side-by-side preference evaluation with hard negative constraints",
      taskType: AnnotationTaskType.SXS_PREFERENCE,
      rubricSchema,
    },
    create: {
      jobId: job.id,
      version: 2,
      description: "Side-by-side preference evaluation with hard negative constraints",
      taskType: AnnotationTaskType.SXS_PREFERENCE,
      rubricSchema,
    },
  });

  const existingTask = await prisma.annotationTask.findFirst({
    where: { projectId: project.id },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  const taskData = {
    projectId: project.id,
    systemInstruction: "You are a helpful, precise AI assistant.",
    prompt: "Write a 3-paragraph marketing copy for a running shoe. Do not use the letter 'e'.",
    constraints: [
      { type: "paragraph_count", value: 3 },
      { type: "negative_constraint", value: "e" },
    ],
    modelOutputs: {
      model_a: {
        model_id: "llama-3-70b-instruct",
        generation_config: { temperature: 0.7, top_p: 0.9 },
        text: "A sturdy light source crafted for dark room workspaces...",
      },
      model_b: {
        model_id: "mistral-large-2026",
        generation_config: { temperature: 0.5 },
        text: "An elegant table lamp engineered to provide optimal illumination...",
      },
    },
    metadata: {
      batch_id: "batch_2026_q1_04",
      source_dataset: "ifeval_extended",
      source_task_id: "660f30a1b2c3d4e5f6a7b8e1",
    },
  } satisfies Prisma.AnnotationTaskUncheckedCreateInput;

  if (existingTask) {
    await prisma.annotationTask.update({ where: { id: existingTask.id }, data: taskData });
  } else {
    await prisma.annotationTask.create({ data: taskData });
  }

  console.info("Seeded the Project Hedgehog annotation workflow.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
