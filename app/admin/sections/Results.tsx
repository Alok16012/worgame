"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { declarePreview, declareResult, exposure, findGame, findUser, liveBids, marketStatus, resultOf, revertBids } from "../../lib/engine";
import { fmtDate, fmtTime, inr, sum, ymd } from "../../lib/format";
import { useStore } from "../../lib/store";
import { CAT_ICON, CAT_LABEL, type Cat } from "../../lib/types";
import { ANK_COLORS, AnkPicker, BidBadge, Btn, Card, Field, Stat, StatusBadge, Table, Title, useAdmin } from "../ui";

function GameSelect({ cat, value, onChange, all }: { cat?: Cat; value: number | ""; onChange: (v: number | "") => void; all?: string }) {
  const { state: s } = useStore();
  return (
    <select className="admin-input" value={value} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : "")}>
      {all && <option value="">{all}</option>}
      {s.games.filter((g) => !cat || g.cat === cat).map((g) => <option key={g.id} value={g.id}>{g.name}{cat ? "" : ` — ${CAT_LABEL[g.cat]}`}</option>)}
    </select>
  );
}
export { GameSelect };

export function DeclareResult({ cat, initialGame }: { cat: Cat; initialGame?: number }) {
  const { state: s, attempt } = useStore();
  const { confirm, toast } = useAdmin();
  const games = s.games.filter((g) => g.cat === cat);
  const [gameId, setGameId] = useState<number | "">(games.some((g) => g.id === initialGame) ? initialGame! : (games[0]?.id ?? ""));
  const [date, setDate] = useState(ymd());
  const [ank, setAnk] = useState<number | null>(null);
  const g = gameId ? findGame(s, gameId) : undefined;
  const existing = g ? resultOf(s, g.id, date) : undefined;
  const pv = g ? declarePreview(s, g.id, date, ank) : null;

  const declare = async () => {
    if (!g || ank === null || !pv) return;
    const ok = await confirm({
      title: "Confirm result",
      body: <>You are declaring <b>Ank {ank}</b> for <b>{g.name}</b> on <b>{fmtDate(date)}</b>.<br />{pv.winners.length} winning bids will be paid <b>{inr(pv.payout)}</b>. This cannot be undone.</>,
      ok: "Declare Result",
      requireText: String(ank),
    });
    if (!ok) return;
    const r = attempt((d) => declareResult(d, g.id, date, ank));
    if (r.ok) { toast(`Result declared — ${r.value.winners} winners paid ${inr(r.value.payout)}`, "ok"); setAnk(null); }
    else toast(r.error, "bad");
  };

  const history = s.results.filter((r) => findGame(s, r.gameId)?.cat === cat).slice().reverse().slice(0, 40);

  return (
    <>
      <Title t={`${CAT_ICON[cat]} Declare ${CAT_LABEL[cat]} Result`} s="Pick the market, date and winning Ank. Winners are paid Bid × Rate instantly." />
      <div className="grid xl:grid-cols-[1.3fr_1fr] gap-4">
        <Card>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Game Name"><GameSelect cat={cat} value={gameId} onChange={(v) => { setGameId(v); setAnk(null); }} /></Field>
            <Field label="Result Date"><input type="date" className="admin-input" value={date} max={ymd()} onChange={(e) => { setDate(e.target.value); setAnk(null); }} /></Field>
          </div>
          {g && <div className="flex items-center gap-2 text-xs text-slate-500 mt-3">Market {fmtTime(g.open)} – {fmtTime(g.close)} · Rate {g.rate}x · <StatusBadge s={marketStatus(s, g, date)} /></div>}
          {existing ? (
            <div className="mt-5 rounded-xl bg-brand-50 text-brand-700 px-4 py-3 text-sm">✅ Result already declared for <b>{g?.name}</b> on {fmtDate(date)}: <b>Ank {existing.ank}</b> (at {existing.at})</div>
          ) : g && pv ? (
            <>
              <div className="text-xs font-semibold text-slate-500 mt-5 mb-2">Winning Ank</div>
              <AnkPicker selected={ank} onPick={setAnk} />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
                <Stat label="Pending bids" value={pv.pending.length} sub={inr(pv.total)} />
                <Stat label="Winners" value={ank === null ? "—" : pv.winners.length} />
                <Stat label="Payout" value={ank === null ? "—" : inr(pv.payout)} tone="red" />
                <Stat label="Profit" value={ank === null ? "—" : inr(pv.profit)} tone={pv.profit >= 0 ? "green" : "red"} />
              </div>
              <Btn className="w-full mt-4 !py-3" disabled={ank === null} onClick={declare}>{ank === null ? "Select an Ank" : `Declare Ank ${ank} for ${g.name}`}</Btn>
            </>
          ) : <p className="text-sm text-slate-400 mt-4">No games in this category yet.</p>}
        </Card>
        <Card title="What happens on Declare">
          <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-600">
            <li>The result is saved once per market per date. It cannot be declared twice.</li>
            <li>Pending bids on the winning Ank become <BidBadge s="won" /> and the wallet is credited <b>amount × rate</b>.</li>
            <li>All other pending bids become <BidBadge s="lost" />.</li>
            <li>Users get a result notification in the app, and the action is written to the Activity Log.</li>
          </ol>
          <div className="flex gap-2 items-start mt-4 rounded-xl bg-amber-50 text-amber-800 px-4 py-3 text-sm">
            <ShieldCheck size={18} className="shrink-0 mt-0.5" /> Admin must re-type the Ank to confirm. Check Prediction first to see each Ank's payout.
          </div>
        </Card>
      </div>

      <Card className="mt-4" title={`Result History — ${CAT_LABEL[cat]}`}>
        <Table head={["Date", "Game", "Result", "Bids", "Bid Amount", "Winners", "Payout", "Profit", "Declared At"]}
          rows={history.map((r) => {
            const b = liveBids(s, (x) => x.gameId === r.gameId && x.date === r.date);
            const w = b.filter((x) => x.status === "won");
            const amt = sum(b, (x) => x.amount), pay = sum(w, (x) => x.win ?? 0);
            return [fmtDate(r.date), <b key="g" className="text-slate-900">{findGame(s, r.gameId)?.name}</b>,
              <span key="a" className="inline-grid place-items-center w-7 h-7 rounded-full bg-brand-600 text-white font-bold">{r.ank}</span>,
              b.length, inr(amt), w.length, inr(pay), <b key="p" className={amt - pay >= 0 ? "text-emerald-600" : "text-rose-600"}>{inr(amt - pay)}</b>, r.at];
          })} />
      </Card>
    </>
  );
}

