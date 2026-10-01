"use client";

import { useState } from "react";
import { Building2, CheckCircle2, Hash, IndianRupee, Loader2, MapPin, MessageCircle, Pencil, Code2, User } from "lucide-react";
import { deposit, requestWithdraw, updateUser } from "../../lib/engine";
import { fmtDate, fmtTime } from "../../lib/format";
import { useStore } from "../../lib/store";
import type { Bank } from "../../lib/types";
import type { Nav } from "../nav";
import { Header, IconField, Popup, Sheet, UserCard, useSession, whatsappLink } from "../ui";

const APPS: { id: string; label: string; bg: string; fg: string; mark: string }[] = [
  { id: "CRED", label: "CRED", bg: "#1c1c1c", fg: "#fff", mark: "C" },
  { id: "Google Pay", label: "Google Pay", bg: "#fff", fg: "#4285f4", mark: "G" },
  { id: "Paytm", label: "Paytm", bg: "#00baf2", fg: "#fff", mark: "P" },
  { id: "PhonePe", label: "PhonePe", bg: "#5f259f", fg: "#fff", mark: "पे" },
];

function AmountField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#f6b52e] grid place-items-center text-white"><IndianRupee size={18} /></div>
      <input className="yfield !pl-14 !rounded-xl" inputMode="numeric" placeholder="Enter Amount" value={value} onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 7))} />
    </div>
  );
}

