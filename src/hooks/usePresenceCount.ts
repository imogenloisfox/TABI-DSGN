"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "tabi-presence-session";
const HEARTBEAT_MS = 22_000;
const POLL_MS = 9_000;

function getOrCreateSessionId(): string {
  try {
    let id = sessionStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

/**
 * Registers this tab via `/api/presence` heartbeats and polls for the current online count.
 */
export function usePresenceCount(enabled = true) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const sessionId = getOrCreateSessionId();
    let cancelled = false;

    const postHeartbeat = async () => {
      try {
        const res = await fetch("/api/presence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { count?: number };
        if (typeof data.count === "number") setCount(data.count);
      } catch {
        /* offline or API missing */
      }
    };

    const getCount = async () => {
      try {
        const res = await fetch("/api/presence");
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { count?: number };
        if (typeof data.count === "number") setCount(data.count);
      } catch {
        /* ignore */
      }
    };

    void postHeartbeat();
    const hb = window.setInterval(() => void postHeartbeat(), HEARTBEAT_MS);
    const poll = window.setInterval(() => void getCount(), POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(hb);
      window.clearInterval(poll);
    };
  }, [enabled]);

  return count;
}
