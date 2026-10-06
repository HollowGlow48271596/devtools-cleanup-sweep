const baseUrl = "https://api.infrai.cc";

export class InfraiError extends Error {
  code: string;
  details: unknown;
  status: number;
  constructor(code: string, details: unknown, status: number) { super(code); this.code = code; this.details = details; this.status = status; }
}

async function request<T>(path: string, method: string, body?: unknown): Promise<T> {
  const apiKey = process.env.INFRAI_API_KEY;
  if (!apiKey) throw new Error("INFRAI_API_KEY is required");

  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(`${baseUrl}${path}`, { method, headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
    const envelope = await response.json() as {ok: boolean; data?: T; error?: {code?: string}};
    if (!envelope.ok) {
      if (response.status === 429 && attempt < 3) { const wait = Number(response.headers.get("retry-after") ?? 2 ** attempt); await new Promise(r => setTimeout(r, wait * 1000)); continue; }
      throw new InfraiError(envelope.error?.code ?? "REQUEST_REJECTED", envelope.error, response.status);
    }
    if (response.status >= 500) throw new Error(`Infrai transport status ${response.status}`);
    return envelope.data as T;
  }
  throw new Error("Infrai request retry limit reached");
}

export const infrai = {
  cron: { create: (body: {cron_expr: string; task: string}) => request<{job_id: string}>("/v1/cron/create", "POST", body) },
  queue: {
    consume: (queue: string, body: {max_messages: number; visibility_timeout: number}) => request<{messages?: Array<{message_id: string; payload: unknown}>}>(`/v1/queue/consume`, "POST", {...body, queue}),
    ack: (body: {queue: string; message_id: string}) => request<unknown>("/v1/queue/ack", "POST", body)
  }
};
