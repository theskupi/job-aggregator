import { ApifyClient } from "apify-client";
import type { JobAcquisitionProvider } from "../provider.js";
import { linkedinActorInput, normalizeLinkedInItems } from "./linkedin-jobs-adapter.js";

type ActorClient = Pick<ApifyClient, "actor" | "dataset">;
export class ApifyProvider implements JobAcquisitionProvider {
  constructor(private readonly client: ActorClient = new ApifyClient(process.env.APIFY_TOKEN ? { token: process.env.APIFY_TOKEN } : {})) {}
  async search({ source, instructions, limit }: Parameters<JobAcquisitionProvider["search"]>[0]) {
    const actor = source.acquisition;
    const run = await this.client.actor(actor.actorId).call(linkedinActorInput(instructions, limit));
    if (!run.defaultDatasetId) throw new Error("Apify Actor returned no dataset");
    const { items } = await this.client.dataset(run.defaultDatasetId).listItems({ limit });
    return normalizeLinkedInItems(items, source.id, limit);
  }
}
