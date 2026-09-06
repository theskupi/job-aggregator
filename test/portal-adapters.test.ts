import { describe, expect, it } from "vitest";
import { jobsCzActorInput, normalizeJobsCzItems } from "../src/acquisition/apify/jobs-cz-adapter.js";
import { noFluffJobsActorInput, normalizeNoFluffJobsItems } from "../src/acquisition/apify/nofluffjobs-adapter.js";
import jobsCzFixture from "./fixtures/apify/jobs-cz.json" with { type: "json" };
import noFluffJobsFixture from "./fixtures/apify/nofluffjobs.json" with { type: "json" };

describe("portal adapters", () => {
  it("builds Jobs.cz input and normalizes its contract", () => {
    expect(jobsCzActorInput({ criteria: { query: "frontend developer, React, TypeScript", location: "Praha", workArrangements: ["remote", "hybrid"] } }, 50)).toMatchObject({ searchQueries: ["frontend developer", "React", "TypeScript"], startUrls: [], location: "Praha", workArrangements: ["remote", "hybrid"], maxItems: 50 });
    const warnings: string[] = [];
    const jobs = normalizeJobsCzItems(jobsCzFixture, "jobs-cz", 5, (warning) => warnings.push(warning));
    expect(jobs).toHaveLength(1); expect(jobs[0]).toMatchObject({ externalId: "2001304864", company: "Example CZ s.r.o.", remote: true, publishedAt: "2026-08-31T00:00:00+02:00" }); expect(warnings).toHaveLength(1);
  });
  it("builds No Fluff Jobs input and skips malformed items", () => {
    expect(noFluffJobsActorInput({ criteria: { query: "frontend developer, React", workArrangements: ["remote", "hybrid"] } }, 50)).toMatchObject({ searchQueries: ["frontend developer", "React"], country: "cz", remoteOnly: false, maxResultsPerQuery: 50 });
    const warnings: string[] = [];
    const jobs = normalizeNoFluffJobsItems(noFluffJobsFixture, "nofluffjobs", 5, (warning) => warnings.push(warning));
    expect(jobs).toHaveLength(1); expect(jobs[0]).toMatchObject({ externalId: "senior-frontend-engineer-example-remote", remote: true, publishedAt: "2026-09-01T08:00:00Z", url: "https://nofluffjobs.com/cz/job/senior-frontend-engineer-example-remote" }); expect(warnings).toHaveLength(1);
    expect(normalizeNoFluffJobsItems([{ jobId: "hybrid-1", title: "Frontend", company: "Acme", location: "Praha", isRemote: false, remoteLevel: 3, postingUrl: "https://nofluffjobs.com/cz/job/hybrid-1" }], "nofluffjobs", 5)[0]).toMatchObject({ workArrangement: "hybrid", remote: false });
  });
});
