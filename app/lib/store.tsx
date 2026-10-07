"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { GameError } from "./engine";
import { seedState, STATE_VERSION } from "./seed";
import { MODULES, type State } from "./types";
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
  reloadFromCloud: () => Promise<State | null>;
  isCloudSynced: boolean;
}

const Ctx = createContext<Store | null>(null);

function normalize(s: State): State {
  if (!s.ideas) s.ideas = [];
  if (!s.admins || !Array.isArray(s.admins) || s.admins.length === 0) {
    s.admins = [
      {
        id: 999,
        name: "Master Admin",
        username: "admin",
        password: "admin@777",
        role: "Super Admin",
        active: true,
      },
    ];
  }
  if (!s.roles || !Array.isArray(s.roles) || s.roles.length === 0) {
    s.roles = [
      { id: 1, name: "Super Admin", perms: [...MODULES] },
      { id: 2, name: "Result Manager", perms: ["Dashboard", "Declare Result", "Prediction", "Games", "Starline", "Galidesawar", "Reports"] },
      { id: 3, name: "Accountant", perms: ["Dashboard", "Wallet", "Withdraw", "Reports"] },
    ];
  }
  if (s.users) {
    for (const u of s.users) {
      if (u.betting === undefined) u.betting = true;
    }
  }
  if (s.settings) {
    if (s.settings.bettingDisabled === undefined) s.settings.bettingDisabled = false;
    if (s.settings.quizTitle === undefined) s.settings.quizTitle = "Market Educational Quiz";
    if (s.settings.quizTimeLimit === undefined) s.settings.quizTimeLimit = 90;
    if (s.settings.otpEnabled === undefined) s.settings.otpEnabled = true;
    if (!s.settings.otpApiKey) s.settings.otpApiKey = "a0cb5b35-bdb3-425b-a648-2a0561771322";
    if (!s.settings.smsUsername) s.settings.smsUsername = "8952074176";
    if (!s.settings.smsSenderName) s.settings.smsSenderName = "SKLYAN";
    if (!s.settings.smsMessageTemplate) s.settings.smsMessageTemplate = "Your verification OTP is {OTP}. Please do not share it with anyone.";
  }
  if (s.users && Array.isArray(s.users)) {
    const validUserIds = new Set(s.users.map((u) => u.id));
    if (s.txns && Array.isArray(s.txns)) {
      s.txns = s.txns.filter((x) => validUserIds.has(x.userId));
    }
    if (s.bids && Array.isArray(s.bids)) {
      s.bids = s.bids.filter((b) => validUserIds.has(b.userId));
    }
  }
  return s;
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as State;
      if (s?.v === STATE_VERSION && Array.isArray(s.users)) return normalize(s);
    }
  } catch {}
  const s = normalize(seedState());
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

  const reloadFromCloud = useCallback(async (): Promise<State | null> => {
    if (!isSupabaseConfigured()) return null;
    try {
      const { data, error } = await supabase
        .from("wordgame_state")
        .select("state")
        .eq("id", "current")
        .single();

      if (!error && data?.state && Array.isArray((data.state as any).users)) {
        const remoteState = normalize(data.state as State);
        ref.current = remoteState;
        save(remoteState);
        setState(remoteState);
        setIsCloudSynced(true);
        return remoteState;
      }
    } catch (e) {
      console.warn("Could not reload from Supabase:", e);
    }
    return null;
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
      reloadFromCloud();

      const channel = supabase
        .channel("wordgame_realtime_sync")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "wordgame_state", filter: "id=eq.current" },
          (payload: any) => {
            const newState = payload.new?.state as State;
            if (newState && Array.isArray(newState.users)) {
              const remoteState = normalize(newState);
              ref.current = remoteState;
              save(remoteState);
              setState(remoteState);
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
  }, [reloadFromCloud]);

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
    () => (state ? { state, update, attempt, reset, reloadFromCloud, isCloudSynced } : null),
    [state, update, attempt, reset, reloadFromCloud, isCloudSynced]
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

