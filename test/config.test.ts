import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadCatalog, loadConfiguration, loadSourceList } from "../src/config.js";

describe("configuration loader", () => {
  it("loads the Czech list and validates its references", async () => {
    const configuration = await loadConfiguration("czech");
    expect(configuration.sourceList.sourceIds).toEqual(["linkedin-jobs"]);
    expect(configuration.sources.map(({ id }) => id)).toContain("linkedin-jobs");
  });
  it("rejects duplicate catalog IDs and duplicate list IDs", async () => {
    const directory = await mkdtemp(join(tmpdir(), "job-aggregator-config-"));
    const source = { id: "one", name: "One", url: "https://example.com", acquisition: { provider: "apify", actorId: "actor", adapter: "linkedin-jobs-curious-coder" } };
    await writeFile(join(directory, "catalog.json"), JSON.stringify({ version: 1, sources: [source, source] }));
    await writeFile(join(directory, "duplicate.json"), JSON.stringify({ version: 1, id: "test", name: "Test", sourceIds: ["one", "one"] }));
    await expect(loadCatalog(join(directory, "catalog.json"))).rejects.toThrow("source IDs must be unique");
    await expect(loadSourceList("duplicate", directory)).rejects.toThrow("source-list source IDs must be unique");
  });
  it("rejects a source list referencing an unknown source", async () => {
    const directory = await mkdtemp(join(tmpdir(), "job-aggregator-config-"));
    await writeFile(join(directory, "sources.json"), JSON.stringify({ version: 1, sources: [{ id: "one", name: "One", url: "https://example.com", acquisition: { provider: "apify", actorId: "actor", adapter: "linkedin-jobs-curious-coder" } }] }));
    await writeFile(join(directory, "bad.json"), JSON.stringify({ version: 1, id: "bad", name: "Bad", sourceIds: ["missing"] }));
    await expect(loadConfiguration("bad", join(directory, "sources.json"), directory)).rejects.toThrow("unknown source");
  });
});
