# Job Search Aggregator

Configurable job-offer aggregator built with TypeScript, Trigger.dev, and Apify. One `job-search` input can run every source in a named source list in parallel, normalize their outputs, and preserve source-level failures without discarding successful results.

## Supported sources

| Source | Source ID | Apify Actor |
| --- | --- | --- |
| LinkedIn Jobs | `linkedin-jobs` | `curious_coder/linkedin-jobs-scraper` |
| Jobs.cz | `jobs-cz` | `automation-lab/jobs-cz-scraper` |
| No Fluff Jobs | `nofluffjobs` | `solidcode/nofluffjobs-scraper` |

The `czech` source list contains all three sources. The `remote-international` list currently contains LinkedIn Jobs and No Fluff Jobs.

## Local setup

Node.js 26 and an Apify API token are required for live searches.

```sh
npm install
cp .env.example .env
```

Set `APIFY_TOKEN` in `.env`, then run all Czech sources with one input:

```sh
npm run search -- config/examples/czech-all.search.json
```

Source-specific examples are also available:

```sh
npm run search -- config/examples/czech-linkedin.search.json
npm run search -- config/examples/jobs-cz.search.json
npm run search -- config/examples/nofluffjobs.search.json
```

Live searches invoke paid community Actors. `limitPerSource` is an upper bound, not a guarantee that every source will return that many matching jobs.

## Search input

The all-source example uses this shape:

```json
{
  "sourceListId": "czech",
  "instructions": {
    "criteria": {
      "query": "frontend developer, React, TypeScript",
      "geoId": "104508036",
      "workArrangements": ["remote", "hybrid"],
      "postedWithinDays": 7
    },
    "context": {
      "profile": "Experienced frontend software engineer",
      "preferences": ["remote work", "modern frontend architecture", "design systems"]
    }
  },
  "limitPerSource": 50
}
```

If `sourceIds` is omitted, every source in `sourceListId` is run. To run a subset, add for example `"sourceIds": ["jobs-cz", "nofluffjobs"]`.

`workArrangements` accepts `remote`, `hybrid`, and `onsite`. The legacy `remote: true` input remains supported temporarily and means remote-only. `postedWithinDays` and `geoId` currently affect only LinkedIn. `context` is preserved for future relevance scoring but does not yet change filtering or ordering.

## Trigger.dev

The project reference is configured in `trigger.config.ts`. Keep `APIFY_TOKEN` in `.env`, authenticate the Trigger.dev CLI, and start the development worker:

```sh
npm run trigger:dev
```

In the Trigger.dev dashboard, test the `job-search` task with the contents of `config/examples/czech-all.search.json`. Restart the worker after code or bundled configuration changes.

For a cloud deployment, configure `APIFY_TOKEN` in the Trigger.dev environment and run:

```sh
npm run trigger:deploy
```

The task has one attempt because paid Actor calls are not yet idempotent. A mixed run returns `partial` with one outcome per source; if every selected source fails, the task fails.

## Verification

Contract and orchestration tests do not use the network or an Apify token:

```sh
npm run typecheck
npm test
```

The opt-in smoke test calls all sources in the `czech` list with a small result limit and may incur Apify charges:

```sh
RUN_LIVE_SMOKE=1 npm test
```

## Project documentation

- [Current implementation and constraints](docs/CURRENT_STATE.md)
- [Implementation plan](IMPLEMENTATION_PLAN.md)
