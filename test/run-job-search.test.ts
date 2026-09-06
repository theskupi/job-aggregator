import { describe, expect, it } from "vitest";
import { runJobSearch } from "../src/run-job-search.js";
import type { JobAcquisitionProvider } from "../src/acquisition/provider.js";
import type { JobResult, JobSource } from "../src/domain.js";

const instructions = { criteria: { query: "engineer" } };
const job: JobResult = { title: "Engineer", company: "Acme", url: "https://example.com/jobs/1", sourceId: "linkedin-jobs" };
const source = (id: string): JobSource => ({ id, name: id, url: "https://example.com", acquisition: { provider: "apify", actorId: "actor", adapter: "linkedin-jobs-curious-coder" } });
const fake = (result: JobResult[] | Error): JobAcquisitionProvider => ({ search: async () => { if (result instanceof Error) throw result; return result; } });
const config = (sources: JobSource[]) => async () => ({ sources, sourceList: { version: 1 as const, id: "test", name: "Test", sourceIds: sources.map(({ id }) => id) } });

describe("runJobSearch", () => {
  it("returns success and keeps empty sources successful", async () => {
    const result = await runJobSearch({ sourceListId: "test", instructions, limitPerSource: 5 }, () => fake([job]), config([source("linkedin-jobs")]));
    expect(result.status).toBe("success"); expect(result.outcomes[0]).toMatchObject({ status: "success", jobs: [job] });
  });
  it("does not call a provider for an invalid source selection", async () => {
    await expect(runJobSearch({ sourceListId: "test", sourceIds: ["other"], instructions, limitPerSource: 5 }, () => { throw new Error("must not call"); }, config([source("linkedin-jobs")]))).rejects.toThrow("sourceIds");
  });
  it("aggregates partial failures while preserving successful results", async () => {
    const sources = [source("one"), source("two")];
    const result = await runJobSearch({ sourceListId: "test", instructions, limitPerSource: 5 }, (selected) => fake(selected.id === "one" ? [job] : new Error("temporary failure")), config(sources));
    expect(result.status).toBe("partial"); expect(result.outcomes).toEqual([expect.objectContaining({ sourceId: "one", status: "success" }), expect.objectContaining({ sourceId: "two", status: "failed" })]);
  });
  it("throws after all selected sources fail", async () => {
    await expect(runJobSearch({ sourceListId: "test", instructions, limitPerSource: 5 }, () => fake(new Error("down")), config([source("one")]))).rejects.toThrow("All selected sources failed");
  });
});
