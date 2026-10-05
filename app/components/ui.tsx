"use client";

import { createContext, useContext } from "react";
import { CheckCircle2, ChevronLeft, CircleAlert, Menu, Wallet } from "lucide-react";
import { findUser } from "../lib/engine";
import { useStore } from "../lib/store";
import { Wordmark } from "./Logo";
import type { Session } from "./nav";

export const SessionCtx = createContext<Session | null>(null);

/** Current player (always defined inside the signed-in shell). */
export function useSession() {
  const s = useContext(SessionCtx)!;
  const { state } = useStore();
  return { ...s, user: findUser(state, s.uid)! };
}

export const NAVY = "#13306f";

/** Navy top bar: back arrow (or ☰), title, wallet icon + balance. Home shows the gold wordmark. */
export function Header({ title, onBack, onMenu, brand }: { title: string; onBack?: () => void; onMenu?: () => void; brand?: boolean }) {
  const { user } = useSession();
  const { state } = useStore();
  const quizMode = user ? !user.betting : state.settings.bettingDisabled;
  return (
    <header className="sticky top-0 z-20 bg-[#0d2463] border-b border-white/10 text-white select-none">
      <div style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <div className="flex items-center gap-3 px-4 h-14">
          {onBack && <button onClick={onBack} className="-ml-1 w-9 h-9 rounded-lg grid place-items-center active:bg-white/10 transition-colors" aria-label="Back"><ChevronLeft size={26} /></button>}
          {onMenu && <button onClick={onMenu} className="-ml-1 w-9 h-9 rounded-lg grid place-items-center active:bg-white/10 transition-colors" aria-label="Menu"><Menu size={26} /></button>}
          <div className="flex-1 min-w-0 truncate">{brand ? <Wordmark name={title} size={20} /> : <span className="text-[17px] font-semibold uppercase tracking-wide">{title}</span>}</div>
          {quizMode ? (
            <div className="flex items-center gap-1.5 font-semibold text-xs bg-white/10 px-2.5 py-1 rounded-full text-[#f5c542]">
              🎓 Quiz Mode
            </div>
          ) : (
            <div className="flex items-center gap-1.5 font-semibold text-sm bg-white/10 px-2.5 py-1 rounded-full">
              <Wallet size={17} className="text-[#f5c542]" />₹{user.balance.toLocaleString("en-IN")}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export function Toast({ msg }: { msg: { text: string; tone: "ok" | "bad" } | null }) {
  if (!msg) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] pop w-[calc(100%-32px)] max-w-[398px]">
      <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-white text-sm font-medium shadow-xl ${msg.tone === "ok" ? "bg-[#16a34a]" : "bg-[#dc2f45]"}`}>
        {msg.tone === "ok" ? <CheckCircle2 size={20} /> : <CircleAlert size={20} />}{msg.text}
      </div>
    </div>
  );
}

/** "Alert!" / "Error!" box with an orange ! and an OK button, like the reference app. */
export function AlertBox({ open, title = "Alert!", msg, onClose, ok }: { open: boolean; title?: string; msg: string; onClose: () => void; ok?: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center px-6">
      <div className="absolute inset-0 bg-black/50 fadein" onClick={onClose} />
      <div className="relative w-full max-w-[360px] bg-white rounded-xl px-6 pt-7 pb-5 text-center pop">
        <div className={`mx-auto w-20 h-20 rounded-full border-4 grid place-items-center text-4xl font-light ${ok ? "border-emerald-300 text-emerald-500" : "border-[#f8bb86] text-[#f8bb86]"}`}>{ok ? "✓" : "!"}</div>
        <div className="text-2xl font-semibold text-slate-700 mt-4">{title}</div>
        <div className="text-slate-600 mt-2">{msg}</div>
        <div className="flex justify-end mt-5"><button onClick={onClose} className="bg-[#8cd4f5] text-white font-semibold px-5 py-2 rounded">OK</button></div>
      </div>
    </div>
  );
}

export function Sheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-center">
      <div className="absolute inset-0 bg-black/50 fadein" onClick={onClose} />
      <div className="absolute bottom-0 w-full max-w-[430px] slideup rounded-t-3xl bg-white p-5 pb-8 max-h-[85dvh] overflow-y-auto">{children}</div>
    </div>
  );
}

export function Popup({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center px-8">
      <div className="absolute inset-0 bg-black/50 fadein" onClick={onClose} />
      <div className="relative w-full max-w-[340px] bg-white rounded-2xl p-5 pop">
        <div className="text-lg font-bold text-slate-800 mb-4">{title}</div>
        {children}
      </div>
    </div>
  );
}

/** Round icon in front of a rounded input. */
export function IconField({ icon, ...p }: React.InputHTMLAttributes<HTMLInputElement> & { icon: React.ReactNode }) {
  return (
    <div className="relative">
      <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#13306f] grid place-items-center text-[#f5c542]">{icon}</div>
      <input {...p} className="yfield !pl-14" />
    </div>
  );
}

export function UserCard() {
  const { user } = useSession();
  return (
    <div className="rounded-xl p-4 text-white" style={{ background: "linear-gradient(135deg,#1f45a8,#0d2463)" }}>
      <div className="flex items-center justify-between">
        <div><div className="font-bold">{user.name}</div><div className="text-sm opacity-80">{user.mobile}</div></div>
        <Wallet className="text-[#f5c542]" />
      </div>
      <div className="mt-3 text-sm opacity-80">Available Balance</div>
      <div className="text-2xl font-bold text-[#f5c542]">₹{user.balance.toLocaleString("en-IN")}</div>
    </div>
  );
}

export const whatsappLink = (n: string) => `https://wa.me/${n.replace(/\D/g, "")}`;
