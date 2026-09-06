import { ApifyClient } from "apify-client";
import type { JobAcquisitionProvider } from "../provider.js";
import { adapterRegistry } from "./adapter-registry.js";
import { requestedWorkArrangements } from "./adapter.js";

type ActorClient = Pick<ApifyClient, "actor" | "dataset">;
export class ApifyProvider implements JobAcquisitionProvider {
  constructor(private readonly client: ActorClient = new ApifyClient(process.env.APIFY_TOKEN ? { token: process.env.APIFY_TOKEN } : {})) {}
  async search({ source, instructions, limit }: Parameters<JobAcquisitionProvider["search"]>[0]) {
    const actor = source.acquisition;
    const adapter = adapterRegistry[actor.adapter];
    if (!adapter) throw new Error(`No Apify adapter registered for: ${actor.adapter}`);
    const run = await this.client.actor(actor.actorId).call(adapter.buildInput(instructions, limit));
    if (run.status !== "SUCCEEDED") {
      const detail = run.statusMessage ? `: ${run.statusMessage}` : "";
      throw new Error(`Apify Actor ${actor.actorId} finished with ${run.status}${detail}`);
    }
    if (!run.defaultDatasetId) throw new Error("Apify Actor returned no dataset");
    const { items } = await this.client.dataset(run.defaultDatasetId).listItems({ limit });
    const jobs = adapter.normalize(items, source.id, limit);
    if (items.length > 0 && jobs.length === 0) throw new Error(`Apify Actor ${actor.actorId} returned no valid job items`);
    const arrangements = requestedWorkArrangements(instructions);
    if (!arrangements) return jobs;
    return jobs.filter((job) => job.workArrangement !== undefined && arrangements.includes(job.workArrangement));
  }
}
