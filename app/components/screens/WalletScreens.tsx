"use client";

import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, CheckCircle2, Dices, Loader2, RotateCcw, Trophy, UserCog } from "lucide-react";
import { deposit, requestWithdraw, withdrawOpen } from "../../lib/engine";
import { DAYS, fmtDate, fmtTime, inr } from "../../lib/format";
import { useStore } from "../../lib/store";
import type { Txn, TxnType } from "../../lib/types";
import type { Nav } from "../nav";
import { Header, Money, Sheet, useSession } from "../ui";

const ICON: Record<TxnType, React.ReactNode> = {
  deposit: <ArrowDownLeft size={16} />, withdraw: <ArrowUpRight size={16} />, bet: <Dices size={16} />,
  win: <Trophy size={16} />, refund: <RotateCcw size={16} />, manual: <UserCog size={16} />,
};
const LABEL: Record<TxnType, string> = { deposit: "Deposit (UPI)", withdraw: "Withdrawal", bet: "Bet Placed", win: "Winning Amount", refund: "Bid Refund", manual: "Admin Adjustment" };

export function TxnRow({ x }: { x: Txn }) {
  const statusColor = x.status === "pending" ? "text-amber-300" : x.status === "rejected" ? "text-rose-300" : "text-emerald-300";
  return (
    <div className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0">
      <div className={`w-9 h-9 rounded-full grid place-items-center shrink-0 ${x.dir === "cr" ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"}`}>{ICON[x.type]}</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{x.type === "manual" ? `Admin ${x.dir === "cr" ? "credit" : "debit"}` : LABEL[x.type]}</div>
        <div className="text-[11px] text-[var(--ink-mute)] truncate">{fmtDate(x.date)}, {fmtTime(x.time)}{x.note ? ` · ${x.note}` : ""}</div>
      </div>
      <div className="text-right">
        <div className={`font-semibold text-sm ${x.type === "withdraw" && x.status === "rejected" ? "line-through text-[var(--ink-mute)]" : x.dir === "cr" ? "text-emerald-300" : "text-rose-300"}`}>{x.dir === "cr" ? "+" : "−"}{inr(x.amount)}</div>
        {x.type === "withdraw" && <div className={`text-[10px] capitalize ${statusColor}`}>{x.status}</div>}
      </div>
    </div>
  );
}

export function WalletScreen({ nav }: { nav: Nav }) {
  const { state } = useStore();
  const { user } = useSession();
  const [filter, setFilter] = useState<"all" | "cr" | "dr">("all");
  const tx = state.txns.filter((x) => x.userId === user.id && (filter === "all" || x.dir === filter)).slice().reverse().slice(0, 60);
  const pending = state.txns.filter((x) => x.userId === user.id && x.type === "withdraw" && x.status === "pending");
  return (
    <>
      <Header title="My Wallet" />
      <div className="px-4">
        <div className="wallet-card p-5">
          <div className="text-xs opacity-80">Total Balance</div>
          <Money n={user.balance} className="text-4xl font-extrabold" />
          {pending.length > 0 && <div className="text-[11px] mt-1 opacity-80">{inr(pending.reduce((s, x) => s + x.amount, 0))} in pending withdrawals</div>}
          <div className="grid grid-cols-2 gap-2 mt-4">
            <button onClick={() => nav.push({ name: "addfunds" })} className="bg-white text-brand-700 font-semibold py-2.5 rounded-xl text-sm">Add Funds</button>
            <button onClick={() => nav.push({ name: "withdraw" })} className="bg-white/15 font-semibold py-2.5 rounded-xl text-sm">Withdraw</button>
          </div>
        </div>
        <div className="flex items-center justify-between mt-6 mb-2">
          <div className="font-semibold">Transactions</div>
          <div className="flex gap-1 text-[11px]">
            {(["all", "cr", "dr"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`px-2.5 py-1 rounded-lg ${filter === f ? "bg-white text-brand-700 font-semibold" : "bg-white/5 text-[var(--ink-soft)]"}`}>{f === "all" ? "All" : f === "cr" ? "Credit" : "Debit"}</button>
            ))}
          </div>
        </div>
        <div className="card px-4">{tx.length ? tx.map((x) => <TxnRow key={x.id} x={x} />) : <div className="py-8 text-center text-sm text-[var(--ink-mute)]">No transactions yet</div>}</div>
      </div>
    </>
  );
}

