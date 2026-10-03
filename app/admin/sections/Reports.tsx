"use client";

import { useState } from "react";
import { Download, Pencil } from "lucide-react";
import { findGame, findUser } from "../../lib/engine";
import { addDays, fmtDate, fmtTime, inr, sum, ymd } from "../../lib/format";
import { byAnk, numbersFor } from "../../lib/matka";
import { useStore } from "../../lib/store";
import { CAT_LABEL, CAT_TYPES, TYPE_LABEL, type Bid, type Cat, type GameType, type Session } from "../../lib/types";
import { bidTypeLabel, GameSelect, sessionLabel } from "../common";
import { BidBadge, Btn, Card, DataTable, Field, Stat } from "../ui";
import { EditBidModal } from "../EditBid";

function downloadCsv(name: string, head: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([[head, ...rows].map((r) => r.map(esc).join(",")).join("\n")], { type: "text/csv" }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function BidHistory({ cat }: { cat?: Cat }) {
  const { state: s } = useStore();
  const types = cat ? CAT_TYPES[cat] : CAT_TYPES.main;
  const [draft, setDraft] = useState<{ from: string; to: string; game: number | ""; type: GameType | ""; session: Session | "" }>({ from: addDays(-1), to: ymd(), game: "", type: "", session: "" });
  const [f, setF] = useState(draft);
  const list = s.bids.filter((b) => {
    const g = findGame(s, b.gameId);
    return b.date >= f.from && b.date <= f.to && (cat ? g?.cat === cat : true) && (!f.game || b.gameId === f.game) && (!f.type || b.type === f.type) && (!f.session || b.session === f.session);
  }).slice().reverse();
  const live = list.filter((b) => b.status !== "reverted");
  const amt = sum(live, (b) => b.amount), win = sum(live, (b) => b.win ?? 0);
  const [editing, setEditing] = useState<Bid | null>(null);

  return (
    <>
      <Card title={cat ? `${CAT_LABEL[cat]} Bid History` : "Bid History Report"} right={
        <Btn variant="ghost" size="sm" onClick={() => downloadCsv(`bids-${f.from}-${f.to}.csv`, ["User", "Mobile", "Game", "Type", "Session", "Number", "Amount", "Win", "Status", "Date", "Time"],
          list.map((b) => { const u = findUser(s, b.userId)!; return [u.name, u.mobile, findGame(s, b.gameId)?.name ?? "", bidTypeLabel(b), sessionLabel(b), b.value, b.amount, b.win ?? 0, b.status, b.date, b.time]; }))}><Download size={14} /> Export</Btn>}>
        <div className="grid sm:grid-cols-3 xl:grid-cols-[1fr_1fr_1.4fr_1fr_1fr_auto] gap-4 items-end">
          <Field label="From Date"><input type="date" className="admin-input" value={draft.from} onChange={(e) => setDraft({ ...draft, from: e.target.value })} /></Field>
          <Field label="To Date"><input type="date" className="admin-input" value={draft.to} onChange={(e) => setDraft({ ...draft, to: e.target.value })} /></Field>
          <Field label="Game Name"><GameSelect cat={cat} all="All Game" value={draft.game} onChange={(v) => setDraft({ ...draft, game: v })} /></Field>
          <Field label="Game Type">
            <select className="admin-input" value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as GameType | "" })}><option value="">All Type</option>{types.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}</select>
          </Field>
          {cat === "main" || !cat ? (
            <Field label="Session"><select className="admin-input" value={draft.session} onChange={(e) => setDraft({ ...draft, session: e.target.value as Session | "" })}><option value="">All</option><option value="open">Open</option><option value="close">Close</option></select></Field>
          ) : <div />}
          <Btn onClick={() => setF(draft)}>Submit</Btn>
        </div>
      </Card>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 my-5">
        <Stat label="Total Bids" value={list.length} />
        <Stat label="Bid Amount" value={inr(amt)} />
        <Stat label="Winning Amount" value={inr(win)} tone="red" />
        <Stat label="Profit" value={inr(amt - win)} tone={amt - win >= 0 ? "green" : "red"} />
      </div>
      <Card>
        <DataTable head={["Sr No", "User Name", "Mobile", "Game Name", "Game Type", "Session", "Number", "Amount", "Win", "Status", "Bid Time", "Action"]}
          rows={list.map((b, i) => { const u = findUser(s, b.userId)!; return [i + 1, u.name, u.mobile, findGame(s, b.gameId)?.name, bidTypeLabel(b), sessionLabel(b), <b key="v">{b.value}</b>, b.amount, b.win ?? "—", <BidBadge key="s" s={b.status} />, `${fmtDate(b.date)} ${fmtTime(b.time)}`,
            b.status === "pending" ? <Btn key="e" size="sm" variant="ghost" onClick={() => setEditing(b)}><Pencil size={12} /> Edit</Btn> : ""]; })}
          text={list.map((b) => { const u = findUser(s, b.userId)!; return `${u.name} ${u.mobile} ${b.value}`; })} />
      </Card>
      {editing && <EditBidModal bid={editing} onClose={() => setEditing(null)} />}
    </>
  );
}

