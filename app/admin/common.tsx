"use client";

import { GameError } from "../lib/engine";
import { useStore } from "../lib/store";
import { fmtDate, fmtTime } from "../lib/format";
import { TYPE_LABEL, type Bid, type Cat, type Game } from "../lib/types";

export function GameSelect({ cat, value, onChange, all, show }: { cat?: Cat; value: number | ""; onChange: (v: number | "") => void; all?: string; show?: (g: Game) => boolean }) {
  const { state: s } = useStore();
  return (
    <select className="admin-input" value={value} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : "")}>
      {all !== undefined && <option value="">{all}</option>}
      {s.games.filter((g) => (!cat || g.cat === cat) && (!show || show(g))).map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
    </select>
  );
}

/** "2026-09-30 21:40" → "30 Sep 2026 09:40 PM" */
export const fmtStamp = (st?: string | null) => (st ? `${fmtDate(st.slice(0, 10))} ${fmtTime(st.slice(11, 16))}` : "—");

export const bidTypeLabel = (b: Bid) => (b.type === "half_sangam" ? (b.session === "open" ? "Half Sangam A" : "Half Sangam B") : TYPE_LABEL[b.type]);
export const sessionLabel = (b: Bid) => (b.session ? (b.session === "open" ? "Open" : "Close") : "—");

/** Run a read-only engine call (e.g. a preview) and turn a GameError into a message. */
export function safe<T>(fn: () => T): { ok: true; value: T } | { ok: false; error: string } {
  try {
    return { ok: true, value: fn() };
  } catch (e) {
    if (e instanceof GameError) return { ok: false, error: e.message };
    throw e;
  }
}
