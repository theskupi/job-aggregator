import type { ApifyAdapter } from "./adapter.js";
import { linkedinActorInput, normalizeLinkedInItems } from "./linkedin-jobs-adapter.js";
import { jobsCzActorInput, normalizeJobsCzItems } from "./jobs-cz-adapter.js";
import { noFluffJobsActorInput, normalizeNoFluffJobsItems } from "./nofluffjobs-adapter.js";

export const adapterRegistry: Record<string, ApifyAdapter> = {
  "linkedin-jobs-curious-coder": { buildInput: linkedinActorInput, normalize: normalizeLinkedInItems },
  "jobs-cz": { buildInput: jobsCzActorInput, normalize: normalizeJobsCzItems },
  nofluffjobs: { buildInput: noFluffJobsActorInput, normalize: normalizeNoFluffJobsItems }
};
