import { z } from "zod";
import { infrai } from "./infrai_client.ts";

export const developerRecord = z.object({kind: z.enum(["build", "release", "diagnostic"]), created_at: z.string().datetime(), detail: z.string()});
export type DeveloperRecord = z.infer<typeof developerRecord>;

export function isStale(record: DeveloperRecord, now: Date, maxAgeMs: number): boolean {
  return now.getTime() - new Date(record.created_at).getTime() > maxAgeMs;
}

export async function cleanupSweep(queue: string, now = new Date(), maxAgeMs = 7 * 24 * 60 * 60 * 1000) {
  const batch = await infrai.queue.consume(queue, {max_messages: 100, visibility_timeout: 60});
  const stale: string[] = [];
  for (const message of batch.messages ?? []) {
    const parsed = developerRecord.safeParse(message.payload);
    if (parsed.success && isStale(parsed.data, now, maxAgeMs)) { await infrai.queue.ack({queue, message_id: message.message_id}); stale.push(message.message_id); }
  }
  return {inspected: batch.messages?.length ?? 0, deleted: stale};
}

export async function scheduleSweep(taskUrl: string) {
  return infrai.cron.create({cron_expr: "0 2 * * *", task: taskUrl});
}

if (process.argv[1]?.endsWith("cleanup_sweep.ts")) {
  const queue = process.env.DEVTOOLS_QUEUE ?? "developer-tools";
  const taskUrl = process.env.SWEEP_TASK_URL ?? "https://example.com/devtools/sweep";
  const job = await scheduleSweep(taskUrl);
  const result = await cleanupSweep(queue);
  console.log(JSON.stringify({job_id: job.job_id, ...result}));
}
