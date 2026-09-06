import { z } from "zod";
import type { JobResult, SearchInstructions } from "../../domain.js";
import { requestedWorkArrangements } from "./adapter.js";

export const linkedinActorInput = (instructions: SearchInstructions, limit: number) => {
  const arrangements = requestedWorkArrangements(instructions);
  const arrangementQuery = arrangements?.map((value) => value[0]!.toUpperCase() + value.slice(1)).join(" OR ");
  return ({
  urls: [], keywords: arrangementQuery && !arrangements?.some((value) => new RegExp(`\\b${value}\\b`, "i").test(instructions.criteria.query)) ? `${arrangementQuery} ${instructions.criteria.query}` : instructions.criteria.query,
  ...(instructions.criteria.location ? { location: instructions.criteria.location } : {}),
  ...(instructions.criteria.geoId ? { geoId: instructions.criteria.geoId } : {}),
  ...(instructions.criteria.postedWithinDays ? { datePosted: ({ 1: "past24Hours", 7: "pastWeek", 30: "pastMonth" } as const)[instructions.criteria.postedWithinDays] } : {}),
  scrapeCompany: false, limitPerSource: limit, autoConvertToAiSearch: true
  });
};

const actorItemSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(), link: z.string().url(), title: z.string().trim().min(1), companyName: z.string().trim().min(1),
  location: z.string().trim().min(1).optional(), salaryInfo: z.unknown().optional(), postedAt: z.string().trim().min(1).optional(), descriptionText: z.string().trim().min(1).optional(),
  workRemoteAllowed: z.boolean().optional(), workplaceTypes: z.union([z.string(), z.array(z.string())]).optional()
});

export function normalizeLinkedInItems(items: unknown[], sourceId: string, limit: number, warn: (message: string) => void = console.warn): JobResult[] {
  const results: JobResult[] = [];
  for (const item of items) {
    const parsed = actorItemSchema.safeParse(item);
    if (!parsed.success) { warn("Skipped invalid LinkedIn Actor item"); continue; }
    const value = parsed.data;
    const salary = typeof value.salaryInfo === "string" ? value.salaryInfo.trim() : Array.isArray(value.salaryInfo) ? value.salaryInfo.filter((part): part is string => typeof part === "string").join(" – ") : undefined;
    const workplace = Array.isArray(value.workplaceTypes) ? value.workplaceTypes.join(" ") : value.workplaceTypes;
    const workArrangement = value.workRemoteAllowed ? "remote" : workplace && /hybrid/i.test(workplace) ? "hybrid" : workplace && /remote/i.test(workplace) ? "remote" : workplace && /on.?site/i.test(workplace) ? "onsite" : undefined;
    const remote = value.workRemoteAllowed ?? (workArrangement === "remote" ? true : workArrangement ? false : undefined);
    results.push({ ...(value.id !== undefined ? { externalId: String(value.id) } : {}), title: value.title, company: value.companyName, ...(value.location ? { location: value.location } : {}), ...(workArrangement ? { workArrangement } : {}), ...(remote !== undefined ? { remote } : {}), ...(salary ? { salary } : {}), url: value.link, sourceId, ...(value.postedAt ? { publishedAt: value.postedAt } : {}), ...(value.descriptionText ? { description: value.descriptionText } : {}) });
    if (results.length >= limit) break;
  }
  return results;
}