export function Prediction() {
  const { state: s } = useStore();
  const [gameId, setGameId] = useState<number | "">(s.games[0]?.id ?? "");
  const [date, setDate] = useState(ymd());
  const g = gameId ? findGame(s, gameId) : undefined;
  if (!g) return <Title t="Prediction" s="No games configured." />;
  const ex = exposure(s, g.id, date);
  const res = resultOf(s, g.id, date);
  const maxPay = Math.max(1, ...ex.rows.map((r) => r.payout));
  const worst = ex.rows.reduce((a, b) => (b.payout > a.payout ? b : a));
  return (
    <>
      <Title t="Prediction" s="Exposure analysis: how much the platform would pay if each Ank wins." />
      <Card>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Game"><GameSelect value={gameId} onChange={setGameId} /></Field>
          <Field label="Date"><input type="date" className="admin-input" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          <Stat label="Market" value={<span className="flex items-center gap-2 text-base">{g.name} <StatusBadge s={marketStatus(s, g, date)} /></span>} sub={`${fmtTime(g.open)} – ${fmtTime(g.close)}`} />
          <Stat label="Total Bids" value={ex.count} />
          <Stat label="Total Bid Amount" value={inr(ex.total)} />
          <Stat label={res ? "Declared Result" : "Highest exposure"} value={res ? `Ank ${res.ank}` : worst.payout ? `Ank ${worst.ank} · ${inr(worst.payout)}` : "—"} tone={res ? undefined : "red"} />
        </div>
      </Card>
      <Card className="mt-4">
        <Table max={false} head={["Ank", "Bids", "Bid Amount", `Payout if wins (${g.rate}x)`, "Share of max payout", "Platform P/L if wins"]}
          rows={ex.rows.map((r) => [
            <span key="a" className="inline-flex items-center gap-2"><span className="inline-grid place-items-center w-7 h-7 rounded-full text-white font-bold" style={{ background: ANK_COLORS[r.ank] }}>{r.ank}</span>{res?.ank === r.ank && "🏆"}</span>,
            r.count, inr(r.amount), <b key="p">{inr(r.payout)}</b>,
            <div key="b" className="w-40 h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${(r.payout / maxPay) * 100}%`, background: ANK_COLORS[r.ank] }} /></div>,
            <b key="pl" className={r.pl >= 0 ? "text-emerald-600" : "text-rose-600"}>{inr(r.pl)}</b>,
          ])} />
      </Card>
    </>
  );
}

export function BidRevert({ cat }: { cat: Cat }) {
  const { state: s, attempt } = useStore();
  const { confirm, toast } = useAdmin();
  const games = s.games.filter((g) => g.cat === cat);
  const [gameId, setGameId] = useState<number | "">(games[0]?.id ?? "");
  const [date, setDate] = useState(ymd());
  const list = s.bids.filter((b) => b.gameId === gameId && b.date === date && b.status === "pending");

  const run = async (only?: number) => {
    if (!gameId) return;
    const target = only ? list.filter((b) => b.id === only) : list;
    const ok = await confirm({ title: "Revert bids", body: <>Refund <b>{target.length}</b> bid(s) totalling <b>{inr(sum(target, (b) => b.amount))}</b> to user wallets?</>, ok: "Revert & Refund", tone: "red" });
    if (!ok) return;
    const r = attempt((d) => revertBids(d, gameId, date, only));
    if (r.ok) toast(`${r.value.count} bids reverted · ${inr(r.value.total)} refunded`, "ok"); else toast(r.error, "bad");
  };

  return (
    <>
      <Title t={`${CAT_ICON[cat]} ${CAT_LABEL[cat]} Bid Revert`} s="Refund pending bids to wallets when a market is cancelled or bids were placed in error. Declared bids cannot be reverted." />
      <Card>
        <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
          <Field label="Game"><GameSelect cat={cat} value={gameId} onChange={setGameId} /></Field>
          <Field label="Date"><input type="date" className="admin-input" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Btn variant="red" disabled={!list.length} onClick={() => run()}>Revert All ({list.length}) · {inr(sum(list, (b) => b.amount))}</Btn>
        </div>
      </Card>
      <Card className="mt-4">
        <Table empty="No pending bids for this game and date" head={["Bid ID", "User", "Mobile", "Ank", "Amount", "Time", "Status", ""]}
          rows={list.map((b) => { const u = findUser(s, b.userId)!; return [`#${b.id}`, u.name, u.mobile, <b key="a">{b.ank}</b>, inr(b.amount), fmtTime(b.time), <BidBadge key="s" s={b.status} />, <Btn key="r" size="sm" variant="ghost" onClick={() => run(b.id)}>Revert</Btn>]; })} />
      </Card>
    </>
  );
}
