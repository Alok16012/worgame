"use client";

import { createContext, useContext } from "react";
import { CheckCircle2, ChevronLeft, CircleAlert, Menu } from "lucide-react";
import { findUser } from "../lib/engine";
import { useStore } from "../lib/store";
import type { Session } from "./nav";

export const SessionCtx = createContext<Session | null>(null);

/** Current player (always defined inside the signed-in shell). */
export function useSession() {
  const s = useContext(SessionCtx)!;
  const { state } = useStore();
  return { ...s, user: findUser(state, s.uid)! };
}

export const rupee = (n: number) => `₹ ${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

/** White top bar: back arrow (or ☰), title, wallet balance on the right. */
export function Header({ title, onBack, onMenu, right }: { title: string; onBack?: () => void; onMenu?: () => void; right?: React.ReactNode }) {
  const { user } = useSession();
  return (
    <div className="sticky top-0 z-20 flex items-center gap-3 px-4 h-14 bg-[#efefef]">
      {onBack && <button onClick={onBack} className="text-[#f6b52e] -ml-1" aria-label="Back"><ChevronLeft size={28} strokeWidth={2.5} /></button>}
      {onMenu && <button onClick={onMenu} className="text-slate-700 -ml-1" aria-label="Menu"><Menu size={26} /></button>}
      <div className="flex-1 min-w-0 text-[20px] font-bold text-slate-800 truncate uppercase tracking-tight">{title}</div>
      {right ?? <div className="font-semibold text-slate-800">{rupee(user.balance)}</div>}
    </div>
  );
}

export function Toast({ msg }: { msg: { text: string; tone: "ok" | "bad" } | null }) {
  if (!msg) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] pop w-[calc(100%-32px)] max-w-[398px]">
      <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-white text-sm font-medium shadow-xl ${msg.tone === "ok" ? "bg-[#22c55e]" : "bg-[#dc2f45]"}`}>
        {msg.tone === "ok" ? <CheckCircle2 size={20} /> : <CircleAlert size={20} />}{msg.text}
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
      <div className="relative w-full max-w-[340px] bg-[#f4f4f4] rounded-2xl p-5 pop">
        <div className="text-lg font-bold text-slate-800 mb-4">{title}</div>
        {children}
      </div>
    </div>
  );
}

/** Yellow round icon in front of a rounded input, like the app's forms. */
export function IconField({ icon, ...p }: React.InputHTMLAttributes<HTMLInputElement> & { icon: React.ReactNode }) {
  return (
    <div className="relative">
      <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#f6b52e] grid place-items-center text-white">{icon}</div>
      <input {...p} className="yfield !pl-14" />
    </div>
  );
}

export function UserCard() {
  const { user } = useSession();
  return (
    <div className="ybox p-4">
      <div className="bg-[#5d5d5d] rounded-lg text-white text-center py-3 font-bold leading-tight">{user.name.split(" ")[0]}<div>{user.mobile}</div></div>
      <div className="text-center text-slate-700 mt-3">Available Balance ₹{user.balance.toLocaleString("en-IN")}</div>
      <div className="flex justify-end -mt-1"><span className="flex"><span className="w-5 h-5 rounded-full bg-[#eb001b]" /><span className="w-5 h-5 rounded-full bg-[#f79e1b] -ml-2 opacity-90" /></span></div>
    </div>
  );
}

export const whatsappLink = (n: string) => `https://wa.me/${n.replace(/\D/g, "")}`;
