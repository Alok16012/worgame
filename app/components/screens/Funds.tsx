"use client";

import { useState } from "react";
import { Building2, CheckCircle2, ChevronDown, Clock, Code2, Copy, Hash, IndianRupee, MapPin, MessageCircle, Pencil, ShieldAlert, User } from "lucide-react";
import { autoUpiDeposit, deposit, requestFund, requestWithdraw, submitUpiDeposit, updateUser } from "../../lib/engine";
import { fmtDate, fmtTime, inr } from "../../lib/format";
import { useStore } from "../../lib/store";
import { PAY_METHODS, type Bank, type PayMethod } from "../../lib/types";
import { canUseUpiIntent, payWithUpiIntent } from "../../lib/upi";
import type { Nav } from "../nav";
import { AlertBox, Header, IconField, Popup, Sheet, UserCard, useSession, whatsappLink } from "../ui";

// UPI apps open through their deep links with the merchant UPI ID + amount prefilled.
// `pkg` targets the app directly for the native UPI intent (Auto UPI in the APK).
const APPS: { id: string; label: string; bg: string; fg: string; mark: string; scheme: string; pkg?: string }[] = [
  { id: "PhonePe", label: "PhonePe", bg: "#5f259f", fg: "#fff", mark: "पे", scheme: "phonepe://pay", pkg: "com.phonepe.app" },
  { id: "Google Pay", label: "Google Pay", bg: "#fff", fg: "#4285f4", mark: "G", scheme: "tez://upi/pay", pkg: "com.google.android.apps.nbu.paisa.user" },
  { id: "Paytm", label: "Paytm", bg: "#00baf2", fg: "#fff", mark: "P", scheme: "paytmmp://pay", pkg: "net.one97.paytm" },
  { id: "UPI", label: "Other UPI", bg: "#13306f", fg: "#f5c542", mark: "UPI", scheme: "upi://pay" },
];

function upiLink(scheme: string, vpa: string, name: string, amount: number) {
  const q = Object.entries({ pa: vpa, pn: name, am: String(amount), cu: "INR", tn: "Add Fund" }).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
  return `${scheme}?${q}`;
}

