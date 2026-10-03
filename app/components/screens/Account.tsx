"use client";

import { useState } from "react";
import { Lock, Mail, MessageCircle, Phone, Send, User } from "lucide-react";
import { findGame, resultOf, updateUser } from "../../lib/engine";
import { fmtDate, fmtTime } from "../../lib/format";
import { resultText } from "../../lib/matka";
import { useStore } from "../../lib/store";
import { CAT_LABEL, CAT_TYPES, CATS, TYPE_LABEL, type Bid, type BidStatus } from "../../lib/types";
import type { Nav } from "../nav";
import { Header, IconField, useSession, whatsappLink } from "../ui";

const STATUS: Record<BidStatus, [string, string]> = { pending: ["Success", "text-sky-600"], won: ["Win", "text-emerald-600"], lost: ["Loss", "text-rose-600"], reverted: ["Refunded", "text-slate-400"] };
const typeName = (b: Bid) => (b.type === "half_sangam" ? (b.session === "open" ? "Half Sangam A" : "Half Sangam B") : TYPE_LABEL[b.type]);

function BidCard({ b }: { b: Bid }) {
  const { state } = useStore();
  const g = findGame(state, b.gameId);
  return (
    <div className="ybox overflow-hidden">
      <div className="bg-[#13306f] text-white text-sm font-semibold px-3 py-1.5 flex justify-between"><span>{g?.name}</span><span>{fmtDate(b.date)} {fmtTime(b.time)}</span></div>
      <div className="grid grid-cols-4 text-center text-sm px-2 py-2.5">
        <div><div className="text-[11px] text-slate-500">Game Type</div><div className="font-medium">{typeName(b)}</div></div>
        <div><div className="text-[11px] text-slate-500">Session</div><div className="font-medium">{b.session ? (b.session === "open" ? "Open" : "Close") : "—"}</div></div>
        <div><div className="text-[11px] text-slate-500">Number</div><div className="font-bold">{b.value}</div></div>
        <div><div className="text-[11px] text-slate-500">Points</div><div className="font-medium">{b.amount}</div></div>
      </div>
      <div className="border-t border-slate-100 px-3 py-2 flex justify-between text-sm">
        <span className="text-slate-500">Result: {g ? resultText(g.cat, resultOf(state, g.id, b.date)) : ""}</span>
        <span className={`font-semibold ${STATUS[b.status][1]}`}>{b.status === "won" ? `Win ₹${b.win}` : STATUS[b.status][0]}</span>
      </div>
    </div>
  );
}

