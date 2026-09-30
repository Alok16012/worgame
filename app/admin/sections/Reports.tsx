"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { findGame, findUser } from "../../lib/engine";
import { addDays, fmtDate, fmtTime, inr, sum, ymd } from "../../lib/format";
import { useStore } from "../../lib/store";
import { CAT_LABEL, type BidStatus, type Cat } from "../../lib/types";
import { BidBadge, Btn, Card, Field, Stat, Table, Title } from "../ui";
import { GameSelect } from "./Results";

function downloadCsv(name: string, head: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [head, ...rows].map((r) => r.map(esc).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function BidHistory({ cat }: { cat?: Cat }) {
  const { state: s } = useStore();
  const [draft, setDraft] = useState({ from: addDays(-6), to: ymd(), game: "" as number | "", status: "" as BidStatus | "", q: "" });
  const [f, setF] = useState(draft);
  const list = s.bids.filter((b) => {
    const g = findGame(s, b.gameId), u = findUser(s, b.userId)!;
    return b.date >= f.from && b.date <= f.to && (!cat || g?.cat === cat) && (!f.game || b.gameId === f.game) && (!f.status || b.status === f.status)
      && (!f.q || u.name.toLowerCase().includes(f.q.toLowerCase()) || u.mobile.includes(f.q));
  }).slice().reverse();
  const live = list.filter((b) => b.status !== "reverted");
  const amt = sum(live, (b) => b.amount), win = sum(live, (b) => b.win ?? 0);

  const rowsCsv = () => list.map((b) => { const u = findUser(s, b.userId)!; return [b.id, b.date, b.time, u.name, u.mobile, findGame(s, b.gameId)?.name ?? "", b.ank, b.amount, b.rate, b.win ?? 0, b.status]; });

  return (
    <>
      <Title t={cat ? `${CAT_LABEL[cat]} Bid History` : "Bid History Report"} s="Every bid with its outcome. Filter, then export to CSV."
        right={<Btn variant="ghost" size="sm" onClick={() => downloadCsv(`bids-${f.from}-to-${f.to}.csv`, ["Bid ID", "Date", "Time", "User", "Mobile", "Game", "Ank", "Amount", "Rate", "Win", "Status"], rowsCsv())}><Download size={14} /> Export CSV</Btn>} />
      <Card>
        <div className="grid sm:grid-cols-3 xl:grid-cols-[1fr_1fr_1.3fr_1fr_1.3fr_auto] gap-3 items-end">
          <Field label="From"><input type="date" className="admin-input" value={draft.from} onChange={(e) => setDraft({ ...draft, from: e.target.value })} /></Field>
          <Field label="To"><input type="date" className="admin-input" value={draft.to} onChange={(e) => setDraft({ ...draft, to: e.target.value })} /></Field>
          <Field label="Game"><GameSelect cat={cat} all="All Games" value={draft.game} onChange={(v) => setDraft({ ...draft, game: v })} /></Field>
          <Field label="Status">
            <select className="admin-input" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as BidStatus | "" })}>
              <option value="">All</option><option value="pending">Pending</option><option value="won">Won</option><option value="lost">Lost</option><option value="reverted">Reverted</option>
            </select>
          </Field>
          <Field label="User"><input className="admin-input" placeholder="Name / mobile" value={draft.q} onChange={(e) => setDraft({ ...draft, q: e.target.value })} /></Field>
          <Btn onClick={() => setF(draft)}>Filter</Btn>
        </div>
      </Card>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 my-4">
        <Stat label="Bids" value={list.length} />
        <Stat label="Bid Amount" value={inr(amt)} />
        <Stat label="Winning Amount" value={inr(win)} tone="red" />
        <Stat label="Profit" value={inr(amt - win)} tone={amt - win >= 0 ? "green" : "red"} />
      </div>
      <Card>
        <Table head={["Bid ID", "Date", "User", "Mobile", "Game", "Ank", "Amount", "Rate", "Win", "Status"]} rows={list.slice(0, 400).map((b) => {
          const u = findUser(s, b.userId)!;
          return [`#${b.id}`, `${fmtDate(b.date)} ${fmtTime(b.time)}`, u.name, u.mobile, findGame(s, b.gameId)?.name, <b key="a">{b.ank}</b>, inr(b.amount), `${b.rate}x`,
            b.win ? <b key="w" className="text-emerald-600">{inr(b.win)}</b> : "—", <BidBadge key="s" s={b.status} />];
        })} />
        {list.length > 400 && <div className="text-xs text-slate-400 mt-2">Showing latest 400 of {list.length}. Export CSV for all.</div>}
      </Card>
    </>
  );
}

export function CustomerSell() {
  const { state: s } = useStore();
  const [draft, setDraft] = useState({ from: addDays(-6), to: ymd() });
  const [f, setF] = useState(draft);
  const rows = s.users.map((u) => {
    const b = s.bids.filter((x) => x.userId === u.id && x.date >= f.from && x.date <= f.to && x.status !== "reverted");
    const tx = s.txns.filter((x) => x.userId === u.id && x.date >= f.from && x.date <= f.to);
    return {
      u, n: b.length, amt: sum(b, (x) => x.amount), win: sum(b, (x) => x.win ?? 0),
      dep: sum(tx.filter((x) => x.type === "deposit"), (x) => x.amount),
      wd: sum(tx.filter((x) => x.type === "withdraw" && x.status !== "rejected"), (x) => x.amount),
    };
  }).filter((r) => r.n || r.dep || r.wd).sort((a, b) => b.amt - a.amt);

  return (
    <>
      <Title t="Customer Sell Report" s="Per-customer summary. Platform P/L = that customer's bids − their winnings."
        right={<Btn variant="ghost" size="sm" onClick={() => downloadCsv(`customers-${f.from}-to-${f.to}.csv`, ["User", "Mobile", "Bids", "Bid Amount", "Won", "Platform P/L", "Deposits", "Withdrawals", "Wallet"], rows.map((r) => [r.u.name, r.u.mobile, r.n, r.amt, r.win, r.amt - r.win, r.dep, r.wd, r.u.balance]))}><Download size={14} /> Export CSV</Btn>} />
      <Card>
        <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
          <Field label="From"><input type="date" className="admin-input" value={draft.from} onChange={(e) => setDraft({ ...draft, from: e.target.value })} /></Field>
          <Field label="To"><input type="date" className="admin-input" value={draft.to} onChange={(e) => setDraft({ ...draft, to: e.target.value })} /></Field>
          <Btn onClick={() => setF(draft)}>Filter</Btn>
        </div>
      </Card>
      <Card className="mt-4">
        <Table head={["User", "Mobile", "Bids", "Bid Amount", "Won", "Platform P/L", "Deposits", "Withdrawals", "Wallet Now"]} rows={rows.map((r) => [
          <b key="n" className="text-slate-900">{r.u.name}</b>, r.u.mobile, r.n, inr(r.amt), inr(r.win),
          <b key="pl" className={r.amt - r.win >= 0 ? "text-emerald-600" : "text-rose-600"}>{inr(r.amt - r.win)}</b>, inr(r.dep), inr(r.wd), inr(r.u.balance),
        ])} />
      </Card>
    </>
  );
}
