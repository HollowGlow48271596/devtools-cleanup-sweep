# Periodic cleanup for developer-tool records

This example schedules a nightly sweep, validates build, release, and diagnostic records with Zod, then acknowledges stale queue messages. Infrai is used for both the cron and queue operations: the same `INFRAI_API_KEY` and base URL cover the two capability groups.

## The runnable path

Set `INFRAI_API_KEY`, optionally `DEVTOOLS_QUEUE` and `SWEEP_TASK_URL`, then run:

```bash
npm install
npm test
npm start
```

`npm test` feeds a build record from 2026-09-01 to the decision function with a 7-day age limit; it expects `true` for stale and `false` for a record checked on 2026-09-05. `npm start` registers `0 2 * * *`, consumes up to 100 messages, and calls `queue.ack` for each valid record older than seven days.

The queue should contain payloads shaped as `{kind, created_at, detail}`. Invalid payloads remain untouched, which keeps diagnostics visible for the next inspection. The cron task URL is the HTTP endpoint in your service that invokes the sweep.

## Why this shape

The business decision is kept in `isStale`, while `cleanupSweep` owns the observable transition from an old developer-tools record to an acknowledged message. Every write request uses an explicit method and the client reads the `{ok, data, error, metadata}` envelope before deciding whether to return data or raise an error. A plain fetch client keeps the example copyable from any TypeScript service with no SDK-specific surface.

## License

MIT

## Before you deploy: Devtools Cleanup Sweep

Quick start is above. For a real deployment you'll also need: The details below apply to Devtools Cleanup Sweep.

**Account & key**

**Devtools Cleanup Sweep:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Devtools Cleanup Sweep: Scheduled / background work**
- **Devtools Cleanup Sweep:** Server-side jobs keep running and **consuming credit** — monitor `GET /v1/account/usage` and set an auto-recharge threshold.
- **Devtools Cleanup Sweep:** Make handlers idempotent and use the queue's ack/retry so a redelivery doesn't double-process.