export function Deposit({ nav }: { nav: Nav }) {
  const { state, attempt } = useStore();
  const { user, toast } = useSession();
  const s = state.settings;
  const [amount, setAmount] = useState("");
  const [app, setApp] = useState("Google Pay");
  const [stage, setStage] = useState<null | "pay" | "wait" | "done">(null);
  const amt = Number(amount) || 0;

  const start = () => {
    if (amt < s.minDeposit || amt > s.maxDeposit) return toast(`Deposit range is ₹${s.minDeposit} - ₹${s.maxDeposit}`, "bad");
    setStage("pay");
  };
  // Simulated UPI intent: the UPI app opens, the user approves, the gateway confirms and the wallet is auto-credited.
  const pay = () => {
    setStage("wait");
    window.setTimeout(() => {
      const r = attempt((d) => deposit(d, user.id, amt, app));
      if (!r.ok) { setStage(null); return toast(r.error, "bad"); }
      setStage("done");
    }, 1600);
  };

  return (
    <>
      <Header title="Deposit Funds" onBack={nav.back} />
      <div className="px-4 space-y-4">
        <UserCard />
        <div>
          <AmountField value={amount} onChange={setAmount} />
          <div className="text-[#dc2f45] text-xs mt-2 ml-2">*Deposit Range: ₹{s.minDeposit} - ₹{s.maxDeposit}</div>
        </div>
        <button className="ybtn w-full py-3 rounded-xl text-lg" disabled={!amt} onClick={start}>DEPOSIT</button>
        <div className="text-center font-bold text-slate-700">Choose UPI App</div>
        <div className="grid grid-cols-4 gap-3">
          {APPS.map((a) => (
            <button key={a.id} onClick={() => setApp(a.id)} className={`flex flex-col items-center gap-1.5 rounded-xl p-2 ${app === a.id ? "bg-white ring-2 ring-[#f6b52e]" : ""}`}>
              <span className="w-12 h-12 rounded-xl grid place-items-center text-xl font-black shadow" style={{ background: a.bg, color: a.fg }}>{a.mark}</span>
              <span className="text-[11px] text-slate-600">{a.label}</span>
            </button>
          ))}
        </div>
        <a href={whatsappLink(s.contact.whatsapp)} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 text-sm text-slate-600 bg-[#fde2e4] rounded-lg py-3">
          For Fund Related Query <MessageCircle size={16} className="text-emerald-600" /> {s.contact.whatsapp}
        </a>
      </div>

      <Sheet open={stage !== null} onClose={() => (stage === "pay" || stage === "done") && (stage === "done" ? nav.back() : setStage(null))}>
        {stage === "pay" && (
          <div>
            <div className="text-center text-slate-500 text-sm">Paying to {s.appName} ({s.upiId}) via {app}</div>
            <div className="text-center text-5xl font-bold text-slate-900 my-6">₹{amt}</div>
            <button className="w-full bg-[#0b3c8c] text-white font-semibold py-3.5 rounded-full" onClick={pay}>Pay Securely ₹{amt}</button>
            <button className="w-full text-[#0b3c8c] font-semibold py-3 mt-1" onClick={() => setStage(null)}>Cancel Payment</button>
            <div className="text-center text-[11px] text-slate-400">Demo: no real payment is made.</div>
          </div>
        )}
        {stage === "wait" && <div className="text-center py-8"><Loader2 size={44} className="mx-auto animate-spin text-[#f6b52e]" /><div className="font-semibold mt-4">Waiting for payment confirmation…</div></div>}
        {stage === "done" && (
          <div className="text-center py-4">
            <CheckCircle2 size={56} className="mx-auto text-emerald-500 pop" />
            <div className="text-xl font-bold mt-3">₹{amt} added to wallet</div>
            <div className="text-sm text-slate-500 mt-1">New balance ₹{user.balance}</div>
            <button className="ybtn w-full py-3 rounded-xl mt-6" onClick={() => nav.back()}>OK</button>
          </div>
        )}
      </Sheet>
    </>
  );
}

export function Withdraw({ nav }: { nav: Nav }) {
  const { state, attempt } = useStore();
  const { user, toast } = useSession();
  const s = state.settings;
  const [amount, setAmount] = useState("");
  const hasBank = !!(user.bank.account || user.phonepe || user.gpay || user.paytm);
  const submit = () => {
    const r = attempt((d) => requestWithdraw(d, user.id, Number(amount) || 0));
    if (!r.ok) return toast(r.error, "bad");
    toast("Withdraw request submitted successfully!");
    setAmount("");
  };
  return (
    <>
      <Header title="Withdraw Fund" onBack={nav.back} />
      <div className="px-4 space-y-4">
        <UserCard />
        <div className="text-center text-sm text-slate-600">
          For Withdraw Related Query
          <a href={whatsappLink(s.contact.whatsapp)} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1 font-bold text-slate-800 text-base"><MessageCircle size={17} className="text-emerald-600" /> {s.contact.whatsapp}</a>
          <div className="text-[#dc2f45] text-xs mt-1">*Withdraw Time {s.withdraw.from} to {s.withdraw.to}</div>
        </div>
        <div>
          <AmountField value={amount} onChange={setAmount} />
          <div className="text-[#dc2f45] text-xs mt-2 ml-2">*Withdraw Range ₹{s.minWithdraw} - ₹{s.maxWithdraw}</div>
        </div>
        {hasBank
          ? <button className="ybtn w-full py-3 rounded-xl text-lg" disabled={!Number(amount)} onClick={submit}>WITHDRAW REQUEST</button>
          : <button className="ybtn w-full py-3 rounded-xl text-lg" onClick={() => nav.push({ name: "bank" })}>ADD BANK DETAILS</button>}
        <button className="ybtn w-full py-3 rounded-xl text-lg" onClick={() => nav.push({ name: "withdrawHistory" })}>VIEW WITHDRAW HISTORY</button>
        {hasBank && <button className="w-full text-sm text-[#b7791f] underline" onClick={() => nav.push({ name: "bank" })}>Update bank details</button>}
      </div>
    </>
  );
}

export function BankDetails({ nav }: { nav: Nav }) {
  const { update } = useStore();
  const { user, toast } = useSession();
  const [bank, setBank] = useState<Bank>(user.bank);
  const [edit, setEdit] = useState<null | { key: "paytm" | "phonepe" | "gpay"; label: string; value: string }>(null);

  const save = () => {
    if (!bank.holder.trim() || !bank.bank.trim() || !/^\d{9,18}$/.test(bank.account) || !/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/.test(bank.ifsc)) return toast("Enter valid holder name, bank, account number and IFSC", "bad");
    update((d) => updateUser(d, user.id, { bank: { ...bank, ifsc: bank.ifsc.toUpperCase() } }));
    toast("Profile Updated Successfully!");
  };
  const upi: { key: "paytm" | "phonepe" | "gpay"; label: string }[] = [{ key: "paytm", label: "Paytm" }, { key: "phonepe", label: "PhonePe" }, { key: "gpay", label: "Google Pay" }];

  return (
    <>
      <Header title="Add Bank Details" onBack={nav.back} />
      <div className="px-4 space-y-4">
        <IconField icon={<User size={18} />} placeholder="Account Holder Name" value={bank.holder} onChange={(e) => setBank({ ...bank, holder: e.target.value })} />
        <IconField icon={<Building2 size={18} />} placeholder="Bank Name" value={bank.bank} onChange={(e) => setBank({ ...bank, bank: e.target.value })} />
        <IconField icon={<Hash size={18} />} placeholder="Account Number" inputMode="numeric" value={bank.account} onChange={(e) => setBank({ ...bank, account: e.target.value.replace(/\D/g, "") })} />
        <IconField icon={<Code2 size={18} />} placeholder="IFSC Code" value={bank.ifsc} onChange={(e) => setBank({ ...bank, ifsc: e.target.value.toUpperCase() })} />
        <IconField icon={<MapPin size={18} />} placeholder="Bank Address" value={bank.address} onChange={(e) => setBank({ ...bank, address: e.target.value })} />
        <button className="ybtn w-full py-3 rounded-xl text-lg" onClick={save}>Update Bank Details</button>
        {upi.map((x) => (
          <div key={x.key} className="ybox flex items-center px-4 py-3 text-slate-700">
            <span className="flex-1">{x.label} No :- {user[x.key] || "Not Added"}</span>
            <button onClick={() => setEdit({ ...x, value: user[x.key] })} className="text-[#f6b52e]" aria-label="Edit"><Pencil size={18} /></button>
          </div>
        ))}
      </div>
      <Popup open={!!edit} onClose={() => setEdit(null)} title={`Update ${edit?.label} Number`}>
        <IconField icon={<Hash size={18} />} placeholder={`Enter ${edit?.label} Number`} inputMode="numeric" maxLength={10} value={edit?.value ?? ""} onChange={(e) => edit && setEdit({ ...edit, value: e.target.value.replace(/\D/g, "") })} />
        <button className="ybtn w-full py-3 rounded-xl mt-4" onClick={() => {
          if (!edit) return;
          if (!/^[6-9]\d{9}$/.test(edit.value)) return toast("Enter a valid 10-digit number", "bad");
          update((d) => updateUser(d, user.id, { [edit.key]: edit.value }));
          setEdit(null);
          toast("Profile Updated Successfully!");
        }}>UPDATE</button>
      </Popup>
    </>
  );
}

export function WithdrawHistory({ nav }: { nav: Nav }) {
  const { state } = useStore();
  const { user } = useSession();
  const list = state.txns.filter((x) => x.userId === user.id && x.type === "withdraw").reverse();
  const color = { pending: "bg-amber-500", approved: "bg-emerald-500", rejected: "bg-rose-500", success: "bg-emerald-500" } as const;
  return (
    <>
      <Header title="Withdraw History" onBack={nav.back} />
      <div className="px-4 space-y-3">
        {list.length ? list.map((x) => (
          <div key={x.id} className="ybox p-4">
            <div className="flex justify-between items-center"><span className="text-lg font-bold">₹{x.amount}</span><span className={`text-white text-xs font-semibold px-2.5 py-1 rounded capitalize ${color[x.status]}`}>{x.status}</span></div>
            <div className="text-xs text-slate-500 mt-1">{fmtDate(x.date)} {fmtTime(x.time)}</div>
            <div className="text-xs text-slate-600 mt-1">{x.payTo}</div>
          </div>
        )) : <div className="text-center text-slate-500 mt-16">No withdraw history</div>}
      </div>
    </>
  );
}
