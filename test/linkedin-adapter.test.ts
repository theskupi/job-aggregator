import { describe, expect, it } from "vitest";
import { linkedinActorInput, normalizeLinkedInItems } from "../src/acquisition/apify/linkedin-jobs-adapter.js";
import fixture from "./fixtures/apify/linkedin-jobs.json" with { type: "json" };

describe("LinkedIn Actor adapter", () => {
  it("maps provider-facing criteria deterministically", () => {
    expect(linkedinActorInput({ criteria: { query: "frontend engineer", remote: true, postedWithinDays: 7, location: "Czech Republic", geoId: "104508036" } }, 5)).toMatchObject({ keywords: "Remote frontend engineer", datePosted: "pastWeek", location: "Czech Republic", geoId: "104508036", limitPerSource: 5 });
  });
  it("expresses remote and hybrid preferences in the Actor query", () => {
    expect(linkedinActorInput({ criteria: { query: "frontend engineer", workArrangements: ["remote", "hybrid"] } }, 50).keywords).toBe("Remote OR Hybrid frontend engineer");
  });
  it("skips invalid items and normalizes valid results", () => {
    const warnings: string[] = [];
    const jobs = normalizeLinkedInItems(fixture, "linkedin-jobs", 5, (warning) => warnings.push(warning));
    expect(jobs).toHaveLength(2); expect(jobs[0]).toMatchObject({ title: "Frontend Engineer", company: "Example Corp", remote: true, sourceId: "linkedin-jobs" }); expect(warnings).toHaveLength(1);
  });
  it("honours the result limit", () => expect(normalizeLinkedInItems(fixture, "linkedin-jobs", 1)).toHaveLength(1));
});