export function BidHistory({ nav }: { nav: Nav }) {
  const { state } = useStore();
  const { user } = useSession();
  const [f, setF] = useState<"all" | BidStatus>("all");
  const list = state.bids.filter((b) => b.userId === user.id && (f === "all" || b.status === f)).reverse().slice(0, 100);
  return (
    <>
      <Header title="Bid History" onBack={nav.back} />
      <div className="px-3 pt-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3">
          {(["all", "pending", "won", "lost"] as const).map((x) => (
            <button key={x} onClick={() => setF(x)} className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold ${f === x ? "bg-[#13306f] text-white" : "bg-white text-slate-600"}`}>{x === "all" ? "All" : STATUS[x][0]}</button>
          ))}
        </div>
        <div className="space-y-3">{list.length ? list.map((b) => <BidCard key={b.id} b={b} />) : <div className="text-center text-slate-500 mt-16">No bids found</div>}</div>
      </div>
    </>
  );
}

export function WinHistory({ nav }: { nav: Nav }) {
  const { state } = useStore();
  const { user } = useSession();
  const list = state.bids.filter((b) => b.userId === user.id && b.status === "won").reverse();
  return (
    <>
      <Header title="Win History" onBack={nav.back} />
      <div className="px-3 pt-3 space-y-3">{list.length ? list.map((b) => <BidCard key={b.id} b={b} />) : <div className="text-center text-slate-500 mt-16">No wins yet</div>}</div>
    </>
  );
}

export function Statement({ nav }: { nav: Nav }) {
  const { state } = useStore();
  const { user } = useSession();
  const [f, setF] = useState<"all" | "cr" | "dr">("all");
  const list = state.txns.filter((x) => x.userId === user.id && (f === "all" || x.dir === f)).reverse().slice(0, 150);
  return (
    <>
      <Header title="Wallet Statement" onBack={nav.back} />
      <div className="px-3 pt-3">
        <div className="grid grid-cols-3 bg-white rounded-lg p-1 mb-3">
          {(["all", "cr", "dr"] as const).map((x) => <button key={x} onClick={() => setF(x)} className={`py-2 rounded-md text-sm font-semibold ${f === x ? "bg-[#13306f] text-white" : "text-slate-600"}`}>{x === "all" ? "All" : x === "cr" ? "Credit" : "Debit"}</button>)}
        </div>
        <div className="ybox divide-y divide-slate-100">
          {list.map((x) => (
            <div key={x.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-0"><div className="text-sm text-slate-800">{x.remark}</div><div className="text-[11px] text-slate-400">{fmtDate(x.date)} {fmtTime(x.time)}{x.status === "pending" ? <span className="text-amber-600 font-semibold"> · Pending</span> : x.status === "rejected" ? <span className="text-rose-600 font-semibold"> · Rejected</span> : ""}</div></div>
              <div className={`font-bold ${x.status === "rejected" ? "text-slate-400 line-through" : x.status === "pending" ? "text-amber-600" : x.dir === "cr" ? "text-emerald-600" : "text-rose-600"}`}>{x.dir === "cr" ? "+" : "-"}₹{x.amount}</div>
            </div>
          ))}
          {!list.length && <div className="text-center text-slate-500 py-10">No transactions</div>}
        </div>
      </div>
    </>
  );
}

export function GameRatesScreen({ nav }: { nav: Nav }) {
  const { state } = useStore();
  return (
    <>
      <Header title="Game Rates" onBack={nav.back} />
      <div className="px-3 pt-3 space-y-4">
        {CATS.map((c) => (
          <div key={c} className="ybox overflow-hidden">
            <div className="bg-[#13306f] text-white font-semibold px-4 py-2">{c === "main" ? "Main Market" : CAT_LABEL[c]}</div>
            {CAT_TYPES[c].map((t) => {
              const r = state.settings.rates[c][t];
              return <div key={t} className="flex justify-between px-4 py-2.5 border-b border-slate-100 last:border-0 text-sm"><span>{TYPE_LABEL[t]}</span><b>{r ? `${r.bet} KA ${r.win}` : "—"}</b></div>;
            })}
          </div>
        ))}
      </div>
    </>
  );
}

export function HowToPlay({ nav }: { nav: Nav }) {
  const { state } = useStore();
  return (
    <>
      <Header title="How To Play" onBack={nav.back} />
      <div className="px-3 pt-3 space-y-3">
        <div className="ybox p-4 text-sm leading-relaxed whitespace-pre-wrap text-slate-700">{state.settings.howToPlay}</div>
        <div className="ybox p-4 text-sm text-slate-700">
          <div className="font-bold mb-1">Result example: 123-65-456</div>
          Open Pana 123 → Open Ank 6 (1+2+3). Close Pana 456 → Close Ank 5 (4+5+6=15). Jodi = 65.
        </div>
        {state.settings.video && <a href={state.settings.video} target="_blank" rel="noreferrer" className="ybtn block text-center py-3 rounded-xl">Watch Video</a>}
      </div>
    </>
  );
}

export function Notices({ nav }: { nav: Nav }) {
  const { state } = useStore();
  const { user } = useSession();
  const list = state.notices.filter((n) => !n.userId || n.userId === user.id).slice().reverse();
  return (
    <>
      <Header title="Notifications" onBack={nav.back} />
      <div className="px-3 pt-3 space-y-3">
        {list.map((n) => <div key={n.id} className="ybox p-4"><div className="font-semibold text-slate-800">{n.title}</div><div className="text-sm text-slate-600 mt-0.5">{n.msg}</div><div className="text-[11px] text-slate-400 mt-1">{fmtDate(n.date)} {fmtTime(n.time)}</div></div>)}
        {!list.length && <div className="text-center text-slate-500 mt-16">No notifications</div>}
      </div>
    </>
  );
}

export function Profile({ nav }: { nav: Nav }) {
  const { update } = useStore();
  const { user, toast } = useSession();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [pw, setPw] = useState({ old: "", next: "" });
  return (
    <>
      <Header title="My Profile" onBack={nav.back} />
      <div className="px-4 pt-4 space-y-4">
        <div className="ybox p-4 text-center"><div className="w-16 h-16 mx-auto rounded-full bg-[#13306f] text-white text-3xl font-bold grid place-items-center">{user.name[0]}</div><div className="font-bold text-lg mt-2">{user.name}</div><div className="text-slate-500">{user.mobile}</div></div>
        <IconField icon={<User size={18} />} placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
        <IconField icon={<Mail size={18} />} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button className="ybtn w-full py-3 rounded-xl" onClick={() => { if (!name.trim()) return toast("Enter your name", "bad"); update((d) => updateUser(d, user.id, { name: name.trim(), email: email.trim() })); toast("Profile Updated Successfully!"); }}>Update Profile</button>
        <div className="font-bold text-slate-700 pt-2">Change Password</div>
        <IconField icon={<Lock size={18} />} type="password" placeholder="Old Password" value={pw.old} onChange={(e) => setPw({ ...pw, old: e.target.value })} />
        <IconField icon={<Lock size={18} />} type="password" placeholder="New Password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
        <button className="ybtn w-full py-3 rounded-xl" onClick={() => {
          if (pw.old !== user.password) return toast("Old password is incorrect", "bad");
          if (pw.next.length < 4) return toast("New password must be at least 4 characters", "bad");
          update((d) => updateUser(d, user.id, { password: pw.next }));
          setPw({ old: "", next: "" });
          toast("Password changed successfully!");
        }}>Change Password</button>
      </div>
    </>
  );
}

export function Contact({ nav }: { nav: Nav }) {
  const { state } = useStore();
  const c = state.settings.contact;
  const rows: [React.ReactNode, string, string, string][] = [
    [<MessageCircle key="i" className="text-emerald-500" />, "WhatsApp", c.whatsapp, whatsappLink(c.whatsapp)],
    [<Phone key="i" className="text-sky-600" />, "Call", c.phone, `tel:${c.phone.replace(/\s/g, "")}`],
    [<Mail key="i" className="text-amber-500" />, "Email", c.email, `mailto:${c.email}`],
    [<Send key="i" className="text-sky-500" />, "Telegram", c.telegram, `https://t.me/${c.telegram.replace("@", "")}`],
  ];
  return (
    <>
      <Header title="Contact Us" onBack={nav.back} />
      <div className="px-3 pt-3"><div className="ybox divide-y divide-slate-100">
        {rows.map(([i, l, v, href]) => <a key={l} href={href} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-4 py-4">{i}<span className="flex-1 font-medium">{l}</span><span className="text-sm text-slate-500">{v}</span></a>)}
      </div></div>
    </>
  );
}
