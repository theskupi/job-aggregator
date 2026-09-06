import { z } from "zod";
import type { JobResult, SearchInstructions } from "../../domain.js";

export const linkedinActorInput = (instructions: SearchInstructions, limit: number) => ({
  urls: [], keywords: instructions.criteria.remote && !/\bremote\b/i.test(instructions.criteria.query) ? `Remote ${instructions.criteria.query}` : instructions.criteria.query,
  ...(instructions.criteria.location ? { location: instructions.criteria.location } : {}),
  ...(instructions.criteria.geoId ? { geoId: instructions.criteria.geoId } : {}),
  ...(instructions.criteria.postedWithinDays ? { datePosted: ({ 1: "past24Hours", 7: "pastWeek", 30: "pastMonth" } as const)[instructions.criteria.postedWithinDays] } : {}),
  scrapeCompany: false, limitPerSource: limit, autoConvertToAiSearch: true
});

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
    const remote = value.workRemoteAllowed ?? (typeof value.workplaceTypes === "string" && /remote/i.test(value.workplaceTypes) ? true : Array.isArray(value.workplaceTypes) && value.workplaceTypes.some((part) => /remote/i.test(part)) ? true : undefined);
    results.push({ ...(value.id !== undefined ? { externalId: String(value.id) } : {}), title: value.title, company: value.companyName, ...(value.location ? { location: value.location } : {}), ...(remote !== undefined ? { remote } : {}), ...(salary ? { salary } : {}), url: value.link, sourceId, ...(value.postedAt ? { publishedAt: value.postedAt } : {}), ...(value.descriptionText ? { description: value.descriptionText } : {}) });
    if (results.length >= limit) break;
  }
  return results;
}
