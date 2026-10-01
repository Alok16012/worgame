"use client";

import { useState } from "react";
import { decideWithdraw, findUser, manualFund } from "../../lib/engine";
import { addDays, fmtDate, fmtTime, inr, sum, ymd } from "../../lib/format";
import { useStore } from "../../lib/store";
import type { TxnStatus } from "../../lib/types";
import { Badge, Btn, Card, DataTable, Field, Stat, Tabs, useAdmin } from "../ui";

export function FundManagement() {
  const { state: s, attempt } = useStore();
  const { confirm, toast } = useAdmin();
  const [f, setF] = useState({ user: 0, dir: "cr" as "cr" | "dr", amount: "", remark: "" });
  const list = s.txns.filter((x) => x.type === "deposit" || x.type === "manual").slice().reverse();

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

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <Stat label="Total Wallet Balance" value={inr(sum(s.users, (u) => u.balance))} />
        <Stat label="Total Deposit (UPI)" value={inr(sum(s.txns.filter((x) => x.type === "deposit"), (x) => x.amount))} tone="green" />
        <Stat label="Total Withdraw (Paid)" value={inr(sum(s.txns.filter((x) => x.type === "withdraw" && x.status === "approved"), (x) => x.amount))} tone="red" />
        <Stat label="Added Manually" value={inr(sum(s.txns.filter((x) => x.type === "manual" && x.dir === "cr"), (x) => x.amount))} />
      </div>
      <Card title="Add / Withdraw Fund">
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
      <Card className="mt-5" title="Add Fund Request">
        <DataTable head={["Sr No", "User Name", "Mobile", "Amount", "Transaction", "Mode", "Remark", "Date", "Status"]}
          rows={list.map((x, i) => { const u = findUser(s, x.userId)!; return [i + 1, u.name, u.mobile, inr(x.amount), <span key="t" className={x.dir === "cr" ? "text-emerald-600" : "text-rose-600"}>{x.dir === "cr" ? "Credit" : "Debit"}</span>, x.mode ?? "—", x.remark, `${fmtDate(x.date)} ${fmtTime(x.time)}`, <Badge key="s" tone="green">Approved</Badge>]; })}
          text={list.map((x) => { const u = findUser(s, x.userId)!; return `${u.name} ${u.mobile} ${x.mode}`; })} />
      </Card>
    </>
  );
}

export function WithdrawManagement({ go }: { go: (r: string) => void }) {
  const { state: s, attempt } = useStore();
  const { confirm, toast } = useAdmin();
  const [tab, setTab] = useState<Exclude<TxnStatus, "success">>("pending");
  const all = s.txns.filter((x) => x.type === "withdraw");
  const list = all.filter((x) => x.status === tab).slice().reverse();
  const n = (st: TxnStatus) => all.filter((x) => x.status === st).length;

  const act = async (id: number, st: "approved" | "rejected") => {
    const x = all.find((t) => t.id === id)!;
    const u = findUser(s, x.userId)!;
    const ok = await confirm({
      title: st === "approved" ? "Approve Withdraw" : "Reject Withdraw",
      body: st === "approved" ? <>Confirm you have paid <b>{inr(x.amount)}</b> to {u.name} — {x.payTo}.</> : <>Reject <b>{inr(x.amount)}</b> of {u.name}? The amount goes back to the user&apos;s wallet.</>,
      ok: st === "approved" ? "Approve" : "Reject", tone: st === "approved" ? "green" : "red",
    });
    if (!ok) return;
    const r = attempt((d) => decideWithdraw(d, id, st));
    if (r.ok) toast(`Withdraw ${st}`, "ok"); else toast(r.error, "bad");
  };

  return (
    <Card title="Withdraw Management">
      <Tabs value={tab} onChange={setTab} items={[{ id: "pending", label: `Pending (${n("pending")})` }, { id: "approved", label: `Approved (${n("approved")})` }, { id: "rejected", label: `Rejected (${n("rejected")})` }]} />
      <DataTable key={tab} head={["Sr No", "User Name", "Mobile", "Amount", "Pay To", "Wallet", "Date", "Time", "Action"]}
        rows={list.map((x, i) => {
          const u = findUser(s, x.userId)!;
          return [i + 1, <button key="u" className="hover:text-[#0d6efd]" onClick={() => go(`users/${u.id}`)}>{u.name}</button>, u.mobile, <b key="a">{inr(x.amount)}</b>, <span key="p" className="whitespace-normal">{x.payTo}</span>, inr(u.balance), fmtDate(x.date), fmtTime(x.time),
            tab === "pending" ? <div key="b" className="flex gap-1.5"><Btn size="sm" variant="green" onClick={() => act(x.id, "approved")}>Approve</Btn><Btn size="sm" variant="red" onClick={() => act(x.id, "rejected")}>Reject</Btn></div>
              : <Badge key="s" tone={tab === "approved" ? "green" : "red"}>{tab === "approved" ? "Approved" : "Rejected"}</Badge>];
        })}
        text={list.map((x) => { const u = findUser(s, x.userId)!; return `${u.name} ${u.mobile}`; })} />
    </Card>
  );
}

export function AutoDeposit() {
  const { state: s } = useStore();
  const [draft, setDraft] = useState({ from: addDays(-6), to: ymd() });
  const [f, setF] = useState(draft);
  const list = s.txns.filter((x) => x.type === "deposit" && x.date >= f.from && x.date <= f.to).slice().reverse();
  return (
    <Card title="Auto Deposit History">
      <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-4 items-end mb-4">
        <Field label="From Date"><input type="date" className="admin-input" value={draft.from} onChange={(e) => setDraft({ ...draft, from: e.target.value })} /></Field>
        <Field label="To Date"><input type="date" className="admin-input" value={draft.to} onChange={(e) => setDraft({ ...draft, to: e.target.value })} /></Field>
        <Btn onClick={() => setF(draft)}>Submit</Btn>
      </div>
      <div className="text-sm text-slate-600 mb-3">Total: <b>{inr(sum(list, (x) => x.amount))}</b> in {list.length} deposits</div>
      <DataTable head={["#", "User Name", "Mobile", "Amount", "UPI App", "UTR", "Date"]}
        rows={list.map((x, i) => { const u = findUser(s, x.userId)!; return [i + 1, u.name, u.mobile, inr(x.amount), x.mode, x.utr, `${fmtDate(x.date)} ${fmtTime(x.time)}`]; })}
        text={list.map((x) => { const u = findUser(s, x.userId)!; return `${u.name} ${u.mobile} ${x.utr}`; })} />
    </Card>
  );
}
