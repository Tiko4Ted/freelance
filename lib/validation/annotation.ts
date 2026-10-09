import { z } from "zod";

const rubricValueSchema = z.union([z.boolean(), z.number(), z.string()]);

export const annotationSubmissionSchema = z.object({
  evaluationData: z
    .object({
      preference: z.enum([
        "model_a_much_better",
        "model_a_slightly_better",
        "tie",
        "model_b_slightly_better",
        "model_b_much_better",
      ]),
      constraint_checks: z.record(z.record(rubricValueSchema)).optional(),
      rubric_scores: z.record(rubricValueSchema).optional(),
      justification: z.string().trim().min(10).max(5000),
    })
    .passthrough(),
  timeSpentSeconds: z.number().int().min(1).max(86_400).optional(),
});

export const annotationReviewSchema = z.object({
  grade: z.enum(["APPROVED", "REJECTED", "NEEDS_REVISION"]),
  qualityScore: z.number().int().min(1).max(5),
  feedbackText: z.string().trim().max(5000).optional().default(""),
});

export type AnnotationSubmissionInput = z.infer<
  typeof annotationSubmissionSchema
>;
export type AnnotationReviewInput = z.infer<typeof annotationReviewSchema>;
