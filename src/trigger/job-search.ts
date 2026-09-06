import { schemaTask } from "@trigger.dev/sdk";
import { jobSearchInputSchema } from "../domain.js";
import { formatResults } from "../format-results.js";
import { runJobSearch } from "../run-job-search.js";

export const jobSearch = schemaTask({
  id: "job-search",
  schema: jobSearchInputSchema,
  retry: { maxAttempts: 1 },
  run: async (payload) => { const result = await runJobSearch(payload); console.log(formatResults(result)); return result; }
});