/** Number-wise sell: how much was bid on every number of a game type for a market/session. */
export function CustomerSell() {
  const { state: s } = useStore();
  const [draft, setDraft] = useState<{ date: string; game: number | ""; type: GameType; session: Session }>({ date: ymd(), game: "", type: "single_ank", session: "open" });
  const [f, setF] = useState(draft);
  const g = f.game ? findGame(s, f.game) : undefined;
  const sessioned = g?.cat === "main" && f.type !== "jodi" && f.type !== "full_sangam";
  const bids = g ? s.bids.filter((b) => b.gameId === g.id && b.date === f.date && b.type === f.type && b.status !== "reverted" && (!sessioned || b.session === f.session)) : [];
  const amountOf = (v: string) => sum(bids.filter((b) => b.value === v), (b) => b.amount);
  const list = numbersFor(f.type);
  const types = g ? CAT_TYPES[g.cat] : CAT_TYPES.main;

  const cell = (v: string) => {
    const a = amountOf(v);
    return <div key={v} className={`rounded border text-center py-1.5 ${a ? "border-[#0d6efd] bg-[#0d6efd]/5" : "border-slate-200"}`}><div className="text-sm font-semibold text-slate-800">{v}</div><div className={`text-xs ${a ? "text-[#0d6efd] font-semibold" : "text-slate-400"}`}>{a}</div></div>;
  };

  return (
    <>
      <Card title="Customer Sell Report">
        <div className="grid sm:grid-cols-2 xl:grid-cols-[1fr_1.4fr_1fr_1fr_auto] gap-4 items-end">
          <Field label="Date"><input type="date" className="admin-input" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} /></Field>
          <Field label="Game Name"><GameSelect all="-Select Game Name-" value={draft.game} onChange={(v) => setDraft({ ...draft, game: v, type: v && findGame(s, v)?.cat === "gali" ? "jodi" : "single_ank" })} /></Field>
          <Field label="Game Type"><select className="admin-input" value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as GameType })}>{(draft.game ? CAT_TYPES[findGame(s, draft.game)!.cat] : types).map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}</select></Field>
          <Field label="Session"><select className="admin-input" value={draft.session} onChange={(e) => setDraft({ ...draft, session: e.target.value as Session })}><option value="open">Open</option><option value="close">Close</option></select></Field>
          <Btn onClick={() => setF(draft)}>Submit</Btn>
        </div>
      </Card>
      {g && (
        <Card className="mt-5" title={`${g.name} · ${TYPE_LABEL[f.type]}${sessioned ? ` · ${f.session === "open" ? "Open" : "Close"}` : ""} · ${fmtDate(f.date)}`} right={<span className="text-sm text-slate-600">Total <b>{inr(sum(bids, (b) => b.amount))}</b> on {bids.length} bids</span>}>
          {list.length ? (
            f.type.endsWith("_pana") ? byAnk(list).map((grp) => (
              <div key={grp.ank} className="mb-4"><div className="text-sm font-semibold mb-2">Ank {grp.ank}</div><div className="grid grid-cols-4 sm:grid-cols-8 lg:grid-cols-12 gap-2">{grp.items.map(cell)}</div></div>
            )) : <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">{list.map(cell)}</div>
          ) : (
            <DataTable head={["Number", "Bids", "Amount"]} rows={Object.entries(bids.reduce<Record<string, number[]>>((m, b) => { (m[b.value] ??= []).push(b.amount); return m; }, {})).sort((a, b) => sum(b[1], (x) => x) - sum(a[1], (x) => x)).map(([v, a]) => [v, a.length, inr(sum(a, (x) => x))])} />
          )}
        </Card>
      )}
    </>
  );
}
