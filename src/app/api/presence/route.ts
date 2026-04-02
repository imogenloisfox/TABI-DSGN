import { NextRequest } from "next/server";

/**
 * In-memory presence for open customiser sessions. Prunes stale heartbeats by TTL.
 * Accurate on a single long-lived Node process (`next dev`, `next start` on one instance).
 * For serverless multi-instance deploys, swap this store for Redis / Upstash / PartyKit.
 */
export const runtime = "nodejs";

const TTL_MS = 45_000;

type PresenceStore = Map<string, number>;

function getStore(): PresenceStore {
  const g = globalThis as typeof globalThis & { __tabiPresenceStore?: PresenceStore };
  if (!g.__tabiPresenceStore) g.__tabiPresenceStore = new Map();
  return g.__tabiPresenceStore;
}

function prune(store: PresenceStore) {
  const now = Date.now();
  for (const [id, t] of store) {
    if (now - t > TTL_MS) store.delete(id);
  }
}

export async function GET() {
  const store = getStore();
  prune(store);
  return Response.json({ count: store.size });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return Response.json({ error: "invalid body" }, { status: 400 });
  }
  const sessionId = (body as { sessionId?: unknown }).sessionId;
  if (typeof sessionId !== "string" || sessionId.length < 8 || sessionId.length > 128) {
    return Response.json({ error: "invalid sessionId" }, { status: 400 });
  }

  const store = getStore();
  prune(store);
  store.set(sessionId, Date.now());
  return Response.json({ count: store.size });
}