export function AddFunds({ nav }: { nav: Nav }) {
  const { state, attempt } = useStore();
  const { user, toast } = useSession();
  const [amount, setAmount] = useState("");
  const [stage, setStage] = useState<null | "paying" | "done">(null);
  const amt = Number(amount) || 0;
  const min = state.settings.minDeposit;

  const pay = () => {
    if (amt < min) return toast(`Minimum deposit is ${inr(min)}`);
    setStage("paying");
    // Simulated UPI intent → gateway callback → auto credit.
    window.setTimeout(() => {
      const r = attempt((d) => deposit(d, user.id, amt));
      if (!r.ok) { setStage(null); return toast(r.error); }
      setStage("done");
    }, 1500);
  };

  return (
    <>
      <Header title="Add Funds" onBack={nav.back} />
      <div className="px-4">
        <div className="card p-4 flex justify-between items-center"><span className="text-sm text-[var(--ink-soft)]">Current balance</span><Money n={user.balance} className="font-bold" /></div>
        <div className="text-sm font-semibold mt-5 mb-2">Enter amount <span className="text-[11px] font-normal text-[var(--ink-soft)]">(min {inr(min)})</span></div>
        <input className="field text-2xl font-bold" inputMode="numeric" placeholder="₹ 0" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, "").slice(0, 6))} />
        <div className="grid grid-cols-4 gap-2 mt-3">
          {[100, 500, 1000, 2000].map((v) => <button key={v} onClick={() => setAmount(String(v))} className="btn-ghost rounded-xl py-2 text-sm">₹{v}</button>)}
        </div>
        <div className="text-sm font-semibold mt-6 mb-2">Pay using</div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white grid place-items-center text-[10px] font-extrabold text-slate-800">UPI</div>
          <div className="flex-1"><div className="text-sm font-medium">Any UPI app</div><div className="text-[11px] text-[var(--ink-mute)]">GPay, PhonePe, Paytm · pays to {state.settings.upiId}</div></div>
          <CheckCircle2 size={18} className="text-brand-300" />
        </div>
        <button className="btn-brand w-full py-3.5 rounded-2xl mt-6" disabled={amt < min} onClick={pay}>Pay {amt ? inr(amt) : ""}</button>
        <div className="text-[11px] text-[var(--ink-mute)] text-center mt-3">Demo: payment is simulated and succeeds automatically.</div>
      </div>
      <Sheet open={stage !== null} onClose={() => stage === "done" && nav.back()}>
        <div className="text-center py-4">
          {stage === "paying" ? (
            <><Loader2 size={44} className="mx-auto animate-spin text-brand-300" /><div className="font-semibold mt-4">Waiting for UPI confirmation…</div><div className="text-xs text-[var(--ink-soft)] mt-1">Approve {inr(amt)} in your UPI app</div></>
          ) : (
            <><CheckCircle2 size={52} className="mx-auto text-emerald-400 pop" /><div className="text-xl font-semibold mt-3">{inr(amt)} added</div><div className="text-xs text-[var(--ink-soft)] mt-1">New balance {inr(user.balance)}</div>
              <button className="btn-brand w-full py-3 rounded-2xl mt-6" onClick={() => nav.back()}>Done</button></>
          )}
        </div>
      </Sheet>
    </>
  );
}

export function Withdraw({ nav }: { nav: Nav }) {
  const { state, attempt } = useStore();
  const { user, toast } = useSession();
  const [amount, setAmount] = useState("");
  const [upi, setUpi] = useState(user.upi);
  const open = withdrawOpen(state);
  const w = state.settings.withdraw;
  const submit = () => {
    const r = attempt((d) => requestWithdraw(d, user.id, Number(amount) || 0, upi));
    if (!r.ok) return toast(r.error);
    toast("⏳ Withdrawal requested — admin will approve soon");
    nav.back();
  };
  return (
    <>
      <Header title="Withdraw" onBack={nav.back} />
      <div className="px-4">
        <div className="card p-4 flex justify-between items-center"><span className="text-sm text-[var(--ink-soft)]">Withdrawable balance</span><Money n={user.balance} className="font-bold" /></div>
        {!open && <div className="rounded-2xl bg-amber-400/10 text-amber-200 text-xs p-3 mt-4">Withdrawals are allowed on {w.days.map((d) => DAYS[d]).join(", ")} between {fmtTime(w.from)} and {fmtTime(w.to)}.</div>}
        <div className="text-sm font-semibold mt-5 mb-2">Amount <span className="text-[11px] font-normal text-[var(--ink-soft)]">(min {inr(state.settings.minWithdraw)})</span></div>
        <input className="field text-2xl font-bold" inputMode="numeric" placeholder="₹ 0" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, "").slice(0, 7))} />
        <button onClick={() => setAmount(String(user.balance))} className="text-xs text-brand-300 mt-2">Withdraw all</button>
        <div className="text-sm font-semibold mt-5 mb-2">UPI ID</div>
        <input className="field" value={upi} onChange={(e) => setUpi(e.target.value)} placeholder="name@bank" />
        <button className="btn-brand w-full py-3.5 rounded-2xl mt-6" disabled={!open || !Number(amount)} onClick={submit}>Request Withdrawal</button>
        <div className="text-[11px] text-[var(--ink-mute)] text-center mt-3">The amount is held from your wallet until the admin approves. If rejected, it is refunded.</div>
      </div>
    </>
  );
}
