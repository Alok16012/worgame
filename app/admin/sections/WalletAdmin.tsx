"use client";

import { useState } from "react";
import { decideWithdraw, findUser, manualFund } from "../../lib/engine";
import { addDays, fmtDate, fmtTime, inr, sum, ymd } from "../../lib/format";
import { useStore } from "../../lib/store";
import type { TxnStatus } from "../../lib/types";
import { Badge, Btn, Card, Field, Stat, Table, Tabs, Title, useAdmin } from "../ui";

export function FundManagement({ initialUser }: { initialUser?: number }) {
  const { state: s, attempt } = useStore();
  const { confirm, toast } = useAdmin();
  const [f, setF] = useState({ user: initialUser ?? 0, dir: "cr" as "cr" | "dr", amount: "", note: "" });
  const manual = s.txns.filter((x) => x.type === "manual").slice().reverse();

  const submit = async () => {
    const u = findUser(s, f.user);
    const amt = Number(f.amount);
    if (!u || !(amt > 0)) return toast("Select a user and enter a valid amount", "bad");
    const ok = await confirm({
      title: f.dir === "cr" ? "Add funds" : "Deduct funds",
      body: <>{f.dir === "cr" ? "Add" : "Deduct"} <b>{inr(amt)}</b> {f.dir === "cr" ? "to" : "from"} <b>{u.name}</b> (current balance {inr(u.balance)})?</>,
      tone: f.dir === "cr" ? "green" : "red",
    });
    if (!ok) return;
    const r = attempt((d) => manualFund(d, u.id, f.dir, amt, f.note.trim()));
    if (r.ok) { toast("Wallet updated", "ok"); setF({ ...f, amount: "", note: "" }); } else toast(r.error, "bad");
  };

  return (
    <>
      <Title t="Fund Management" s="Platform money overview, plus manual wallet adjustments (cash deposits, bonus, corrections)." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <Stat label="Total Wallet Balance (Platform)" value={inr(sum(s.users, (u) => u.balance))} />
        <Stat label="Total Deposits (UPI)" value={inr(sum(s.txns.filter((x) => x.type === "deposit"), (x) => x.amount))} tone="green" />
        <Stat label="Withdrawals Paid" value={inr(sum(s.txns.filter((x) => x.type === "withdraw" && x.status === "approved"), (x) => x.amount))} tone="red" />
        <Stat label="Manual Added" value={inr(sum(s.txns.filter((x) => x.type === "manual" && x.dir === "cr"), (x) => x.amount))} />
      </div>
      <Card title="Add / Deduct Funds Manually" desc="Every adjustment is recorded in the Activity Log with the admin's name.">
        <div className="grid md:grid-cols-[2fr_1fr_1fr_2fr_auto] gap-3 items-end">
          <Field label="User">
            <select className="admin-input" value={f.user} onChange={(e) => setF({ ...f, user: Number(e.target.value) })}>
              <option value={0}>-Select User-</option>
              {s.users.map((u) => <option key={u.id} value={u.id}>{u.name} — {u.mobile} ({inr(u.balance)})</option>)}
            </select>
          </Field>
          <Field label="Type">
            <select className="admin-input" value={f.dir} onChange={(e) => setF({ ...f, dir: e.target.value as "cr" | "dr" })}><option value="cr">Add Funds</option><option value="dr">Deduct Funds</option></select>
          </Field>
          <Field label="Amount (₹)"><input type="number" min={1} className="admin-input" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Field>
          <Field label="Remark"><input className="admin-input" placeholder="e.g. Cash received" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></Field>
          <Btn onClick={submit}>Submit</Btn>
        </div>
      </Card>
      <Card className="mt-4" title="Manual Fund History">
        <Table head={["Date", "User", "Mobile", "Type", "Amount", "Remark"]} rows={manual.map((x) => {
          const u = findUser(s, x.userId)!;
          return [`${fmtDate(x.date)} ${fmtTime(x.time)}`, u.name, u.mobile, x.dir === "cr" ? <Badge key="t" tone="green">Added</Badge> : <Badge key="t" tone="red">Deducted</Badge>, <b key="a">{inr(x.amount)}</b>, x.note ?? ""];
        })} />
      </Card>
    </>
  );
}

