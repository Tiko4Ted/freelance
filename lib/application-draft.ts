export type StoredApplicationDraft = {
  jobId: string;
  candidateName: string;
  candidateFirstName: string;
  candidateLastName: string;
  candidatePhoneCountry: string;
  candidatePhoneCountryCode: string;
  candidatePhoneNumber: string;
  candidateLinkedinUrl: string;
  resumeFileName: string;
  startAvailabilityDays: number;
  expectedHourlyRateUsd: number;
  weeklyAvailabilityHours: number;
  strongestTools: string[];
};

export const applicationDraftStorageKey = (jobId: string) =>
  `application-draft:${jobId}`;
