import { getApifyToken } from "./env.js";
import { jobSearchInputSchema, type JobSearchInput, type JobSearchRunResult, type JobSource, type SourceSearchOutcome } from "./domain.js";
import { loadConfiguration } from "./config.js";
import { ApifyProvider } from "./acquisition/apify/apify-provider.js";
import type { JobAcquisitionProvider } from "./acquisition/provider.js";
import { formatResults } from "./format-results.js";

export type ProviderResolver = (source: JobSource) => JobAcquisitionProvider;
export type ConfigurationLoader = (sourceListId: string) => ReturnType<typeof loadConfiguration>;
const defaultResolver: ProviderResolver = (source) => { getApifyToken(); return new ApifyProvider(); };

export async function runJobSearch(rawInput: JobSearchInput, resolveProvider: ProviderResolver = defaultResolver, loadConfig: ConfigurationLoader = loadConfiguration): Promise<JobSearchRunResult> {
  const input = jobSearchInputSchema.parse(rawInput);
  const startedAt = new Date().toISOString();
  const { sources, sourceList } = await loadConfig(input.sourceListId);
  const selectedIds = input.sourceIds ?? sourceList.sourceIds;
  if (selectedIds.some((id) => !sourceList.sourceIds.includes(id))) throw new Error("sourceIds must belong to the selected source list");
  const selected = selectedIds.map((id) => sources.find((source) => source.id === id)).filter((source): source is JobSource => source !== undefined);
  const outcomes = await Promise.all(selected.map(async (source): Promise<SourceSearchOutcome> => {
    try { return { sourceId: source.id, status: "success", jobs: await resolveProvider(source).search({ source, instructions: input.instructions, limit: input.limitPerSource }) }; }
    catch (error) { return { sourceId: source.id, status: "failed", jobs: [], error: error instanceof Error ? error.message : "Unknown source error" }; }
  }));
  const succeeded = outcomes.filter((outcome) => outcome.status === "success").length;
  const status = succeeded === outcomes.length ? "success" : succeeded > 0 ? "partial" : "failed";
  const result = { sourceListId: input.sourceListId, startedAt, completedAt: new Date().toISOString(), status, outcomes } satisfies JobSearchRunResult;
  if (status === "failed") {
    console.error(formatResults(result));
    throw new Error(`All selected sources failed: ${outcomes.map((outcome) => outcome.status === "failed" ? outcome.error : "").join("; ")}`);
  }
  return result;
}
