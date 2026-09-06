import { z } from "zod";
import type { JobResult } from "../../domain.js";

export const stringValue = (value: unknown): string | undefined => typeof value === "string" && value.trim() ? value.trim() : undefined;
export const firstString = (item: Record<string, unknown>, keys: string[]): string | undefined => keys.map((key) => stringValue(item[key])).find(Boolean);
export const searchQueries = (query: string): string[] => query.split(",").map((part) => part.trim()).filter(Boolean);
export const normalizePortalItems = (items: unknown[], sourceId: string, limit: number, schema: z.ZodType<Record<string, unknown>>, map: (item: Record<string, unknown>, sourceId: string) => JobResult, label: string, warn: (message: string) => void = console.warn): JobResult[] => {
  const results: JobResult[] = [];
  for (const item of items) {
    const parsed = schema.safeParse(item);
    if (!parsed.success) { warn(`Skipped invalid ${label} Actor item`); continue; }
    results.push(map(parsed.data, sourceId));
    if (results.length >= limit) break;
  }
  return results;
};
