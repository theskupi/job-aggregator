import type { JobSearchRunResult } from "./domain.js";
export function formatResults(result: JobSearchRunResult): string {
  const lines = [`Job search ${result.status}: ${result.sourceListId}`, `Completed: ${result.completedAt}`];
  for (const outcome of result.outcomes) {
    if (outcome.status === "failed") lines.push(`- ${outcome.sourceId}: FAILED — ${outcome.error}`);
    else { lines.push(`- ${outcome.sourceId}: ${outcome.jobs.length} result(s)`); outcome.jobs.forEach((job, i) => lines.push(`  ${i + 1}. ${job.title} — ${job.company} (${job.location ?? "location unknown"})\n     ${job.url}`)); }
  }
  return lines.join("\n");
}
