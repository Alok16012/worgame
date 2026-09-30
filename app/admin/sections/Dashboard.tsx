"use client";

import { useMemo, useState } from "react";
import { Dices, UserPlus, UserX, Users } from "lucide-react";
import { findGame, findUser, gameReport, liveBids, marketStatus, resultOf } from "../../lib/engine";
import { fmtDate, fmtTime, inr, sum, ymd } from "../../lib/format";
import { useNow, useStore } from "../../lib/store";
import { ANKS, CAT_ICON, CAT_LABEL, CATS, type Bid, type Txn } from "../../lib/types";
import { ANK_COLORS, BidBadge, Btn, Card, Field, Modal, Stat, StatusBadge, Table, Title } from "../ui";

export function Dashboard({ go }: { go: (r: string) => void }) {
  const { state: s } = useStore();
  const now = useNow();
  const t = ymd(now);
  const active = s.users.filter((u) => u.status === "active").length;

  // Ank monitoring filters
  const markets = useMemo(() => [...new Set(s.games.map((g) => `${g.open}-${g.close}`))].sort(), [s.games]);
  const [draft, setDraft] = useState({ game: "", market: "" });
  const [filter, setFilter] = useState({ game: "", market: "" });
  const ankBids = liveBids(s, (b) => {
    if (b.date !== t) return false;
    const g = findGame(s, b.gameId)!;
    return (!filter.game || b.gameId === +filter.game) && (!filter.market || `${g.open}-${g.close}` === filter.market);
  });

  // Game report
  const [repDraft, setRepDraft] = useState({ date: t, game: "" });
  const [rep, setRep] = useState({ date: t, game: "" });
  const R = gameReport(s, rep.date, rep.game ? +rep.game : undefined);
  const [view, setView] = useState<null | "bids" | "wins" | "wd" | "dep" | "man">(null);

  const [q, setQ] = useState("");
  const deps = s.txns.filter((x) => x.type === "deposit").slice().reverse().filter((x) => {
    const u = findUser(s, x.userId)!;
    return !q || u.name.toLowerCase().includes(q.toLowerCase()) || u.mobile.includes(q);
  });

  const todayBids = liveBids(s, (b) => b.date === t);
  const kpis = [
    { l: "Active Users", v: active, s: `of ${s.users.length} registered`, icon: <Users size={40} />, bg: "linear-gradient(135deg,#0d6efd,#3d8bfd)", to: "users" },
    { l: "Today Registration", v: s.users.filter((u) => u.joined === t).length, s: "new sign-ups today", icon: <UserPlus size={40} />, bg: "linear-gradient(135deg,#1c7ed6,#4dabf7)", to: "users" },
    { l: "Games", v: s.games.filter((g) => g.active).length, s: "active markets", icon: <Dices size={40} />, bg: "linear-gradient(135deg,#339af0,#74c0fc)", to: "games/main" },
    { l: "Inactive Users", v: s.users.length - active, s: "blocked / dormant", icon: <UserX size={40} />, bg: "linear-gradient(135deg,#0b3d91,#1c5bbf)", to: "users" },
  ];

  const bidRows = (a: Bid[]) => a.map((b) => [findUser(s, b.userId)!.name, findGame(s, b.gameId)!.name, `Ank ${b.ank}`, inr(b.amount), b.win ? inr(b.win) : "—", <BidBadge key="s" s={b.status} />]);
  const txRows = (a: Txn[]) => a.map((x) => { const u = findUser(s, x.userId)!; return [u.name, u.mobile, inr(x.amount), x.status, fmtTime(x.time)]; });
  const views = {
    bids: ["Bids", <Table key="t" head={["User", "Game", "Ank", "Amount", "Win", "Status"]} rows={bidRows(R.bids)} />],
    wins: ["Winning bids", <Table key="t" head={["User", "Game", "Ank", "Amount", "Win", "Status"]} rows={bidRows(R.wins)} />],
    wd: ["Withdraw requests", <Table key="t" head={["User", "Mobile", "Amount", "Status", "Time"]} rows={txRows(R.withdrawals)} />],
    dep: ["UPI deposits", <Table key="t" head={["User", "Mobile", "Amount", "Status", "Time"]} rows={txRows(R.deposits)} />],
    man: ["Manual fund additions", <Table key="t" head={["User", "Mobile", "Amount", "Status", "Time"]} rows={txRows(R.manual)} />],
  } as const;

  return (
    <>
      <Title t="Dashboard" s={`Platform health for ${fmtDate(t)}`} />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <button key={k.l} onClick={() => go(k.to)} className="relative overflow-hidden text-left rounded-2xl p-5 text-white shadow-sm hover:brightness-110 transition" style={{ background: k.bg }}>
            <div className="text-sm opacity-90">{k.l}</div>
            <div className="text-4xl font-extrabold mt-2">{k.v}</div>
            <div className="text-xs opacity-80 mt-1">{k.s}</div>
            <div className="absolute right-4 top-4 opacity-25">{k.icon}</div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
        <Stat label="Today's Bid Amount" value={inr(sum(todayBids, (b) => b.amount))} sub={`${todayBids.length} bids`} />
        <Stat label="Today's Winnings Paid" value={inr(sum(todayBids, (b) => b.win ?? 0))} />
        <Stat label="Today's UPI Deposits" value={inr(sum(s.txns.filter((x) => x.date === t && x.type === "deposit"), (x) => x.amount))} tone="green" />
        <Stat label="Pending Withdrawals" value={s.txns.filter((x) => x.type === "withdraw" && x.status === "pending").length} sub={<button className="text-brand-600 font-semibold" onClick={() => go("withdraw")}>Review →</button>} />
        <Stat label="Total User Wallets" value={inr(sum(s.users, (u) => u.balance))} sub="platform liability" />
      </div>

      <Card className="mt-4" title={`Total Bids On Single Ank Of Date ${fmtDate(t)}`} desc="Live count and amount of bids on each Ank today.">
        <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-3 items-end mb-5">
          <Field label="Game Name">
            <select className="admin-input" value={draft.game} onChange={(e) => setDraft({ ...draft, game: e.target.value })}>
              <option value="">-Select Game Name- (All)</option>
              {s.games.map((g) => <option key={g.id} value={g.id}>{g.name} — {CAT_LABEL[g.cat]}</option>)}
            </select>
          </Field>
          <Field label="Market Time">
            <select className="admin-input" value={draft.market} onChange={(e) => setDraft({ ...draft, market: e.target.value })}>
              <option value="">-Select Market Time- (All)</option>
              {markets.map((m) => <option key={m} value={m}>{m.split("-").map(fmtTime).join(" - ")}</option>)}
            </select>
          </Field>
          <Btn onClick={() => setFilter(draft)}>Get</Btn>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {ANKS.map((a) => {
            const x = ankBids.filter((b) => b.ank === a);
            return (
              <div key={a} className="rounded-2xl overflow-hidden border-2 bg-white text-center" style={{ borderColor: ANK_COLORS[a] }}>
                <div className="pt-3 font-semibold text-sm" style={{ color: ANK_COLORS[a] }}>Total Bids {x.length}</div>
                <div className="text-2xl font-extrabold py-1 text-slate-900">{inr(sum(x, (b) => b.amount))}</div>
                <div className="text-xs text-slate-400 pb-3">Total Bid Amount</div>
                <div className="py-2 text-white font-bold" style={{ background: ANK_COLORS[a] }}>Ank {a}</div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="mt-4" title="Today's Markets" desc="Every market's status for today. Declare the result once bidding closes.">
        <Table
          head={["Game", "Category", "Open", "Close", "Rate", "Status", "Bids", "Bid Amount", "Result", ""]}
          rows={s.games.filter((g) => g.active).map((g) => {
            const b = liveBids(s, (x) => x.gameId === g.id && x.date === t);
            const r = resultOf(s, g.id, t);
            return [
              <b key="n" className="text-slate-900">{g.name}</b>, `${CAT_ICON[g.cat]} ${CAT_LABEL[g.cat]}`, fmtTime(g.open), fmtTime(g.close), `${g.rate}x`,
              <StatusBadge key="s" s={marketStatus(s, g, t, now)} />, b.length, inr(sum(b, (x) => x.amount)),
              r ? <span key="r" className="inline-grid place-items-center w-7 h-7 rounded-full bg-brand-600 text-white font-bold">{r.ank}</span> : "—",
              r ? "" : <Btn key="d" size="sm" onClick={() => go(`declare/${g.cat}/${g.id}`)}>Declare</Btn>,
            ];
          })}
        />
      </Card>

      <Card className="mt-4" title="Game Report" desc="Financial summary for a date, optionally for a single game.">
        <div className="grid sm:grid-cols-[1fr_1fr_auto_auto] gap-3 items-end mb-4">
          <Field label="Date"><input type="date" className="admin-input" value={repDraft.date} max={t} onChange={(e) => setRepDraft({ ...repDraft, date: e.target.value })} /></Field>
          <Field label="Game Name">
            <select className="admin-input" value={repDraft.game} onChange={(e) => setRepDraft({ ...repDraft, game: e.target.value })}>
              <option value="">-Select Game Name- (All)</option>
              {s.games.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </Field>
          <Btn onClick={() => setRep(repDraft)}>Get Report</Btn>
          <Btn variant="red" onClick={() => { const c = { date: t, game: "" }; setRepDraft(c); setRep(c); }}>Clear</Btn>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {([
            ["Total Bid Amount", R.bidAmt, "bids"],
            ["Withdraw Request", sum(R.withdrawals, (x) => x.amount), "wd"],
            ["Total Winning Amount", R.winAmt, "wins"],
            ["Total Deposit Request (UPI)", sum(R.deposits, (x) => x.amount), "dep"],
            ["Total Profit Amount", R.profit, null],
            ["Add Funds (Manually)", sum(R.manual, (x) => x.amount), "man"],
          ] as const).map(([l, v, k]) => (
            <div key={l} className="flex items-center gap-3 border border-slate-200 rounded-xl px-4 py-3">
              <div className="flex-1 text-sm text-slate-600">{l}</div>
              <div className={`font-bold ${k === null ? (v >= 0 ? "text-emerald-600" : "text-rose-600") : "text-slate-900"}`}>{inr(v)}</div>
              {k ? <Btn size="sm" variant="dark" onClick={() => setView(k)}>View</Btn> : <span className="w-[46px]" />}
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-4" title="Auto Fund Deposit" desc="UPI payments credited to wallets automatically."
        right={<input className="admin-input !w-56" placeholder="Search name or mobile" value={q} onChange={(e) => setQ(e.target.value)} />}>
        <Table head={["#", "User Name", "Mobile", "Amount", "UTR", "Date"]}
          rows={deps.slice(0, 25).map((x, i) => { const u = findUser(s, x.userId)!; return [i + 1, u.name, u.mobile, <b key="a" className="text-emerald-600">{inr(x.amount)}</b>, x.utr ?? "—", `${fmtDate(x.date)} ${fmtTime(x.time)}`]; })} />
        <div className="text-xs text-slate-400 mt-2">Showing {Math.min(25, deps.length)} of {deps.length} entries</div>
      </Card>

      {view && <Modal wide title={`${views[view][0]} — ${fmtDate(rep.date)}`} onClose={() => setView(null)}>{views[view][1]}</Modal>}
    </>
  );
}

export function Guide({ go }: { go: (r: string) => void }) {
  const { state: s } = useStore();
  const steps = [
    ["Register & deposit", "User signs up with mobile + OTP and adds money via UPI → shows in Auto Deposit History."],
    ["Pick a market", "User opens an OPEN market in Main, Starline or Galidesawar."],
    ["Place bids", "User picks one or more Anks (0–9) and an amount. The wallet is debited immediately."],
    ["Market closes", "At close time bidding stops. Admin checks exposure in Prediction."],
    ["Declare result", "Admin declares the winning Ank. Winners get Bid × Rate credited; the rest lose."],
    ["Withdraw", "User requests a withdrawal (amount held). Admin approves after paying, or rejects to refund."],
  ];
  return (
    <>
      <Title t="Game Flow Guide" s={`How ${s.settings.appName} works end to end`} />
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {steps.map(([h, d], i) => (
          <Card key={h}>
            <div className="text-xs font-bold text-brand-600">STEP {i + 1}</div>
            <div className="font-semibold text-slate-900 mt-1">{h}</div>
            <p className="text-sm text-slate-500 mt-1">{d}</p>
          </Card>
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <Card title="💡 Example">
          <p className="text-sm text-slate-600">Rohan bids <b>₹100</b> on Ank <b>7</b> in Morning Star (rate 9.5x).<br />• Result is 7 → Rohan gets <b className="text-emerald-600">₹950</b>.<br />• Result is anything else → the ₹100 is lost.</p>
        </Card>
        <Card title="📊 Platform profit">
          <p className="text-sm text-slate-600">Profit = Total Bid Amount − Total Winning Amount. See Dashboard → Game Report, or <button className="text-brand-600 font-semibold" onClick={() => go("prediction")}>Prediction</button> for the payout each Ank would cost.</p>
        </Card>
        <Card title="↩️ Corrections">
          <p className="text-sm text-slate-600"><b>Bid Revert</b> refunds pending bids of a cancelled market. <b>Fund Management</b> adds or deducts wallet money manually. Both are recorded in the Activity Log.</p>
        </Card>
      </div>
      <Card className="mt-4" title="Game categories" desc="Each category has its own markets (timings), rates and results.">
        <Table max={false} head={["Category", "Markets", "Rate", "Timings"]} rows={CATS.map((c) => {
          const gs = s.games.filter((g) => g.cat === c);
          return [`${CAT_ICON[c]} ${CAT_LABEL[c]}`, gs.length, [...new Set(gs.map((g) => `${g.rate}x`))].join(", "), gs.slice(0, 3).map((g) => `${fmtTime(g.open)}–${fmtTime(g.close)}`).join(" · ") + (gs.length > 3 ? " …" : "")];
        })} />
        <p className="text-sm bg-brand-50 text-brand-700 rounded-xl px-4 py-3 mt-4">Tip: open the <a href="/" target="_blank" className="font-semibold underline">player app</a> in another tab. Place a bid there, declare the result here, and watch the wallet update live.</p>
      </Card>
    </>
  );
}
