"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { GameError } from "./engine";
import { seedState, STATE_VERSION } from "./seed";
import type { State } from "./types";
import { supabase, isSupabaseConfigured } from "./supabase";

// Shared demo database. State is persisted to localStorage and re-read on the `storage` event.
// When Supabase is configured, it syncs to the cloud live across all devices with Supabase Realtime!

const KEY = "wordgame_state_v1";

interface Store {
  state: State;
  /** Run a mutation on a copy of state. Returns the function's result, or throws GameError (state unchanged). */
  update: <R>(fn: (draft: State) => R) => R;
  /** Like update, but catches GameError and returns { error } instead of throwing. */
  attempt: <R>(fn: (draft: State) => R) => { ok: true; value: R } | { ok: false; error: string };
  reset: () => void;
  isCloudSynced: boolean;
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
  const [isCloudSynced, setIsCloudSynced] = useState(false);
  const ref = useRef<State | null>(null);

  // Sync state to Supabase in the background
  const syncToCloud = useCallback(async (s: State) => {
    if (!isSupabaseConfigured()) return;
    try {
      await supabase.from("wordgame_state").upsert({
        id: "current",
        state: s,
        version: s.v,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn("Supabase sync warning:", e);
    }
  }, []);

  useEffect(() => {
    // 1. Load locally first for instant display
    const initial = load();
    ref.current = initial;
    setState(initial);

    const onStorage = (e: StorageEvent) => {
      if (e.key !== KEY) return;
      ref.current = e.newValue ? (JSON.parse(e.newValue) as State) : seedState();
      setState(ref.current);
    };
    window.addEventListener("storage", onStorage);

    // 2. If Supabase configured, load and subscribe to Realtime
    if (isSupabaseConfigured()) {
      (async () => {
        try {
          const { data, error } = await supabase
            .from("wordgame_state")
            .select("state")
            .eq("id", "current")
            .single();

          if (!error && data?.state && (data.state as State)?.v === STATE_VERSION) {
            const remoteState = data.state as State;
            ref.current = remoteState;
            save(remoteState);
            setState(remoteState);
            setIsCloudSynced(true);
          } else {
            // Row not found or old demo data version mismatch: push new clean production state to cloud
            await supabase.from("wordgame_state").upsert({
              id: "current",
              state: initial,
              version: initial.v,
              updated_at: new Date().toISOString(),
            });
            setIsCloudSynced(true);
          }
        } catch (e) {
          console.warn("Could not load from Supabase:", e);
        }
      })();

      const channel = supabase
        .channel("wordgame_realtime_sync")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "wordgame_state", filter: "id=eq.current" },
          (payload: any) => {
            const newState = payload.new?.state as State;
            if (newState && newState.v === STATE_VERSION) {
              ref.current = newState;
              save(newState);
              setState(newState);
              setIsCloudSynced(true);
            }
          }
        )
        .subscribe();

      return () => {
        window.removeEventListener("storage", onStorage);
        supabase.removeChannel(channel);
      };
    }

    return () => window.removeEventListener("storage", onStorage);
  }, [syncToCloud]);

  const update = useCallback(
    <R,>(fn: (draft: State) => R): R => {
      const draft = structuredClone(ref.current!);
      const out = fn(draft);
      ref.current = draft;
      save(draft);
      setState(draft);
      syncToCloud(draft);
      return out;
    },
    [syncToCloud]
  );

  const attempt = useCallback(
    <R,>(fn: (draft: State) => R) => {
      try {
        return { ok: true as const, value: update(fn) };
      } catch (e) {
        if (e instanceof GameError) return { ok: false as const, error: e.message };
        throw e;
      }
    },
    [update]
  );

  const reset = useCallback(() => {
    const s = seedState();
    ref.current = s;
    save(s);
    setState(s);
    syncToCloud(s);
  }, [syncToCloud]);

  const value = useMemo(
    () => (state ? { state, update, attempt, reset, isCloudSynced } : null),
    [state, update, attempt, reset, isCloudSynced]
  );

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

