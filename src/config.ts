import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { sourceCatalogSchema, sourceListSchema, type JobSource, type SourceList } from "./domain.js";

// Trigger.dev is configured with legacyDevProcessCwdBehaviour=false, so the
// project root is the same working directory locally and in the build.
const root = process.cwd();
const parseJson = async (path: string): Promise<unknown> => JSON.parse(await readFile(path, "utf8"));

function unique(values: string[], label: string): void {
  if (new Set(values).size !== values.length) throw new Error(`${label} must be unique`);
}

export async function loadCatalog(path = join(root, "config/sources.json")): Promise<JobSource[]> {
  const catalog = sourceCatalogSchema.parse(await parseJson(path));
  unique(catalog.sources.map((source) => source.id), "source IDs");
  return catalog.sources;
}

export async function loadSourceList(id: string, listsDirectory = join(root, "config/source-lists")): Promise<SourceList> {
  const list = sourceListSchema.parse(await parseJson(join(listsDirectory, `${id}.json`)));
  unique(list.sourceIds, "source-list source IDs");
  return list;
}

export async function loadConfiguration(sourceListId: string, catalogPath = join(root, "config/sources.json"), listsDirectory = join(root, "config/source-lists")): Promise<{ sources: JobSource[]; sourceList: SourceList }> {
  const [sources, sourceList] = await Promise.all([loadCatalog(catalogPath), loadSourceList(sourceListId, listsDirectory)]);
  const known = new Set(sources.map((source) => source.id));
  for (const sourceId of sourceList.sourceIds) if (!known.has(sourceId)) throw new Error(`Source list references unknown source: ${sourceId}`);
  return { sources, sourceList };
}
