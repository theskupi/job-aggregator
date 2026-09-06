import { describe, expect, it } from "vitest";
import { runJobSearch } from "../src/run-job-search.js";

describe.skipIf(process.env.RUN_LIVE_SMOKE !== "1")("live Apify smoke test", () => {
  it("fetches a small sample from every source in the Czech list", async () => {
    const result = await runJobSearch({ sourceListId: "czech", instructions: { criteria: { query: "software engineer", workArrangements: ["remote", "hybrid"] } }, limitPerSource: 1 });
    expect(result.outcomes.every((outcome) => outcome.status === "success")).toBe(true);
  }, 120_000);
});
