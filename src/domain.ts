import { z } from "zod";

const nonEmpty = z.string().trim().min(1);

export const acquisitionSchema = z.object({
  provider: z.literal("apify"),
  actorId: nonEmpty,
  adapter: z.literal("linkedin-jobs-curious-coder")
});

export const sourceSchema = z.object({
  id: nonEmpty,
  name: nonEmpty,
  url: z.string().url(),
  acquisition: acquisitionSchema
});

export const sourceCatalogSchema = z.object({ version: z.literal(1), sources: z.array(sourceSchema).min(1) });
export const sourceListSchema = z.object({ version: z.literal(1), id: nonEmpty, name: nonEmpty, sourceIds: z.array(nonEmpty).min(1) });

export const searchInstructionsSchema = z.object({
  criteria: z.object({
    query: nonEmpty,
    location: nonEmpty.optional(),
    geoId: z.string().regex(/^\d+$/, "geoId must contain only digits").optional(),
    remote: z.boolean().optional(),
    postedWithinDays: z.union([z.literal(1), z.literal(7), z.literal(30)]).optional()
  }),
  context: z.object({ profile: nonEmpty.optional(), preferences: z.array(nonEmpty).min(1).optional() }).optional()
});

export const jobSearchInputSchema = z.object({
  sourceListId: nonEmpty,
  sourceIds: z.array(nonEmpty).min(1).optional(),
  instructions: searchInstructionsSchema,
  limitPerSource: z.number().int().min(1).max(50)
});

export const jobResultSchema = z.object({
  externalId: nonEmpty.optional(), title: nonEmpty, company: nonEmpty, location: nonEmpty.optional(),
  remote: z.boolean().optional(), salary: nonEmpty.optional(), url: z.string().url(), sourceId: nonEmpty,
  publishedAt: nonEmpty.optional(), description: nonEmpty.optional()
});

export type JobSource = z.infer<typeof sourceSchema>;
export type SourceList = z.infer<typeof sourceListSchema>;
export type SearchInstructions = z.infer<typeof searchInstructionsSchema>;
export type JobSearchInput = z.infer<typeof jobSearchInputSchema>;
export type JobResult = z.infer<typeof jobResultSchema>;
export type SourceSearchOutcome =
  | { sourceId: string; status: "success"; jobs: JobResult[] }
  | { sourceId: string; status: "failed"; jobs: []; error: string };
export type JobSearchRunResult = {
  sourceListId: string; startedAt: string; completedAt: string;
  status: "success" | "partial" | "failed"; outcomes: SourceSearchOutcome[];
};
