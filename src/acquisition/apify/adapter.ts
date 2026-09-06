import type { JobResult, SearchInstructions } from "../../domain.js";

export type ApifyAdapter = {
  buildInput(instructions: SearchInstructions, limit: number): Record<string, unknown>;
  normalize(items: unknown[], sourceId: string, limit: number, warn?: (message: string) => void): JobResult[];
};

export const requestedWorkArrangements = (instructions: SearchInstructions): Array<"remote" | "hybrid" | "onsite"> | undefined =>
  instructions.criteria.workArrangements ?? (instructions.criteria.remote ? ["remote"] : undefined);