export function WithdrawManagement() {
  const { state: s, attempt } = useStore();
  const { confirm, toast } = useAdmin();
  const [tab, setTab] = useState<Exclude<TxnStatus, "success">>("pending");
  const all = s.txns.filter((x) => x.type === "withdraw");
  const list = all.filter((x) => x.status === tab).slice().reverse();
  const count = (st: TxnStatus) => all.filter((x) => x.status === st).length;

  const act = async (id: number, st: "approved" | "rejected") => {
    const x = all.find((t) => t.id === id)!;
    const u = findUser(s, x.userId)!;
    const ok = await confirm({
      title: st === "approved" ? "Approve withdrawal" : "Reject withdrawal",
      body: st === "approved" ? <>Confirm you have paid <b>{inr(x.amount)}</b> to <b>{x.upi ?? u.upi}</b> ({u.name}).</> : <>Reject <b>{inr(x.amount)}</b> for <b>{u.name}</b>? The amount goes back to their wallet.</>,
      ok: st === "approved" ? "Approve" : "Reject", tone: st === "approved" ? "green" : "red",
    });
    if (!ok) return;
    const r = attempt((d) => decideWithdraw(d, id, st));
    if (r.ok) toast(`Withdrawal ${st}`, "ok"); else toast(r.error, "bad");
  };

  return (
    <>
      <Title t="Withdraw Management" s="The amount is held from the wallet at request time. Approve after paying out; rejecting refunds the wallet." />
      <Card>
        <Tabs value={tab} onChange={setTab} items={[
          { id: "pending", label: `Pending (${count("pending")})` },
          { id: "approved", label: `Approved (${count("approved")})` },
          { id: "rejected", label: `Rejected (${count("rejected")})` },
        ]} />
        <Table head={["Req ID", "User", "Mobile", "Amount", "Pay To", "Wallet Now", "Requested", tab === "pending" ? "Action" : "Status"]} rows={list.map((x) => {
          const u = findUser(s, x.userId)!;
          return [`#${x.id}`, u.name, u.mobile, <b key="a">{inr(x.amount)}</b>, x.upi ?? u.upi, inr(u.balance), `${fmtDate(x.date)} ${fmtTime(x.time)}`,
            tab === "pending" ? <div key="b" className="flex gap-1.5"><Btn size="sm" variant="green" onClick={() => act(x.id, "approved")}>Approve</Btn><Btn size="sm" variant="red" onClick={() => act(x.id, "rejected")}>Reject</Btn></div>
              : tab === "approved" ? <Badge key="s" tone="green">Paid</Badge> : <Badge key="s" tone="red">Rejected · refunded</Badge>];
        })} />
      </Card>
    </>
  );
}

export function AutoDeposit() {
  const { state: s } = useStore();
  const [draft, setDraft] = useState({ from: addDays(-6), to: ymd(), q: "" });
  const [f, setF] = useState(draft);
  const list = s.txns.filter((x) => {
    if (x.type !== "deposit" || x.date < f.from || x.date > f.to) return false;
    const u = findUser(s, x.userId)!;
    return !f.q || u.name.toLowerCase().includes(f.q.toLowerCase()) || u.mobile.includes(f.q);
  }).slice().reverse();
  return (
    <>
      <Title t="Auto Deposit History" s="UPI payments confirmed by the gateway and credited automatically." />
      <Card>
        <div className="grid sm:grid-cols-[1fr_1fr_1.5fr_auto] gap-3 items-end">
          <Field label="From"><input type="date" className="admin-input" value={draft.from} onChange={(e) => setDraft({ ...draft, from: e.target.value })} /></Field>
          <Field label="To"><input type="date" className="admin-input" value={draft.to} onChange={(e) => setDraft({ ...draft, to: e.target.value })} /></Field>
          <Field label="User"><input className="admin-input" placeholder="Name or mobile" value={draft.q} onChange={(e) => setDraft({ ...draft, q: e.target.value })} /></Field>
          <Btn onClick={() => setF(draft)}>Filter</Btn>
        </div>
      </Card>
      <div className="grid grid-cols-2 gap-4 my-4">
        <Stat label="Deposits in range" value={list.length} />
        <Stat label="Total amount" value={inr(sum(list, (x) => x.amount))} tone="green" />
      </div>
      <Card>
        <Table head={["#", "User Name", "Mobile", "Amount", "Mode", "UTR / Ref", "Status", "Date"]} rows={list.map((x, i) => {
          const u = findUser(s, x.userId)!;
          return [i + 1, u.name, u.mobile, <b key="a">{inr(x.amount)}</b>, x.mode ?? "UPI", x.utr ?? "—", <Badge key="s" tone="green">Success</Badge>, `${fmtDate(x.date)} ${fmtTime(x.time)}`];
        })} />
      </Card>
    </>
  );
}
