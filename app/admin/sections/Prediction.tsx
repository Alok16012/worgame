"use client";

import { useState } from "react";
import { findGame, liveBids, previewWinners } from "../../lib/engine";
import { inr, sum, ymd } from "../../lib/format";
import { normalizePana, panaDigit } from "../../lib/matka";
import { useStore } from "../../lib/store";
import type { Session } from "../../lib/types";
import { GameSelect, safe } from "../common";
import { ANK_COLORS, Btn, Card, Field, Stat, Table } from "../ui";

// Before declaring, the admin checks how much each Ank / Pana would pay out for a market session.

export function Prediction() {
  const { state: s } = useStore();
  const [f, setF] = useState<{ date: string; game: number | ""; session: Session }>({ date: ymd(), game: "", session: "open" });
  const [q, setQ] = useState(f);
  const [pana, setPana] = useState("");
  const [check, setCheck] = useState<null | { pana: string; winners: number; payout: number; amount: number; error?: string }>(null);
  const g = q.game ? findGame(s, q.game) : undefined;
  const session = g?.cat === "main" ? q.session : "open";
  const bids = g ? liveBids(s, (b) => b.gameId === g.id && b.date === q.date && b.status === "pending" && (g.cat !== "main" || b.session === session || (session === "close" && b.session === null))) : [];
  const total = sum(bids, (b) => b.amount);

  const rows = Array.from({ length: 10 }, (_, a) => {
    const d = String(a);
    const ank = bids.filter((b) => b.type === "single_ank" && b.value === d);
    const panas = bids.filter((b) => b.type.endsWith("_pana") && panaDigit(b.value) === d);
    return { d, ankAmt: sum(ank, (b) => b.amount), ankPay: sum(ank, (b) => b.amount * b.rate), panaAmt: sum(panas, (b) => b.amount), panaCount: panas.length };
  });
  const max = Math.max(1, ...rows.map((r) => r.ankPay));

  const runCheck = () => {
    if (!g) return;
    const p = normalizePana(pana);
    const res = safe(() => previewWinners(s, g.id, q.date, session, p));
    if (!res.ok) return setCheck({ pana: p, winners: 0, payout: 0, amount: 0, error: res.error });
    setCheck({ pana: p, winners: res.value.winners.length, payout: res.value.payout, amount: res.value.settledAmount });
  };

  return (
    <>
      <Card title="Prediction">
        <div className="grid sm:grid-cols-[1fr_1fr_1fr_auto] gap-4 items-end">
          <Field label="Date"><input type="date" className="admin-input" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
          <Field label="Game Name"><GameSelect all="-Select Game-" value={f.game} onChange={(v) => setF({ ...f, game: v })} /></Field>
          <Field label="Session">
            <select className="admin-input" value={f.session} onChange={(e) => setF({ ...f, session: e.target.value as Session })}><option value="open">Open</option><option value="close">Close</option></select>
          </Field>
          <Btn variant="dark" onClick={() => { setQ(f); setCheck(null); }}>Go</Btn>
        </div>
      </Card>

      {g && g.cat !== "gali" && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
            <Stat label="Pending bids" value={bids.length} />
            <Stat label="Pending amount" value={inr(total)} />
            <Stat label="Market" value={`${g.name}${g.cat === "main" ? ` · ${session === "open" ? "Open" : "Close"}` : ""}`} />
          </div>
          <Card className="mt-5" title="Check a Pana">
            <div className="flex flex-wrap gap-3 items-end">
              <Field label="Pana" className="w-40"><input className="admin-input" maxLength={3} inputMode="numeric" value={pana} onChange={(e) => setPana(e.target.value.replace(/\D/g, ""))} /></Field>
              <Btn onClick={runCheck} disabled={pana.length !== 3}>Check</Btn>
              {check && (check.error ? <span className="text-sm text-rose-600">{check.error}</span> : (
                <span className="text-sm text-slate-700">Result <b>{check.pana}-{panaDigit(check.pana)}</b>: {check.winners} winners · payout <b className="text-rose-600">{inr(check.payout)}</b> · settles {inr(check.amount)} of bids · platform <b className={check.amount - check.payout >= 0 ? "text-emerald-600" : "text-rose-600"}>{inr(check.amount - check.payout)}</b></span>
              ))}
            </div>
          </Card>
          <Card className="mt-5" title="Ank wise bids">
            <Table head={["Ank", "Single Ank Amount", "Single Ank Payout", "", "Pana Bids", "Pana Amount"]} rows={rows.map((r) => [
              <span key="a" className="inline-grid place-items-center w-7 h-7 rounded-full text-white font-bold" style={{ background: ANK_COLORS[Number(r.d)] }}>{r.d}</span>,
              inr(r.ankAmt), <b key="p">{inr(r.ankPay)}</b>,
              <div key="b" className="w-36 h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${(r.ankPay / max) * 100}%`, background: ANK_COLORS[Number(r.d)] }} /></div>,
              r.panaCount, inr(r.panaAmt),
            ])} />
          </Card>
        </>
      )}
      {g?.cat === "gali" && (
        <Card className="mt-5" title="Jodi wise bids">
          <Table head={["Type", "Number", "Bids", "Amount", "Payout if wins"]} rows={Object.values(bids.reduce<Record<string, { t: string; v: string; n: number; a: number; p: number }>>((m, b) => {
            const k = `${b.type}:${b.value}`;
            m[k] ??= { t: b.type, v: b.value, n: 0, a: 0, p: 0 };
            m[k].n++; m[k].a += b.amount; m[k].p += b.amount * b.rate;
            return m;
          }, {})).sort((a, b) => b.p - a.p).map((x) => [x.t.replace("_", " "), x.v, x.n, inr(x.a), inr(x.p)])} />
        </Card>
      )}
    </>
  );
}
