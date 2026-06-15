import { useEffect, useState } from "react";

const KEY = "aiwp:counters";

export type CounterKey = "emails" | "notes" | "plans" | "research" | "chats";

type Counters = Record<CounterKey, number>;

const DEFAULT: Counters = { emails: 0, notes: 0, plans: 0, research: 0, chats: 0 };

function read(): Counters {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT;
    return { ...DEFAULT, ...(JSON.parse(raw) as Partial<Counters>) };
  } catch {
    return DEFAULT;
  }
}

export function bumpCounter(key: CounterKey) {
  if (typeof window === "undefined") return;
  const current = read();
  current[key] = (current[key] ?? 0) + 1;
  window.localStorage.setItem(KEY, JSON.stringify(current));
  window.dispatchEvent(new Event("aiwp:counters"));
}

export function useCounters(): Counters {
  const [counters, setCounters] = useState<Counters>(DEFAULT);
  useEffect(() => {
    setCounters(read());
    const handler = () => setCounters(read());
    window.addEventListener("aiwp:counters", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("aiwp:counters", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);
  return counters;
}
