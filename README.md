# Job Search Aggregator

The first vertical slice of a job-offer aggregator: source-list configuration, validated input, LinkedIn Actor via Apify, normalized `JobResult`, CLI, and a Trigger.dev task.

## Local setup

Requires Node.js 26 and `APIFY_TOKEN` in `.env` (see `.env.example`).

```sh
npm install
cp .env.example .env
npm run search -- config/examples/czech-linkedin.search.json
```

The CLI prints both a human-readable summary and structured JSON. A real run calls a paid community Apify Actor; automated tests do not require network access or a token.

## Verification

```sh
npm run typecheck
npm test
```

## Trigger.dev

Set `TRIGGER_PROJECT_REF` and `TRIGGER_SECRET_KEY`, log in to the Trigger.dev CLI, and run:

```sh
npm run trigger:dev
npm run trigger:deploy
```

The `job-search` task can be triggered manually from the dashboard using the payload in `config/examples/czech-linkedin.search.json`. Retries are intentionally limited to one attempt because of possible duplicate Apify costs.

## Configuration

Add a new source list as JSON under `config/source-lists/`; its `sourceIds` must reference sources in `config/sources.json`. No domain logic changes are required.
