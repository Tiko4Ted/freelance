export type StoredApplicationDraft = {
  jobId: string;
  candidateLinkedinUrl: string;
  resumeFileName: string;
};

export const applicationDraftStorageKey = (jobId: string) =>
  `application-draft:${jobId}`;
