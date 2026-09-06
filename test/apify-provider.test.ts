import { describe, expect, it, vi } from "vitest";
import { ApifyProvider } from "../src/acquisition/apify/apify-provider.js";
import type { JobSource } from "../src/domain.js";

const source: JobSource = { id: "jobs-cz", name: "Jobs.cz", url: "https://www.jobs.cz/", acquisition: { provider: "apify", actorId: "automation-lab/jobs-cz-scraper", adapter: "jobs-cz" } };
const request = { source, instructions: { criteria: { query: "React" } }, limit: 5 } as const;

describe("ApifyProvider", () => {
  it("reports an unsuccessful Actor run as a source failure", async () => {
    const client = { actor: () => ({ call: vi.fn().mockResolvedValue({ status: "FAILED", statusMessage: "Provide at least one search query", defaultDatasetId: "dataset" }) }), dataset: () => ({ listItems: vi.fn() }) };
    await expect(new ApifyProvider(client as never).search(request)).rejects.toThrow("finished with FAILED: Provide at least one search query");
  });

  it("normalizes the dataset only after a successful run", async () => {
    const call = vi.fn().mockResolvedValue({ status: "SUCCEEDED", defaultDatasetId: "dataset" });
    const listItems = vi.fn().mockResolvedValue({ items: [{ jobId: "1", title: "Frontend", employer: "Acme", canonicalUrl: "https://www.jobs.cz/rpd/1/" }] });
    const jobs = await new ApifyProvider({ actor: () => ({ call }), dataset: () => ({ listItems }) } as never).search(request);
    expect(call).toHaveBeenCalledWith(expect.objectContaining({ searchQueries: ["React"] }));
    expect(jobs).toEqual([expect.objectContaining({ externalId: "1", sourceId: "jobs-cz" })]);
  });

  it("does not silently accept a non-empty dataset with an unknown contract", async () => {
    const client = { actor: () => ({ call: vi.fn().mockResolvedValue({ status: "SUCCEEDED", defaultDatasetId: "dataset" }) }), dataset: () => ({ listItems: vi.fn().mockResolvedValue({ items: [{ unexpected: "shape" }] }) }) };
    await expect(new ApifyProvider(client as never).search(request)).rejects.toThrow("returned no valid job items");
  });

  it("keeps only requested work arrangements after normalization", async () => {
    const hybridRequest = { ...request, instructions: { criteria: { query: "React", workArrangements: ["remote", "hybrid"] as Array<"remote" | "hybrid"> } } };
    const items = [
      { jobId: "1", title: "Remote", employer: "Acme", workArrangement: "remote", canonicalUrl: "https://www.jobs.cz/rpd/1/" },
      { jobId: "2", title: "Hybrid", employer: "Acme", workArrangement: "hybrid", canonicalUrl: "https://www.jobs.cz/rpd/2/" },
      { jobId: "3", title: "Office", employer: "Acme", workArrangement: "onsite", canonicalUrl: "https://www.jobs.cz/rpd/3/" }
    ];
    const client = { actor: () => ({ call: vi.fn().mockResolvedValue({ status: "SUCCEEDED", defaultDatasetId: "dataset" }) }), dataset: () => ({ listItems: vi.fn().mockResolvedValue({ items }) }) };
    const jobs = await new ApifyProvider(client as never).search(hybridRequest);
    expect(jobs.map(({ workArrangement }) => workArrangement)).toEqual(["remote", "hybrid"]);
  });
});
