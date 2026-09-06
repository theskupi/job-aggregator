import { describe, expect, it } from "vitest";
import { formatResults } from "../src/format-results.js";
import type { JobSearchRunResult } from "../src/domain.js";

const base = { sourceListId: "czech", startedAt: "2026-09-06T10:00:00.000Z", completedAt: "2026-09-06T10:01:00.000Z" };
describe("formatResults", () => {
  it.each(["success", "partial", "failed"] as const)("formats %s output", (status) => {
    const outcome = status === "failed" ? { sourceId: "linkedin-jobs", status: "failed" as const, jobs: [] as [], error: "down" } : { sourceId: "linkedin-jobs", status: "success" as const, jobs: [] };
    const text = formatResults({ ...base, status, outcomes: [outcome] } as JobSearchRunResult);
    expect(text).toContain(`Job search ${status}: czech`);
    expect(text).toContain(status === "failed" ? "FAILED — down" : "0 result(s)");
  });
});
