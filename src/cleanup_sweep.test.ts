import { strict as assert } from "node:assert";
import { developerRecord, isStale } from "./cleanup_sweep.ts";
const record = developerRecord.parse({kind: "build", created_at: "2026-09-01T00:00:00.000Z", detail: "linux"});
assert.equal(isStale(record, new Date("2026-09-10T00:00:00.000Z"), 7 * 24 * 60 * 60 * 1000), true);
assert.equal(isStale(record, new Date("2026-09-05T00:00:00.000Z"), 7 * 24 * 60 * 60 * 1000), false);
console.log("stale-record decision checks passed");
