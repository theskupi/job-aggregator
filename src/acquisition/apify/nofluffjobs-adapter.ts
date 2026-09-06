import { z } from "zod";
import type { JobResult, SearchInstructions } from "../../domain.js";
import { requestedWorkArrangements } from "./adapter.js";
import { firstString, normalizePortalItems, searchQueries } from "./portal-adapter-utils.js";

export const noFluffJobsActorInput = (instructions: SearchInstructions, limit: number) => ({
  searchQueries: searchQueries(instructions.criteria.query),
  startUrls: [],
  country: "cz",
  ...(instructions.criteria.location ? { location: instructions.criteria.location } : {}),
  remoteOnly: requestedWorkArrangements(instructions)?.length === 1 && requestedWorkArrangements(instructions)?.[0] === "remote",
  maxResultsPerQuery: limit,
  onlyUniqueJobs: true,
  includeDescription: true
});
const schema = z.object({}).passthrough().refine((v) => Boolean(firstString(v, ["url", "link", "jobUrl", "postingUrl"]) && firstString(v, ["title", "jobTitle"]) && firstString(v, ["company", "companyName"]))).transform((v) => v as Record<string, unknown>);
export const normalizeNoFluffJobsItems = (items: unknown[], sourceId: string, limit: number, warn?: (message: string) => void): JobResult[] => normalizePortalItems(items, sourceId, limit, schema, (v, sourceId) => {
  const remoteLevel = typeof v.remoteLevel === "number" ? v.remoteLevel : undefined;
  const isRemote = typeof v.isRemote === "boolean" ? v.isRemote : typeof v.remote === "boolean" ? v.remote : remoteLevel === 5;
  const workArrangement = isRemote ? "remote" : remoteLevel !== undefined && remoteLevel > 0 ? "hybrid" : remoteLevel === 0 ? "onsite" : undefined;
  return { externalId: firstString(v, ["id", "jobId", "reference", "slug"]), title: firstString(v, ["title", "jobTitle"])!, company: firstString(v, ["company", "companyName"])!, location: firstString(v, ["location", "locations"]), workArrangement, remote: isRemote, salary: firstString(v, ["salary", "salaryRange"]), url: firstString(v, ["url", "link", "jobUrl", "postingUrl"])!, sourceId, publishedAt: firstString(v, ["publishedAt", "datePosted", "postedDate"]), description: firstString(v, ["description", "descriptionText"]) };
}, "No Fluff Jobs", warn);
