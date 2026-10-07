"use client";

import { useState } from "react";
import { Dices, UserRound, Users } from "lucide-react";
import { findGame, findUser, gameReport, isCredited, liveBids, updateUser } from "../../lib/engine";
import { fmtDate, fmtTime, inr, sum, ymd } from "../../lib/format";
import { useStore } from "../../lib/store";
import type { Bid, Session, Txn } from "../../lib/types";
import { bidTypeLabel, GameSelect } from "../common";
import { ANK_COLORS, BidBadge, Btn, Card, DataTable, Field, Modal, Table, YesNo, useAdmin } from "../ui";

export function Dashboard({ go }: { go: (r: string) => void }) {
  const { state: s, update } = useStore();
  const { toast } = useAdmin();
  const t = ymd();
  const active = s.users.filter((u) => u.status === "active").length;
  const quizMode = s.settings.bettingDisabled;

  const toggleBettingMode = () => {
    update((d) => {
      d.settings.bettingDisabled = !d.settings.bettingDisabled;
    });
    toast(
      !quizMode
        ? "New users will default to Educational Quiz Safe Mode (Existing users unchanged)"
        : "New users will default to Betting Mode (Existing users unchanged)",
      "ok"
    );
  };

  // "Total Bids On Single Ank" — Single Ank bids of today, optionally one market / one session.
  const [draft, setDraft] = useState<{ game: number | ""; session: Session | "" }>({ game: "", session: "" });
  const [f, setF] = useState(draft);
  const ank = liveBids(s, (b) => b.date === t && b.type === "single_ank" && findGame(s, b.gameId)?.cat === "main" && (!f.game || b.gameId === f.game) && (!f.session || b.session === f.session));

  const [repDraft, setRepDraft] = useState<{ date: string; game: number | "" }>({ date: t, game: "" });
  const [rep, setRep] = useState(repDraft);
  const R = gameReport(s, rep.date, rep.game || undefined);
  const [view, setView] = useState<null | "bids" | "wins" | "wd" | "dep" | "man">(null);

  const deps = s.txns.filter((x) => isCredited(x) && x.mode !== "Manual").slice().reverse();
  const kpis = [
    { l: "Active Users", v: active, icon: <Users size={56} />, bg: "#0d6efd", to: "users" },
    { l: "Today Registration", v: s.users.filter((u) => u.joined.startsWith(t)).length, icon: <UserRound size={56} />, bg: "#1c8cf0", to: "users" },
    { l: "Games", v: s.games.filter((g) => g.active).length, icon: <Dices size={56} />, bg: "#3fa4f5", to: "games/main" },
    { l: "Inactive Users", v: s.users.length - active, icon: <UserRound size={56} />, bg: "#0b4ea2", to: "users" },
  ];

  const bidRows = (a: Bid[]) => a.map((b) => [findUser(s, b.userId)?.name ?? "Deleted User", findGame(s, b.gameId)?.name, bidTypeLabel(b), b.value, inr(b.amount), b.win ? inr(b.win) : "—", <BidBadge key="s" s={b.status} />]);
  const txRows = (a: Txn[]) => a.map((x) => { const u = findUser(s, x.userId); return [u?.name ?? "Deleted User", u?.mobile ?? "—", inr(x.amount), x.mode ?? "—", x.status, fmtTime(x.time)]; });
  const views = {
    bids: ["Total Bid Amount", <Table key="t" head={["User", "Game", "Type", "Number", "Amount", "Win", "Status"]} rows={bidRows(R.bids)} />],
    wins: ["Total Winning Amount", <Table key="t" head={["User", "Game", "Type", "Number", "Amount", "Win", "Status"]} rows={bidRows(R.wins)} />],
    wd: ["Withdraw Request", <Table key="t" head={["User", "Mobile", "Amount", "Mode", "Status", "Time"]} rows={txRows(R.withdrawals)} />],
    dep: ["Total Deposit Request (UPI)", <Table key="t" head={["User", "Mobile", "Amount", "Mode", "Status", "Time"]} rows={txRows(R.deposits)} />],
    man: ["Add Funds (Manually)", <Table key="t" head={["User", "Mobile", "Amount", "Mode", "Status", "Time"]} rows={txRows(R.manual)} />],
  } as const;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-sm font-semibold tracking-wider text-slate-600">DASHBOARD</h1>
          <p className="text-[11px] text-slate-500 mt-0.5">Control system defaults and manage user accounts</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">New User Default:</span>
          <button
            onClick={toggleBettingMode}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition active:scale-95 flex items-center gap-1.5 ${
              quizMode
                ? "bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200"
                : "bg-emerald-100 text-emerald-900 border border-emerald-300 hover:bg-emerald-200"
            }`}
            title="Sets default mode for new incoming registrations (Existing users stay in their current mode)"
          >
            <span className={`w-2 h-2 rounded-full ${quizMode ? "bg-amber-500" : "bg-emerald-500"}`} />
            {quizMode ? "Quiz Mode (Safe)" : "Betting Mode (Active)"}
          </button>
        </div>
      </div>

      <div className={`mb-4 p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${quizMode ? "bg-amber-50 border-amber-200 text-amber-900" : "bg-emerald-50 border-emerald-200 text-emerald-900"}`}>
        <div>
          <b>System Default Mode: {quizMode ? "🟡 Educational Quiz Safe Mode" : "🟢 Betting Mode (Active)"}</b>
          <span className="ml-1 opacity-85">
            — New users will register in {quizMode ? "Quiz Safe Mode (no betting/wallet)" : "Betting Mode"}. Existing users keep their individually set mode.
          </span>
        </div>
        <button
          onClick={toggleBettingMode}
          className={`px-3 py-1 text-white rounded-lg font-bold shrink-0 shadow-sm text-xs ${quizMode ? "bg-emerald-600 hover:bg-emerald-700" : "bg-amber-600 hover:bg-amber-700"}`}
        >
          {quizMode ? "Switch Default to Betting" : "Switch Default to Quiz Safe"}
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <button key={k.l} onClick={() => go(k.to)} className="relative overflow-hidden text-left rounded-2xl p-5 text-white hover:brightness-110 transition" style={{ background: k.bg }}>
            <div className="text-lg">{k.l}</div>
            <div className="text-5xl font-extrabold mt-3">{k.v}</div>
            <div className="absolute right-5 top-5 opacity-30">{k.icon}</div>
          </button>
        ))}
      </div>

      <Card className="mt-5" title={`Total Bids On Single Ank Of Date ${fmtDate(t)}`}>
        <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-4 items-end mb-5">
          <Field label="Game Name"><GameSelect cat="main" all="-Select Game Name-" value={draft.game} onChange={(v) => setDraft({ ...draft, game: v })} /></Field>
          <Field label="Market Time">
            <select className="admin-input" value={draft.session} onChange={(e) => setDraft({ ...draft, session: e.target.value as Session | "" })}>
              <option value="">-Select Market Time-</option><option value="open">Open Market</option><option value="close">Close Market</option>
            </select>
          </Field>
          <Btn onClick={() => setF(draft)}>Get</Btn>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 10 }, (_, a) => {
            const x = ank.filter((b) => b.value === String(a));
            return (
              <div key={a} className="rounded-2xl overflow-hidden border-2 bg-white text-center" style={{ borderColor: ANK_COLORS[a] }}>
                <div className="pt-4 font-semibold text-[#0d6efd]">Total Bids {x.length}</div>
                <div className="text-2xl font-semibold py-2">{sum(x, (b) => b.amount)}</div>
                <div className="pb-4 text-slate-700">Total Bid Amount</div>
                <div className="py-2.5 text-white font-semibold" style={{ background: ANK_COLORS[a] }}>Ank {a}</div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="mt-5" title="Game Report">
        <div className="grid sm:grid-cols-[1fr_1fr_auto_auto] gap-4 items-end mb-4">
          <Field label="Date"><input type="date" className="admin-input" value={repDraft.date} max={t} onChange={(e) => setRepDraft({ ...repDraft, date: e.target.value })} /></Field>
          <Field label="Game Name"><GameSelect all="-Select Game Name-" value={repDraft.game} onChange={(v) => setRepDraft({ ...repDraft, game: v })} /></Field>
          <Btn onClick={() => setRep(repDraft)}>Get Report</Btn>
          <Btn variant="red" onClick={() => { const c = { date: t, game: "" as const }; setRepDraft(c); setRep(c); }}>Clear</Btn>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-slate-200">
            <tbody>
              {([
                [["Total Bid Amount", R.bidAmt, "bids"], ["Withdraw Request", sum(R.withdrawals, (x) => x.amount), "wd"]],
                [["Total Winning Amount", R.winAmt, "wins"], ["Total Deposit Request (UPI)", sum(R.deposits, (x) => x.amount), "dep"]],
                [["Total Profit Amount", R.profit, null], ["Add Funds (Manually)", sum(R.manual, (x) => x.amount), "man"]],
              ] as const).map((row, i) => (
                <tr key={i} className="border-b border-slate-200">
                  {row.map(([l, v, k]) => [
                    <td key={l + "l"} className="px-4 py-4 border-r border-slate-200">{l}</td>,
                    <td key={l + "v"} className={`px-4 py-4 border-r border-slate-200 whitespace-nowrap ${k === null ? (v >= 0 ? "text-emerald-600 font-semibold" : "text-rose-600 font-semibold") : ""}`}>{v} ₹</td>,
                    <td key={l + "b"} className="px-4 py-4 border-r border-slate-200 text-center">{k && <Btn variant="dark" onClick={() => setView(k)}>View</Btn>}</td>,
                  ])}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-8 mb-3">
          <h3 className="text-xl font-semibold">Recently Registered Users</h3>
          <Btn variant="dark" onClick={() => go("users")}>View All Users ({s.users.length})</Btn>
        </div>
        <DataTable
          head={["#", "Name", "Mobile", "Status", "Wallet Balance", "Registered At", "Action"]}
          rows={s.users.slice().reverse().slice(0, 10).map((u, i) => [
            i + 1,
            <button key="n" className="text-left font-semibold hover:text-[#0d6efd]" onClick={() => go(`users/${u.id}`)}>{u.name}</button>,
            u.mobile,
            <span key="s" className={u.status === "active" ? "text-emerald-600 font-semibold" : "text-rose-600 font-semibold"}>{u.status === "active" ? "Active" : "Inactive"}</span>,
            inr(u.balance),
            u.joined,
            <Btn key="a" size="sm" onClick={() => go(`users/${u.id}`)}>Profile</Btn>,
          ])}
          text={s.users.map((u) => `${u.name} ${u.mobile}`)}
        />

        <h3 className="text-xl font-semibold mt-8 mb-3">Auto Fund Deposit</h3>
        <DataTable head={["#", "User Name", "Mobile", "Amount", "UPI App", "Date"]}
          rows={deps.map((x, i) => { const u = findUser(s, x.userId); return [i + 1, u?.name ?? "Deleted User", u?.mobile ?? "—", inr(x.amount), x.mode, `${fmtDate(x.date)} ${fmtTime(x.time)}`]; })}
          text={deps.map((x) => { const u = findUser(s, x.userId); return `${u?.name ?? "Deleted User"} ${u?.mobile ?? ""}`; })} />
      </Card>

      {view && <Modal wide title={`${views[view][0]} — ${fmtDate(rep.date)}`} onClose={() => setView(null)}>{views[view][1]}</Modal>}
    </>
  );
}
