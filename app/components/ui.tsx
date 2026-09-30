"use client";

import { createContext, useContext } from "react";
import { ChevronLeft, Gamepad2, Home, ReceiptText, User, Wallet as WalletIcon } from "lucide-react";
import { findUser } from "../lib/engine";
import { inr } from "../lib/format";
import { useStore } from "../lib/store";
import type { MarketStatus } from "../lib/types";
import type { Session } from "./nav";

export const SessionCtx = createContext<Session | null>(null);

/** Current player (always defined inside the signed-in shell). */
export function useSession() {
  const s = useContext(SessionCtx)!;
  const { state } = useStore();
  return { ...s, user: findUser(state, s.uid)! };
}

export function Header({ title, sub, onBack, right }: { title: string; sub?: string; onBack?: () => void; right?: React.ReactNode }) {
  return (
    <div className="sticky top-0 z-20 flex items-center gap-3 px-4 pt-5 pb-3 bg-[#0b1030]/85 backdrop-blur-md">
      {onBack && (
        <button onClick={onBack} className="w-9 h-9 -ml-1 grid place-items-center rounded-full bg-white/5 hover:bg-white/10" aria-label="Back">
          <ChevronLeft size={22} />
        </button>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-lg font-semibold leading-tight truncate">{title}</div>
        {sub && <div className="text-[11px] text-[var(--ink-soft)]">{sub}</div>}
      </div>
      {right}
    </div>
  );
}

export type Tab = "home" | "games" | "wallet" | "bets" | "profile";

export function BottomNav({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  const items: { id: Tab; label: string; Icon: typeof Home }[] = [
    { id: "home", label: "Home", Icon: Home },
    { id: "games", label: "Games", Icon: Gamepad2 },
    { id: "wallet", label: "Wallet", Icon: WalletIcon },
    { id: "bets", label: "My Bets", Icon: ReceiptText },
    { id: "profile", label: "Profile", Icon: User },
  ];
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-30 bg-[#0a0f2c]/95 backdrop-blur-md border-t border-white/5 pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-5">
        {items.map(({ id, label, Icon }) => {
          const on = tab === id;
          return (
            <button key={id} onClick={() => onTab(id)} className={`flex flex-col items-center gap-1 py-2.5 text-[11px] ${on ? "text-brand-300 font-semibold" : "text-[var(--ink-mute)]"}`}>
              <Icon size={21} strokeWidth={on ? 2.4 : 1.8} />
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-center">
      <div className="absolute inset-0 bg-black/60 fadein" onClick={onClose} />
      <div className="absolute bottom-0 w-full max-w-[430px] slideup rounded-t-3xl bg-[#111838] border-t border-white/10 p-5 pb-8 max-h-[85dvh] overflow-y-auto">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
        {title && <div className="text-lg font-semibold mb-4">{title}</div>}
        {children}
      </div>
    </div>
  );
}

export function Toast({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] pop w-max max-w-[92vw]">
      <div className="px-4 py-2.5 rounded-2xl bg-white text-slate-900 text-sm font-semibold shadow-2xl text-center">{msg}</div>
    </div>
  );
}

export function Money({ n, className = "" }: { n: number; className?: string }) {
  return <span className={className}>{inr(n)}</span>;
}

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  return (
    <div className="rounded-full grid place-items-center shrink-0 font-bold ring-2 ring-white/70 text-white" style={{ width: size, height: size, fontSize: size * 0.42, background: "linear-gradient(135deg,#8b72ff,#5b3df5)" }}>
      {name.trim()[0]?.toUpperCase()}
    </div>
  );
}

export function MarketPill({ s }: { s: MarketStatus }) {
  const m: Record<MarketStatus, string> = {
    open: "bg-emerald-500/15 text-emerald-300",
    closed: "bg-rose-500/15 text-rose-300",
    upcoming: "bg-amber-400/15 text-amber-300",
    declared: "bg-brand-400/20 text-brand-300",
    inactive: "bg-white/10 text-white/50",
  };
  return <span className={`pill px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${m[s]}`}>{s}</span>;
}

export function Ball({ n, size = 36, tone = "gold" }: { n: React.ReactNode; size?: number; tone?: "gold" | "violet" | "blue" }) {
  return <div className={`ball ${tone === "gold" ? "" : tone}`} style={{ width: size, height: size, fontSize: size * 0.45 }}>{n}</div>;
}
