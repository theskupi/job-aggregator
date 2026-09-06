import { z } from "zod";
import type { JobResult, SearchInstructions } from "../../domain.js";
import { requestedWorkArrangements } from "./adapter.js";
import { firstString, normalizePortalItems, searchQueries } from "./portal-adapter-utils.js";

export const jobsCzActorInput = (instructions: SearchInstructions, limit: number) => ({
  searchQueries: searchQueries(instructions.criteria.query),
  startUrls: [],
  ...(instructions.criteria.location ? { location: instructions.criteria.location } : {}),
  ...(requestedWorkArrangements(instructions) ? { workArrangements: requestedWorkArrangements(instructions) } : {}),
  maxItems: limit,
  maxPages: 3
});
const schema = z.object({}).passthrough().refine((v) => Boolean(firstString(v, ["url", "link", "jobUrl", "canonicalUrl"]) && firstString(v, ["title", "jobTitle"]) && firstString(v, ["company", "companyName", "employer"]))).transform((v) => v as Record<string, unknown>);
export const normalizeJobsCzItems = (items: unknown[], sourceId: string, limit: number, warn?: (message: string) => void): JobResult[] => normalizePortalItems(items, sourceId, limit, schema, (v, sourceId) => {
  const workArrangement = v.workArrangement === "remote" || v.workArrangement === "hybrid" || v.workArrangement === "onsite" ? v.workArrangement : undefined;
  return { externalId: v.id !== undefined ? String(v.id) : firstString(v, ["jobId"]), title: firstString(v, ["title", "jobTitle"])!, company: firstString(v, ["company", "companyName", "employer"])!, location: firstString(v, ["location", "workplace"]), workArrangement, remote: workArrangement === "remote" ? true : undefined, salary: firstString(v, ["salary", "salaryInfo"]), url: firstString(v, ["url", "link", "jobUrl", "canonicalUrl"])!, sourceId, publishedAt: firstString(v, ["publishedAt", "datePosted", "postedAt"]), description: firstString(v, ["description", "descriptionText"]) };
}, "Jobs.cz", warn);
