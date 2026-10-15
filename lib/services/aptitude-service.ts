import { Prisma } from "@prisma/client";
import { randomInt } from "node:crypto";

import {
  APTITUDE_MIN_CORRECT_ANSWERS,
  buildAptitudeTest,
  getAptitudeTestVersions,
  type AptitudeJob,
} from "@/lib/aptitude-test";
import { prisma } from "@/lib/db/prisma";

export const APTITUDE_MAX_ATTEMPTS = 3;
export const APTITUDE_RETRY_DELAY_HOURS = 72;
export const APTITUDE_RETRY_DELAY_MS = APTITUDE_RETRY_DELAY_HOURS * 60 * 60 * 1_000;

export class AptitudeGateError extends Error {
  constructor(
    public readonly code:
      | "APTITUDE_ALREADY_PASSED"
      | "APTITUDE_ATTEMPTS_EXHAUSTED"
      | "APTITUDE_RETRY_NOT_AVAILABLE",
    public readonly retryAvailableAt?: Date,
  ) {
    super(code);
  }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isRetryableTransactionError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2034" || error.code === "P2002")
  );
}

type AptitudeApplicant = { id: string; email: string };

const jobSelect = {
  id: true,
  title: true,
  description: true,
  payoutType: true,
  aptitudeTest: true,
  skills: { select: { label: true } },
} as const;

function asAptitudeJob(job: {
  title: string;
  description: string;
  payoutType: string;
  skills: { label: string }[];
  aptitudeTest: unknown;
}): AptitudeJob {
  return job;
}

async function createAttemptOnce(jobId: string, applicant: AptitudeApplicant) {
  const email = normalizeEmail(applicant.email);

  return prisma.$transaction(
    async (tx) => {
      const job = await tx.job.findFirst({
        where: { id: jobId, isActive: true },
        select: jobSelect,
      });

      if (!job) {
        throw new Error("JOB_NOT_FOUND");
      }

      const attempts = await tx.aptitudeAttempt.findMany({
        where: { jobId, candidateEmail: email },
        orderBy: { attemptNumber: "desc" },
        select: {
          id: true,
          attemptNumber: true,
          testVersionId: true,
          status: true,
          passed: true,
          retryAvailableAt: true,
        },
      });
      const latest = attempts[0];

      if (latest?.status === "IN_PROGRESS") {
        return { attempt: latest, job };
      }

      if (latest?.passed) {
        throw new AptitudeGateError("APTITUDE_ALREADY_PASSED");
      }

      if (attempts.length >= APTITUDE_MAX_ATTEMPTS) {
        throw new AptitudeGateError("APTITUDE_ATTEMPTS_EXHAUSTED");
      }

      if (latest?.retryAvailableAt && latest.retryAvailableAt > new Date()) {
        throw new AptitudeGateError(
          "APTITUDE_RETRY_NOT_AVAILABLE",
          latest.retryAvailableAt,
        );
      }

      const versions = getAptitudeTestVersions(asAptitudeJob(job));
      const version = versions[randomInt(versions.length)];
      const attempt = await tx.aptitudeAttempt.create({
        data: {
          jobId,
          applicantUserId: applicant.id,
          candidateEmail: email,
          attemptNumber: attempts.length + 1,
          testVersionId: version.id,
        },
        select: {
          id: true,
          attemptNumber: true,
          testVersionId: true,
          status: true,
          passed: true,
          retryAvailableAt: true,
        },
      });

      return { attempt, job };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

export const AptitudeService = {
  async getOrCreateAttempt(jobId: string, applicant: AptitudeApplicant) {
    let result: Awaited<ReturnType<typeof createAttemptOnce>> | undefined;

    for (let retry = 0; retry < 2; retry += 1) {
      try {
        result = await createAttemptOnce(jobId, applicant);
        break;
      } catch (error) {
        if (!isRetryableTransactionError(error) || retry === 1) {
          throw error;
        }
      }
    }

    if (!result) {
      throw new Error("APTITUDE_ATTEMPT_UNAVAILABLE");
    }

    const job = asAptitudeJob(result.job);
    return {
      id: result.attempt.id,
      attemptNumber: result.attempt.attemptNumber,
      testVersionId: result.attempt.testVersionId,
      questions: buildAptitudeTest(job, result.attempt.testVersionId),
      passingCorrect:
        getAptitudeTestVersions(job).find(
          (version) => version.id === result.attempt.testVersionId,
        )?.passingCorrect ?? APTITUDE_MIN_CORRECT_ANSWERS,
      maxAttempts: APTITUDE_MAX_ATTEMPTS,
      retryAvailableAt: result.attempt.retryAvailableAt?.toISOString() ?? null,
    };
  },
};
