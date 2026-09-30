"use client";

import { useState } from "react";
import { BadgeCheck, Bell, BookOpen, ChevronRight, Headphones, LogOut, Mail, MessageCircle, Phone, ReceiptText, Send, Trophy, Wallet } from "lucide-react";
import { findGame, resultOf } from "../../lib/engine";
import { fmtDate, fmtTime, inr, sum } from "../../lib/format";
import { useStore } from "../../lib/store";
import type { BidStatus } from "../../lib/types";
import type { Nav } from "../nav";
import { Avatar, Ball, Header, Money, useSession } from "../ui";

export function MyBets({ nav }: { nav: Nav }) {
  const { state } = useStore();
  const { user } = useSession();
  const [f, setF] = useState<"all" | BidStatus>("all");
  const all = state.bids.filter((b) => b.userId === user.id);
  const live = all.filter((b) => b.status !== "reverted");
  const list = all.filter((b) => f === "all" || b.status === f).slice().reverse().slice(0, 80);
  const color: Record<BidStatus, string> = { pending: "text-amber-300", won: "text-emerald-300", lost: "text-rose-300", reverted: "text-[var(--ink-mute)]" };
  return (
    <>
      <Header title="My Bets" />
      <div className="px-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="card p-3"><div className="text-[10px] text-[var(--ink-soft)]">Total bid</div><div className="font-bold text-sm">{inr(sum(live, (b) => b.amount))}</div></div>
          <div className="card p-3"><div className="text-[10px] text-[var(--ink-soft)]">Total won</div><div className="font-bold text-sm text-emerald-300">{inr(sum(live, (b) => b.win ?? 0))}</div></div>
          <div className="card p-3"><div className="text-[10px] text-[var(--ink-soft)]">Pending</div><div className="font-bold text-sm text-amber-300">{all.filter((b) => b.status === "pending").length}</div></div>
        </div>
        <div className="flex gap-1.5 mt-4 overflow-x-auto no-scrollbar">
          {(["all", "pending", "won", "lost", "reverted"] as const).map((x) => (
            <button key={x} onClick={() => setF(x)} className={`shrink-0 px-3 py-1.5 rounded-xl text-xs capitalize ${f === x ? "bg-white text-brand-700 font-semibold" : "btn-ghost"}`}>{x}</button>
          ))}
        </div>
        <div className="card px-4 mt-3">
          {list.length ? list.map((b) => {
            const g = findGame(state, b.gameId);
            const r = resultOf(state, b.gameId, b.date);
            return (
              <div key={b.id} className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0">
                <Ball n={b.ank} size={34} tone="violet" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{g?.name}</div>
                  <div className="text-[11px] text-[var(--ink-mute)]">{fmtDate(b.date)} {fmtTime(b.time)} · {inr(b.amount)} @ {b.rate}x{r ? ` · Result ${r.ank}` : ""}</div>
                </div>
                <div className={`text-sm font-semibold capitalize ${color[b.status]}`}>{b.status === "won" ? `+${inr(b.win ?? 0)}` : b.status}</div>
              </div>
            );
          }) : (
            <div className="py-10 text-center">
              <div className="text-sm text-[var(--ink-mute)]">No bets here yet</div>
              <button onClick={() => nav.reset({ name: "games" })} className="btn-brand px-5 py-2 rounded-xl text-sm mt-3">Play now</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export function Profile({ nav }: { nav: Nav }) {
  const { state } = useStore();
  const { user } = useSession();
  const items = [
    { l: "My Bets", i: <ReceiptText size={18} />, go: () => nav.reset({ name: "bets" }) },
    { l: "Wallet", i: <Wallet size={18} />, go: () => nav.reset({ name: "wallet" }) },
    { l: "Results", i: <Trophy size={18} />, go: () => nav.push({ name: "results" }) },
    { l: "Notifications", i: <Bell size={18} />, go: () => nav.push({ name: "notifications" }) },
    { l: "How To Play", i: <BookOpen size={18} />, go: () => nav.push({ name: "howto" }) },
    { l: "Help & Support", i: <Headphones size={18} />, go: () => nav.push({ name: "support" }) },
  ];
  return (
    <>
      <Header title="Profile" />
      <div className="px-4">
        <div className="card p-4 flex items-center gap-3">
          <Avatar name={user.name} size={54} />
          <div className="flex-1"><div className="font-semibold text-lg">{user.name}</div><div className="text-xs text-[var(--ink-soft)]">+91 {user.mobile} · WG{user.id}</div></div>
        </div>
        <div className="wallet-card p-4 mt-3 flex items-center justify-between">
          <div><div className="text-xs opacity-80">Wallet Balance</div><Money n={user.balance} className="text-2xl font-extrabold" /></div>
          <button onClick={() => nav.push({ name: "addfunds" })} className="bg-white text-brand-700 font-semibold text-sm px-4 py-2 rounded-xl">Add Money</button>
        </div>
        <div className="card mt-3 px-4">
          <div className="flex items-center gap-3 py-3.5 border-b border-white/5">
            <BadgeCheck size={18} className="text-[var(--ink-soft)]" /><span className="flex-1 text-sm">KYC Verification</span>
            <span className={`text-xs font-semibold ${user.kyc ? "text-emerald-300" : "text-amber-300"}`}>{user.kyc ? "Verified" : "Pending"}</span>
          </div>
          {items.map((it) => (
            <button key={it.l} onClick={it.go} className="w-full flex items-center gap-3 py-3.5 border-b border-white/5 last:border-0 text-left">
              <span className="text-[var(--ink-soft)]">{it.i}</span><span className="flex-1 text-sm">{it.l}</span><ChevronRight size={16} className="text-[var(--ink-mute)]" />
            </button>
          ))}
        </div>
        <button onClick={nav.logout} className="w-full card mt-3 px-4 py-3.5 flex items-center gap-3 text-rose-300 text-sm"><LogOut size={18} /> Logout</button>
        <div className="text-center text-[11px] text-[var(--ink-mute)] mt-4">{state.settings.appName} v{state.settings.version}</div>
      </div>
    </>
  );
}

export function Notifications({ nav }: { nav: Nav }) {
  const { state } = useStore();
  const { user } = useSession();
  const list = state.notices.filter((n) => !n.userId || n.userId === user.id).slice().reverse();
  return (
    <>
      <Header title="Notifications" onBack={nav.back} />
      <div className="px-4">
        <div className="card px-4">
          {list.map((n) => (
            <div key={n.id} className="flex gap-3 py-3 border-b border-white/5 last:border-0">
              <div className="w-9 h-9 rounded-full bg-brand-500/15 grid place-items-center shrink-0">{n.auto ? "🏆" : "📢"}</div>
              <div className="min-w-0"><div className="text-sm font-semibold">{n.title}</div><div className="text-xs text-[var(--ink-soft)]">{n.msg}</div><div className="text-[10px] text-[var(--ink-mute)] mt-1">{fmtDate(n.date)}, {fmtTime(n.time)}</div></div>
            </div>
          ))}
          {!list.length && <div className="py-8 text-center text-sm text-[var(--ink-mute)]">No notifications</div>}
        </div>
      </div>
    </>
  );
}

export function HowToPlay({ nav }: { nav: Nav }) {
  const { state } = useStore();
  return (
    <>
      <Header title="How To Play" onBack={nav.back} />
      <div className="px-4">
        <div className="card p-5 text-sm leading-relaxed whitespace-pre-wrap">{state.settings.howToPlay}</div>
        <div className="card p-4 mt-3 text-sm">
          <div className="font-semibold mb-2">Example</div>
          <div className="text-[var(--ink-soft)]">Bid ₹10 on Ank <b className="text-white">7</b> in a 9.5x market. Result 7 → you win <b className="text-emerald-300">₹95</b>.</div>
        </div>
        {state.settings.video && <a href={state.settings.video} target="_blank" rel="noopener noreferrer" className="btn-brand block text-center w-full py-3 rounded-2xl mt-4">▶ Watch video guide</a>}
      </div>
    </>
  );
}

export function Support({ nav }: { nav: Nav }) {
  const { state } = useStore();
  const c = state.settings.contact;
  const rows = [
    { l: "WhatsApp", v: c.whatsapp, i: <MessageCircle size={18} className="text-emerald-400" /> },
    { l: "Call us", v: c.phone, i: <Phone size={18} className="text-sky-300" /> },
    { l: "Email", v: c.email, i: <Mail size={18} className="text-amber-300" /> },
    { l: "Telegram", v: c.telegram, i: <Send size={18} className="text-brand-300" /> },
  ];
  return (
    <>
      <Header title="Help & Support" onBack={nav.back} />
      <div className="px-4">
        <div className="card px-4">
          {rows.map((r) => (
            <div key={r.l} className="flex items-center gap-3 py-3.5 border-b border-white/5 last:border-0">{r.i}<span className="flex-1 text-sm">{r.l}</span><span className="text-xs text-[var(--ink-soft)]">{r.v}</span></div>
          ))}
        </div>
        <div className="text-[11px] text-[var(--ink-mute)] text-center mt-4">Support hours: 10 AM – 8 PM, all days</div>
      </div>
    </>
  );
}
