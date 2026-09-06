import { readFile } from "node:fs/promises";
import { formatResults } from "./format-results.js";
import { runJobSearch } from "./run-job-search.js";
import { jobSearchInputSchema } from "./domain.js";

const path = process.argv[2];
if (!path) { console.error("Usage: npm run search -- <input.json>"); process.exitCode = 1; }
else {
  try { const input = jobSearchInputSchema.parse(JSON.parse(await readFile(path, "utf8"))); const result = await runJobSearch(input); console.log(formatResults(result)); console.log(JSON.stringify(result, null, 2)); }
  catch (error) { console.error(error instanceof Error ? error.message : "Search failed"); process.exitCode = 1; }
}
