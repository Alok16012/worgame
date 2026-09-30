"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { GameError } from "./engine";
import { seedState, STATE_VERSION } from "./seed";
import type { State } from "./types";

// Shared demo database. State is persisted to localStorage and re-read on the `storage` event,
// so the player app (/) and admin panel (/admin) open in two tabs stay in sync live.
// Production would replace this with an API + database; the engine functions map 1:1 to endpoints.

const KEY = "wordgame_state_v1";

interface Store {
  state: State;
  /** Run a mutation on a copy of state. Returns the function's result, or throws GameError (state unchanged). */
  update: <R>(fn: (draft: State) => R) => R;
  /** Like update, but catches GameError and returns { error } instead of throwing. */
  attempt: <R>(fn: (draft: State) => R) => { ok: true; value: R } | { ok: false; error: string };
  reset: () => void;
}

const Ctx = createContext<Store | null>(null);

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as State;
      if (s?.v === STATE_VERSION && Array.isArray(s.users)) return s;
    }
  } catch {}
  const s = seedState();
  save(s);
  return s;
}

function save(s: State) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
}

export function StoreProvider({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const [state, setState] = useState<State | null>(null);
  const ref = useRef<State | null>(null);

  useEffect(() => {
    ref.current = load();
    setState(ref.current);
    const onStorage = (e: StorageEvent) => {
      if (e.key !== KEY) return;
      ref.current = e.newValue ? (JSON.parse(e.newValue) as State) : seedState();
      setState(ref.current);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const update = useCallback(<R,>(fn: (draft: State) => R): R => {
    const draft = structuredClone(ref.current!);
    const out = fn(draft);
    ref.current = draft;
    save(draft);
    setState(draft);
    return out;
  }, []);

  const attempt = useCallback(
    <R,>(fn: (draft: State) => R) => {
      try {
        return { ok: true as const, value: update(fn) };
      } catch (e) {
        if (e instanceof GameError) return { ok: false as const, error: e.message };
        throw e;
      }
    },
    [update],
  );

  const reset = useCallback(() => {
    ref.current = seedState();
    save(ref.current);
    setState(ref.current);
  }, []);

  const value = useMemo(() => (state ? { state, update, attempt, reset } : null), [state, update, attempt, reset]);
  if (!value) return <>{fallback}</>;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore outside StoreProvider");
  return s;
}

/** Re-render every `ms` so market open/close badges follow the clock. */
export function useNow(ms = 30000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), ms);
    return () => window.clearInterval(t);
  }, [ms]);
  return now;
}
