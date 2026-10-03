"use client";

import { useState } from "react";
import { decideAutoDeposit, decideFund, decideWithdraw, findUser, isCredited, manualFund } from "../../lib/engine";
import { addDays, fmtDate, fmtTime, inr, sum, ymd } from "../../lib/format";
import { useStore } from "../../lib/store";
import type { TxnStatus } from "../../lib/types";
import { Badge, Btn, Card, DataTable, Field, Stat, Tabs, useAdmin } from "../ui";

const fundBadge = (st: string) => st === "pending" ? <Badge tone="amber">Pending</Badge> : st === "success" ? <Badge tone="amber">To Check</Badge> : st === "rejected" ? <Badge tone="red">Rejected</Badge> : <Badge tone="green">Approved</Badge>;

export function FundManagement() {
  const { state: s, attempt } = useStore();
  const { confirm, toast } = useAdmin();
  const [f, setF] = useState({ user: 0, dir: "cr" as "cr" | "dr", amount: "", remark: "" });
  const pending = s.txns.filter((x) => x.type === "deposit" && x.status === "pending").slice().reverse();
  const list = s.txns.filter((x) => (x.type === "deposit" && x.status !== "pending") || x.type === "manual").slice().reverse();

  const submit = async () => {
    const u = findUser(s, f.user);
    const amt = Number(f.amount);
    if (!u || !(amt > 0)) return toast("Select a user and enter amount", "bad");
    if (!(await confirm({ title: "Fund Manage", body: <>{f.dir === "cr" ? "Add" : "Deduct"} <b>{inr(amt)}</b> {f.dir === "cr" ? "to" : "from"} <b>{u.name}</b> ({u.mobile})?</>, tone: f.dir === "cr" ? "green" : "red" }))) return;
    const r = attempt((d) => manualFund(d, u.id, f.dir, amt, f.remark.trim()));
    if (!r.ok) return toast(r.error, "bad");
    toast("Wallet updated", "ok");
    setF({ ...f, amount: "", remark: "" });
  };

  const decide = async (id: number, st: "approved" | "rejected") => {
    const x = s.txns.find((t) => t.id === id)!;
    const u = findUser(s, x.userId)!;
    const ok = await confirm({
      title: st === "approved" ? "Approve Add Fund" : "Reject Add Fund",
      body: st === "approved" ? <>Confirm you received <b>{inr(x.amount)}</b> from <b>{u.name}</b> ({u.mobile}). The amount will be added to the wallet.</> : <>Reject the <b>{inr(x.amount)}</b> request of <b>{u.name}</b>? Nothing is added to the wallet.</>,
      ok: st === "approved" ? "Approve" : "Reject", tone: st === "approved" ? "green" : "red",
    });
    if (!ok) return;
    const r = attempt((d) => decideFund(d, id, st));
    if (r.ok) toast(`Add Fund ${st}`, "ok"); else toast(r.error, "bad");
  };

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <Stat label="Total Wallet Balance" value={inr(sum(s.users, (u) => u.balance))} />
        <Stat label="Total Deposit (Credited)" value={inr(sum(s.txns.filter(isCredited), (x) => x.amount))} tone="green" />
        <Stat label="Pending Add Fund Requests" value={`${pending.length} · ${inr(sum(pending, (x) => x.amount))}`} />
        <Stat label="Total Withdraw (Paid)" value={inr(sum(s.txns.filter((x) => x.type === "withdraw" && x.status === "approved"), (x) => x.amount))} tone="red" />
      </div>
      <Card title={`Add Fund Request (${pending.length} pending)`}>
        <p className="text-xs text-slate-500 mb-3">{s.settings.autoUpi ? "Auto UPI is ON, so players are credited automatically. Requests show up here when Auto UPI is OFF (Main Setting)." : "Auto UPI is OFF: players send requests. Contact them on WhatsApp, take the payment, then Approve."}</p>
        <DataTable head={["Sr No", "User Name", "Mobile", "Amount", "Date", "Time", "Action"]}
          rows={pending.map((x, i) => { const u = findUser(s, x.userId)!; return [i + 1, u.name,
            <a key="m" href={`https://wa.me/91${u.mobile}?text=${encodeURIComponent(`Hello ${u.name}, please pay ₹${x.amount} for your ${s.settings.appName} add fund request.`)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-emerald-700">{u.mobile} <span className="text-[10px] bg-emerald-100 px-1.5 py-0.5 rounded">WhatsApp</span></a>,
            <b key="a">{inr(x.amount)}</b>, fmtDate(x.date), fmtTime(x.time),
            <div key="b" className="flex gap-1.5"><Btn size="sm" variant="green" onClick={() => decide(x.id, "approved")}>Approve</Btn><Btn size="sm" variant="red" onClick={() => decide(x.id, "rejected")}>Reject</Btn></div>]; })}
          text={pending.map((x) => { const u = findUser(s, x.userId)!; return `${u.name} ${u.mobile}`; })} />
      </Card>
      <Card className="mt-5" title="Add / Withdraw Fund">
        <div className="grid md:grid-cols-[2fr_1fr_1fr_2fr_auto] gap-4 items-end">
          <Field label="User">
            <select className="admin-input" value={f.user} onChange={(e) => setF({ ...f, user: Number(e.target.value) })}>
              <option value={0}>-Select User-</option>
              {s.users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.mobile}) — {inr(u.balance)}</option>)}
            </select>
          </Field>
          <Field label="Type"><select className="admin-input" value={f.dir} onChange={(e) => setF({ ...f, dir: e.target.value as "cr" | "dr" })}><option value="cr">Add Money</option><option value="dr">Withdraw Money</option></select></Field>
          <Field label="Amount"><input className="admin-input" inputMode="numeric" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value.replace(/\D/g, "") })} /></Field>
          <Field label="Remark"><input className="admin-input" placeholder="Optional" value={f.remark} onChange={(e) => setF({ ...f, remark: e.target.value })} /></Field>
          <Btn onClick={submit}>Submit</Btn>
        </div>
      </Card>
      <Card className="mt-5" title="Fund History">
        <DataTable head={["Sr No", "User Name", "Mobile", "Amount", "Transaction", "Mode", "Remark", "Date", "Status"]}
          rows={list.map((x, i) => { const u = findUser(s, x.userId)!; return [i + 1, u.name, u.mobile, inr(x.amount), <span key="t" className={x.dir === "cr" ? "text-emerald-600" : "text-rose-600"}>{x.dir === "cr" ? "Credit" : "Debit"}</span>, x.mode ?? "—", x.remark, `${fmtDate(x.date)} ${fmtTime(x.time)}`, <span key="s">{fundBadge(x.status)}</span>]; })}
          text={list.map((x) => { const u = findUser(s, x.userId)!; return `${u.name} ${u.mobile} ${x.mode}`; })} />
      </Card>
    </>
  );
}

export function WithdrawManagement({ go }: { go: (r: string) => void }) {
  const { state: s, attempt } = useStore();
  const { confirm, toast } = useAdmin();
  const [tab, setTab] = useState<"all" | Exclude<TxnStatus, "success">>("all");
  const all = s.txns.filter((x) => x.type === "withdraw");
  const list = all.filter((x) => tab === "all" || x.status === tab).slice().reverse();
  const n = (st: TxnStatus) => all.filter((x) => x.status === st).length;

  const act = async (id: number, st: "approved" | "rejected") => {
    const x = all.find((t) => t.id === id)!;
    const u = findUser(s, x.userId)!;
    const ok = await confirm({
      title: st === "approved" ? "Approve Withdraw" : "Reject Withdraw",
      body: st === "approved" ? <>Confirm you have paid <b>{inr(x.amount)}</b> to {u.name} — {x.payTo}.</> : <>Reject <b>{inr(x.amount)}</b> of {u.name}? The amount goes back to the user&apos;s wallet and the request stays here as <b className="text-rose-600">Rejected</b>.</>,
      ok: st === "approved" ? "Approve" : "Reject", tone: st === "approved" ? "green" : "red",
    });
    if (!ok) return;
    const r = attempt((d) => decideWithdraw(d, id, st));
    if (r.ok) toast(st === "approved" ? "Withdraw approved" : `Withdraw rejected · ${inr(x.amount)} refunded`, "ok"); else toast(r.error, "bad");
  };

  return (
    <Card title="Withdraw Management">
      <Tabs value={tab} onChange={setTab} items={[{ id: "all", label: `All (${all.length})` }, { id: "pending", label: `Pending (${n("pending")})` }, { id: "approved", label: `Approved (${n("approved")})` }, { id: "rejected", label: `Rejected (${n("rejected")})` }]} />
      <DataTable key={tab} head={["Sr No", "User Name", "Mobile", "Amount", "Pay To", "Wallet", "Date", "Time", "Action / Status"]}
        rows={list.map((x, i) => {
          const u = findUser(s, x.userId)!;
          return [i + 1, <button key="u" className="hover:text-[#0d6efd]" onClick={() => go(`users/${u.id}`)}>{u.name}</button>, u.mobile, <b key="a">{inr(x.amount)}</b>, <span key="p" className="whitespace-normal">{x.payTo}</span>, inr(u.balance), fmtDate(x.date), fmtTime(x.time),
            x.status === "pending" ? <div key="b" className="flex gap-1.5"><Btn size="sm" variant="green" onClick={() => act(x.id, "approved")}>Approve</Btn><Btn size="sm" variant="red" onClick={() => act(x.id, "rejected")}>Reject</Btn></div>
              : x.status === "approved" ? <Badge key="s" tone="green">Approved</Badge> : <Badge key="s" tone="red">Rejected · Refunded</Badge>];
        })}
        text={list.map((x) => { const u = findUser(s, x.userId)!; return `${u.name} ${u.mobile} ${x.status}`; })} />
    </Card>
  );
}

export function AutoDeposit() {
  const { state: s, attempt } = useStore();
  const { confirm, toast } = useAdmin();
  const [draft, setDraft] = useState({ from: addDays(-6), to: ymd() });
  const [f, setF] = useState(draft);
  const [tab, setTab] = useState<"all" | "success" | "approved" | "rejected">("success");
  const auto = s.txns.filter((x) => x.type === "deposit" && x.mode !== "Manual" && x.status !== "pending" && x.date >= f.from && x.date <= f.to);
  const list = auto.filter((x) => tab === "all" || x.status === tab).slice().reverse();
  const n = (st: string) => auto.filter((x) => x.status === st).length;

  const act = async (id: number, st: "approved" | "rejected") => {
    const x = auto.find((t) => t.id === id)!;
    const u = findUser(s, x.userId)!;
    const ok = await confirm({
      title: st === "approved" ? "Approve Deposit" : "Reject Deposit",
      body: st === "approved"
        ? <>Confirm <b>{inr(x.amount)}</b> from <b>{u.name}</b> ({x.mode}, {x.utr}) is received in your account.</>
        : <>Payment of <b>{inr(x.amount)}</b> by <b>{u.name}</b> not received? Rejecting takes {inr(x.amount)} back out of the wallet (current balance {inr(u.balance)}{u.balance < x.amount ? <b className="text-rose-600"> — wallet will go negative</b> : null}).</>,
      ok: st === "approved" ? "Approve" : "Reject", tone: st === "approved" ? "green" : "red",
    });
    if (!ok) return;
    const r = attempt((d) => decideAutoDeposit(d, id, st));
    if (r.ok) toast(st === "approved" ? "Deposit approved" : `Deposit rejected · ${inr(x.amount)} reversed`, "ok"); else toast(r.error, "bad");
  };

  return (
    <Card title="Auto Deposit History">
      <p className="text-xs text-slate-500 mb-4">UPI deposits are added to the wallet straight away and wait here as <b>To Check</b>. Match them with your bank / UPI statement: Approve if the money came, Reject if not (the amount is taken back from the wallet).</p>
      <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-4 items-end mb-4">
        <Field label="From Date"><input type="date" className="admin-input" value={draft.from} onChange={(e) => setDraft({ ...draft, from: e.target.value })} /></Field>
        <Field label="To Date"><input type="date" className="admin-input" value={draft.to} onChange={(e) => setDraft({ ...draft, to: e.target.value })} /></Field>
        <Btn onClick={() => setF(draft)}>Submit</Btn>
      </div>
      <Tabs value={tab} onChange={setTab} items={[{ id: "all", label: `All (${auto.length})` }, { id: "success", label: `To Check (${n("success")})` }, { id: "approved", label: `Approved (${n("approved")})` }, { id: "rejected", label: `Rejected (${n("rejected")})` }]} />
      <div className="text-sm text-slate-600 mb-3">Total: <b>{inr(sum(list, (x) => x.amount))}</b> in {list.length} deposits</div>
      <DataTable key={tab} head={["#", "User Name", "Mobile", "Amount", "UPI App", "UTR", "Wallet", "Date", "Action / Status"]}
        rows={list.map((x, i) => {
          const u = findUser(s, x.userId)!;
          return [i + 1, u.name, u.mobile, <b key="a">{inr(x.amount)}</b>, x.mode, x.utr, inr(u.balance), `${fmtDate(x.date)} ${fmtTime(x.time)}`,
            x.status === "success" ? <div key="b" className="flex gap-1.5"><Btn size="sm" variant="green" onClick={() => act(x.id, "approved")}>Approve</Btn><Btn size="sm" variant="red" onClick={() => act(x.id, "rejected")}>Reject</Btn></div>
              : x.status === "rejected" ? <Badge key="s" tone="red">Rejected · Reversed</Badge> : <Badge key="s" tone="green">Approved</Badge>];
        })}
        text={list.map((x) => { const u = findUser(s, x.userId)!; return `${u.name} ${u.mobile} ${x.utr}`; })} />
    </Card>
  );
}