export function Deposit({ nav }: { nav: Nav }) {
  const { state, attempt } = useStore();
  const { user, toast } = useSession();
  const s = state.settings;
  const [amount, setAmount] = useState("");
  const [paying, setPaying] = useState<null | string>(null);
  const [utr, setUtr] = useState("");
  const [copied, setCopied] = useState(false);
  const [alert, setAlert] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const amt = Number(amount) || 0;

  const openUpiApp = async (app: (typeof APPS)[number]) => {
    if (busy) return;
    if (amt < s.minDeposit || amt > s.maxDeposit) {
      return setAlert(`Deposit range is ₹${s.minDeposit} - ₹${s.maxDeposit}`);
    }
    // Auto UPI: open the app via native intent and credit only when it reports SUCCESS.
    // The website can't read the UPI result, so it always uses the UTR flow below.
    if (s.autoUpi && canUseUpiIntent()) {
      setBusy(true);
      const res = await payWithUpiIntent({ vpa: s.upiId, payeeName: s.appName, amount: amt, txnRef: `SK${user.id}T${Date.now()}`, pkg: app.pkg });
      setBusy(false);
      if (res.status === "success") {
        const r = attempt((d) => autoUpiDeposit(d, user.id, amt, app.id, res.txnId));
        if (!r.ok) return setAlert(r.error);
        toast(`₹${amt} wallet mein add ho gaye!`, "ok");
        setAmount("");
        return;
      }
      setAlert(res.message);
      if (res.status === "failed") {
        // Money may have left the account anyway; let them claim it with the UTR.
        setPaying(app.id);
        setUtr("");
      }
      return;
    }
    setPaying(app.id);
    setUtr("");
    window.location.href = upiLink(app.scheme, s.upiId, s.appName, amt);
  };

  const copyUpiId = () => {
    navigator.clipboard?.writeText(s.upiId);
    setCopied(true);
    toast("UPI ID copied to clipboard!", "ok");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleManualRequest = () => {
    if (amt < s.minDeposit || amt > s.maxDeposit) {
      return setAlert(`Deposit range is ₹${s.minDeposit} - ₹${s.maxDeposit}`);
    }
    const r = attempt((d) => requestFund(d, user.id, amt));
    if (!r.ok) return setAlert(r.error);
    toast("Add Fund request sent. Admin will contact you for payment.");
    setAmount("");
  };

  const handleUtrSubmit = () => {
    const cleanUtr = utr.trim().replace(/\D/g, "");
    if (cleanUtr.length !== 12) {
      return setAlert("Please enter the complete 12-digit UPI Reference / UTR Number from your payment receipt.");
    }
    const r = attempt((d) => submitUpiDeposit(d, user.id, amt, paying ?? "UPI", cleanUtr));
    if (!r.ok) return setAlert(r.error);

    setPaying(null);
    setUtr("");
    setAmount("");
    toast(`Deposit request of ₹${amt} submitted! Admin will verify and credit your wallet.`, "ok");
  };

  // Recent user deposit requests
  const userDeposits = state.txns
    .filter((x) => x.userId === user.id && x.type === "deposit")
    .slice()
    .reverse()
    .slice(0, 5);

  const pending = userDeposits.find((x) => x.status === "pending");

  return (
    <>
      <Header title="Add Fund" onBack={nav.back} />
      <div className="px-4 pt-4 space-y-4">
        <UserCard />

        {/* Enter Amount Card */}
        <div className="ybox p-4">
          <div className="font-semibold text-slate-800">Enter Amount</div>
          <div className="relative mt-3">
            <IndianRupee size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#13306f]" />
            <input
              className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-3 outline-none text-lg font-semibold"
              inputMode="numeric"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/\D/g, "").slice(0, 7))}
            />
          </div>
          <div className="text-xs text-slate-500 mt-1.5">Deposit range: ₹{s.minDeposit} - ₹{s.maxDeposit}</div>
          <div className="flex gap-2 mt-3 flex-wrap">
            {[500, 1000, 2000, 5000].map((v) => (
              <button
                key={v}
                onClick={() => setAmount(String(v))}
                className="px-3.5 py-1.5 rounded-full border border-[#13306f]/30 font-medium text-[#13306f] text-sm hover:bg-[#13306f]/5"
              >
                ₹{v}
              </button>
            ))}
          </div>
        </div>

        {/* Pay With UPI App */}
        <div className="ybox p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold text-slate-800">Pay With UPI App</div>
            <button onClick={copyUpiId} className="flex items-center gap-1 text-xs text-[#0d6efd] font-medium bg-blue-50 px-2.5 py-1 rounded-md">
              <Copy size={13} /> {copied ? "Copied!" : "Copy UPI ID"}
            </button>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {APPS.map((a) => (
              <button
                key={a.id}
                onClick={() => openUpiApp(a)}
                className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
              >
                <span
                  className="w-14 h-14 rounded-2xl grid place-items-center text-lg font-black shadow-sm border border-slate-100"
                  style={{ background: a.bg, color: a.fg }}
                >
                  {a.mark}
                </span>
                <span className="text-[11px] font-medium text-slate-600">{a.label}</span>
              </button>
            ))}
          </div>
          <div className="text-[11px] text-slate-500 mt-3.5 text-center">
            Merchant UPI: <b className="font-mono text-slate-700">{s.upiId}</b>
          </div>
        </div>

        {/* Pending Request Alert */}
        {pending && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs p-3.5 flex items-start gap-2.5">
            <Clock size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              Your Add Fund request of <b>₹{pending.amount}</b> {pending.utr ? `(UTR: ${pending.utr})` : ""} is waiting for admin verification. Wallet will be credited once verified.
            </div>
          </div>
        )}

        {/* Recent Deposit Requests */}
        {userDeposits.length > 0 && (
          <div className="ybox p-4">
            <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2.5">Recent Deposit History</div>
            <div className="space-y-2">
              {userDeposits.map((d) => (
                <div key={d.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0 text-xs">
                  <div>
                    <div className="font-semibold text-slate-800">₹{d.amount} · {d.mode || "UPI"}</div>
                    <div className="text-slate-400 text-[10px]">{fmtDate(d.date)} {fmtTime(d.time)} {d.utr ? `· UTR: ${d.utr}` : ""}</div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      d.status === "approved" || d.status === "success"
                        ? "bg-emerald-50 text-emerald-700"
                        : d.status === "rejected"
                        ? "bg-rose-50 text-rose-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {d.status === "approved" || d.status === "success" ? "Approved" : d.status === "rejected" ? "Rejected" : "Under Review"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WhatsApp Help */}
        <a
          href={whatsappLink(s.contact.whatsapp)}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-1.5 text-xs text-slate-600 bg-white rounded-lg py-3 shadow-sm border border-slate-100"
        >
          For Fund Related Queries <MessageCircle size={15} className="text-emerald-600" /> {s.contact.whatsapp}
        </a>
      </div>

      {/* UPI UTR Verification Bottom Sheet */}
      <Sheet open={!!paying} onClose={() => setPaying(null)}>
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Step 2: Confirm Payment</div>
            <div className="text-3xl font-extrabold text-[#13306f] my-2">₹{amt}</div>
            <div className="text-xs text-slate-600">
              Pay to UPI ID: <b className="font-mono text-slate-800">{s.upiId}</b>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 space-y-1">
            <div>1. Complete the ₹{amt} payment in <b>{paying}</b>.</div>
            <div>2. Copy the <b>12-digit UPI Ref / UTR Number</b> from your payment receipt.</div>
            <div>3. Enter the 12-digit UTR below to submit for instant admin approval.</div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Enter 12-Digit UPI Reference / UTR Number <span className="text-rose-500">*</span>
            </label>
            <input
              className="w-full border border-slate-300 rounded-xl px-3.5 py-3 text-base font-mono font-semibold tracking-wider outline-none focus:border-[#13306f]"
              inputMode="numeric"
              placeholder="e.g. 429182746192"
              maxLength={12}
              value={utr}
              onChange={(e) => setUtr(e.target.value.replace(/\D/g, "").slice(0, 12))}
            />
            <div className="text-[10px] text-slate-400 mt-1">
              {utr.length}/12 Digits Entered
            </div>
          </div>

          <button
            className="ybtn w-full py-3.5 rounded-xl font-bold text-sm shadow-md disabled:opacity-50"
            disabled={utr.length !== 12}
            onClick={handleUtrSubmit}
          >
            Submit UTR & Deposit Request
          </button>

          <button
            className="w-full py-2.5 text-slate-500 text-xs font-medium"
            onClick={() => setPaying(null)}
          >
            Cancel
          </button>
        </div>
      </Sheet>

      <AlertBox open={!!alert} msg={alert ?? ""} onClose={() => setAlert(null)} />
    </>
  );
}

const FIELD: Record<PayMethod, "phonepe" | "gpay" | "paytm" | "upi"> = { PhonePe: "phonepe", "Google Pay": "gpay", Paytm: "paytm", "UPI ID": "upi" };

export function Withdraw({ nav }: { nav: Nav }) {
  const { state, attempt } = useStore();
  const { user, toast } = useSession();
  const s = state.settings;
  const first = PAY_METHODS.find((m) => user[FIELD[m]]) ?? "PhonePe";
  const [method, setMethod] = useState<PayMethod>(first);
  const [account, setAccount] = useState(user[FIELD[first]] || user.mobile);
  const [amount, setAmount] = useState("");
  const [pick, setPick] = useState(false);
  const [alert, setAlert] = useState<string | null>(null);
  const allDay = s.withdraw.from === "00:00" && s.withdraw.to >= "23:59";

  const choose = (m: PayMethod) => {
    setMethod(m);
    setAccount(user[FIELD[m]] || (m === "UPI ID" ? "" : user.mobile));
    setPick(false);
  };
  const submit = () => {
    const r = attempt((d) => requestWithdraw(d, user.id, Number(amount) || 0, method, account));
    if (!r.ok) return setAlert(r.error);
    toast("Withdraw request submitted successfully!");
    setAmount("");
  };

  return (
    <>
      <Header title="Withdraw Fund" onBack={nav.back} />
      <div className="px-4 pt-4 space-y-4">
        <div className="ybox p-4">
          <div className="font-bold text-slate-800 mb-3">Withdrawal Information</div>
          {[
            ["24H", "Request Time", allDay ? "Available 24 Hours" : `${fmtTime(s.withdraw.from)} to ${fmtTime(s.withdraw.to)}`],
            ["PAY", "Payment Time", "Credited within 12-24 hours."],
            ["MIN", "Minimum Withdrawal", `₹${s.minWithdraw}`],
          ].map(([k, l, v]) => (
            <div key={k} className="flex items-center gap-3 py-2">
              <span className="w-9 text-[11px] font-black text-[#13306f]">{k}</span>
              <div><div className="text-[11px] text-slate-500">{l}</div><div className="text-sm font-semibold text-slate-800">{v}</div></div>
            </div>
          ))}
        </div>
        <div className="ybox p-4">
          <div className="font-bold text-slate-800">Withdraw Funds</div>
          <div className="text-xs text-slate-500 mb-3">Select your payment method and enter the withdrawal details carefully.</div>
          <button onClick={() => setPick(true)} className="w-full flex items-center justify-between border border-[#13306f]/40 rounded-lg px-3 py-3 text-sm">{method}<ChevronDown size={16} /></button>
          <input className="w-full border border-slate-200 rounded-lg px-3 py-3 mt-3 text-sm outline-none" placeholder={method === "UPI ID" ? "Enter UPI ID (name@bank)" : `Enter ${method} number`} inputMode={method === "UPI ID" ? "email" : "numeric"} value={account} onChange={(e) => setAccount(method === "UPI ID" ? e.target.value.trim() : e.target.value.replace(/\D/g, "").slice(0, 10))} />
          <div className="text-[11px] text-slate-400 mt-1">Please enter the correct payment details to avoid processing delays.</div>
          <input className="w-full border border-slate-200 rounded-lg px-3 py-3 mt-3 text-sm outline-none" placeholder="Enter amount" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, "").slice(0, 7))} />
          <div className="text-[11px] text-slate-400 mt-1">Minimum withdrawal: ₹{s.minWithdraw}</div>
          <button className="ybtn w-full py-3 rounded-lg mt-4" onClick={submit}>Withdraw Now</button>
          <div className="text-[11px] text-slate-400 text-center mt-2">Withdrawal requests can be submitted {allDay ? "anytime" : "during request time"}. Payment is normally credited within 12-24 hours.</div>
        </div>
        <button className="w-full text-sm text-[#13306f] font-semibold underline" onClick={() => nav.push({ name: "withdrawHistory" })}>View Withdraw History</button>
      </div>
      {pick && (
        <div className="fixed inset-0 z-50 grid place-items-center px-8">
          <div className="absolute inset-0 bg-black/50 fadein" onClick={() => setPick(false)} />
          <div className="relative w-full max-w-[340px] bg-white rounded-md shadow-xl pop">
            <div className="px-5 py-3.5 text-slate-800 text-lg">Select Withdraw Method</div>
            {PAY_METHODS.map((m) => (
              <button key={m} onClick={() => choose(m)} className="w-full flex items-center justify-between px-5 py-3 text-slate-800">
                {m}<span className={`w-5 h-5 rounded-full border-2 grid place-items-center ${method === m ? "border-emerald-600" : "border-slate-400"}`}>{method === m && <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <AlertBox open={!!alert} msg={alert ?? ""} onClose={() => setAlert(null)} />
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
      <div className="px-4 pt-4 space-y-4">
        <IconField icon={<User size={18} />} placeholder="Account Holder Name" value={bank.holder} onChange={(e) => setBank({ ...bank, holder: e.target.value })} />
        <IconField icon={<Building2 size={18} />} placeholder="Bank Name" value={bank.bank} onChange={(e) => setBank({ ...bank, bank: e.target.value })} />
        <IconField icon={<Hash size={18} />} placeholder="Account Number" inputMode="numeric" value={bank.account} onChange={(e) => setBank({ ...bank, account: e.target.value.replace(/\D/g, "") })} />
        <IconField icon={<Code2 size={18} />} placeholder="IFSC Code" value={bank.ifsc} onChange={(e) => setBank({ ...bank, ifsc: e.target.value.toUpperCase() })} />
        <IconField icon={<MapPin size={18} />} placeholder="Bank Address" value={bank.address} onChange={(e) => setBank({ ...bank, address: e.target.value })} />
        <button className="ybtn w-full py-3 rounded-xl text-lg" onClick={save}>Update Bank Details</button>
        {upi.map((x) => (
          <div key={x.key} className="ybox flex items-center px-4 py-3 text-slate-700">
            <span className="flex-1">{x.label} No :- {user[x.key] || "Not Added"}</span>
            <button onClick={() => setEdit({ ...x, value: user[x.key] })} className="text-[#13306f]" aria-label="Edit"><Pencil size={18} /></button>
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
      <div className="px-4 pt-4 space-y-3">
        {list.length ? list.map((x) => (
          <div key={x.id} className="ybox p-4">
            <div className="flex justify-between items-center"><span className="text-lg font-bold text-[#13306f]">₹{x.amount}</span><span className={`text-white text-xs font-semibold px-2.5 py-1 rounded capitalize ${color[x.status]}`}>{x.status}</span></div>
            <div className="text-xs text-slate-500 mt-1">{fmtDate(x.date)} {fmtTime(x.time)}</div>
            <div className="text-xs text-slate-600 mt-1">{x.payTo}</div>
            {x.status === "rejected" && <div className="text-xs font-semibold text-rose-600 mt-1">Rejected by admin · ₹{x.amount} refunded to your wallet</div>}
            {x.status === "approved" && <div className="text-xs font-semibold text-emerald-600 mt-1">Paid · credited within 12-24 hours</div>}
          </div>
        )) : <div className="text-center text-slate-500 mt-16">No withdraw history</div>}
      </div>
    </>
  );
}
