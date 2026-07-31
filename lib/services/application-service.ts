import { ApplicationStatus, Prisma, Role } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import type { ApplicationInput } from "@/lib/validation/application";

type ReferralCookie = {
  jobId: string;
  referralCode: string;
};

function parseReferralCookie(value: string | undefined): ReferralCookie | null {
  if (!value) {
    return null;
  }

  const [jobId, referralCode] = value.split(":");

  if (!jobId || !referralCode) {
    return null;
  }

  return { jobId, referralCode };
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function toApplicationResponse(application: {
  id: string;
  jobId: string;
  candidateEmail: string;
  candidateName: string;
  candidateFirstName: string | null;
  candidateLastName: string | null;
  candidatePhoneCountry: string | null;
  candidatePhoneCountryCode: string | null;
  candidatePhoneNumber: string | null;
  candidateLinkedinUrl: string | null;
  resumeFileName: string | null;
  status: ApplicationStatus;
  lockedPayoutCents: number | null;
  referralId: string | null;
  createdAt: Date;
}) {
  return {
    id: application.id,
    jobId: application.jobId,
    candidateEmail: application.candidateEmail,
    candidateName: application.candidateName,
    candidateFirstName: application.candidateFirstName,
    candidateLastName: application.candidateLastName,
    candidatePhoneCountry: application.candidatePhoneCountry,
    candidatePhoneCountryCode: application.candidatePhoneCountryCode,
    candidatePhoneNumber: application.candidatePhoneNumber,
    candidateLinkedinUrl: application.candidateLinkedinUrl,
    resumeFileName: application.resumeFileName,
    status: application.status,
    lockedPayoutCents: application.lockedPayoutCents,
    referralId: application.referralId,
    createdAt: application.createdAt.toISOString(),
  };
}

export const ApplicationService = {
  async submitApplication(input: ApplicationInput, referralCookie?: string) {
    const normalizedEmail = normalizeEmail(input.candidateEmail);
    const parsedReferral = parseReferralCookie(referralCookie);

    try {
      const application = await prisma.$transaction(async (tx) => {
        const job = await tx.job.findFirst({
          where: { id: input.jobId, isActive: true },
          select: { id: true, payoutAmountCents: true },
        });

        if (!job) {
          throw new Error("JOB_NOT_FOUND");
        }

        await tx.candidateIdentity.upsert({
          where: { email: normalizedEmail },
          update: {},
          create: { email: normalizedEmail },
        });

        let referralId: string | undefined;

        if (parsedReferral?.jobId === job.id) {
          const referrer = await tx.user.findUnique({
            where: { referralCode: parsedReferral.referralCode },
            select: { id: true, email: true, role: true },
          });

          if (referrer?.email === normalizedEmail) {
            throw new Error("SELF_REFERRAL");
          }

          if (referrer && referrer.role !== Role.CANDIDATE) {
            const referral = await tx.referral.create({
              data: {
                referrerId: referrer.id,
                jobId: job.id,
              },
              select: { id: true },
            });

            referralId = referral.id;
          }
        }

        return tx.application.create({
          data: {
            jobId: job.id,
            candidateEmail: normalizedEmail,
            candidateName: input.candidateName.trim(),
            candidateFirstName: input.candidateFirstName ?? null,
            candidateLastName: input.candidateLastName ?? null,
            candidatePhoneCountry: input.candidatePhoneCountry ?? null,
            candidatePhoneCountryCode: input.candidatePhoneCountryCode ?? null,
            candidatePhoneNumber: input.candidatePhoneNumber ?? null,
            candidateLinkedinUrl: input.candidateLinkedinUrl ?? null,
            resumeFileName: input.resumeFileName ?? null,
            lockedPayoutCents: job.payoutAmountCents,
            referralId,
          },
          select: {
            id: true,
            jobId: true,
            candidateEmail: true,
            candidateName: true,
            candidateFirstName: true,
            candidateLastName: true,
            candidatePhoneCountry: true,
            candidatePhoneCountryCode: true,
            candidatePhoneNumber: true,
            candidateLinkedinUrl: true,
            resumeFileName: true,
            status: true,
            lockedPayoutCents: true,
            referralId: true,
            createdAt: true,
          },
        });
      });

      return toApplicationResponse(application);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new Error("APPLICATION_ALREADY_EXISTS");
      }

      throw error;
    }
  },
};
