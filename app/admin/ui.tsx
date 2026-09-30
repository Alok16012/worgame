"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { X } from "lucide-react";
import { ANKS, type BidStatus, type MarketStatus } from "../lib/types";

/* ---------------- admin context: toast + confirm dialog ---------------- */

type ToastTone = "ok" | "bad" | "info";
interface ConfirmOpts {
  title: string;
  body: React.ReactNode;
  ok?: string;
  tone?: "brand" | "red" | "green";
  /** Admin must type this exact text to enable the confirm button. */
  requireText?: string;
}
interface AdminCtx {
  toast: (msg: string, tone?: ToastTone) => void;
  confirm: (o: ConfirmOpts) => Promise<boolean>;
}
const Ctx = createContext<AdminCtx | null>(null);
export const useAdmin = () => useContext(Ctx)!;

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<{ id: number; msg: string; tone: ToastTone }[]>([]);
  const [dlg, setDlg] = useState<ConfirmOpts | null>(null);
  const [typed, setTyped] = useState("");
  const resolver = useRef<(v: boolean) => void>(() => {});

  const toast = useCallback((msg: string, tone: ToastTone = "info") => {
    const id = Math.random();
    setToasts((t) => [...t, { id, msg, tone }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  }, []);

  const confirm = useCallback((o: ConfirmOpts) => {
    setTyped("");
    setDlg(o);
    return new Promise<boolean>((res) => (resolver.current = res));
  }, []);

  const close = (v: boolean) => {
    setDlg(null);
    resolver.current(v);
  };

  return (
    <Ctx.Provider value={{ toast, confirm }}>
      {children}
      {dlg && (
        <Modal title={dlg.title} onClose={() => close(false)}
          footer={<>
            <Btn variant="ghost" onClick={() => close(false)}>Cancel</Btn>
            <Btn variant={dlg.tone ?? "brand"} disabled={!!dlg.requireText && typed.trim() !== dlg.requireText} onClick={() => close(true)}>{dlg.ok ?? "Confirm"}</Btn>
          </>}>
          <div className="text-sm text-slate-600 leading-relaxed">{dlg.body}</div>
          {dlg.requireText && (
            <Field label={`Type "${dlg.requireText}" to confirm`} className="mt-4">
              <input autoFocus className="admin-input" value={typed} onChange={(e) => setTyped(e.target.value)} />
            </Field>
          )}
        </Modal>
      )}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[80] flex flex-col items-center gap-2">
        {toasts.map((t) => (
          <div key={t.id} className={`fadein px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-xl ${t.tone === "ok" ? "bg-emerald-600" : t.tone === "bad" ? "bg-rose-600" : "bg-slate-900"}`}>{t.msg}</div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

/* ---------------- building blocks ---------------- */

export function Title({ t, s, right }: { t: string; s?: string; right?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{t}</h1>
        {s && <p className="text-sm text-slate-500 mt-0.5">{s}</p>}
      </div>
      {right}
    </div>
  );
}

export function Card({ title, desc, right, children, className = "" }: { title?: React.ReactNode; desc?: React.ReactNode; right?: React.ReactNode; children?: React.ReactNode; className?: string }) {
  return (
    <section className={`bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_1px_2px_rgba(16,24,64,.04)] ${className}`}>
      {(title || right) && (
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            {title && <h2 className="font-semibold text-slate-900">{title}</h2>}
            {desc && <p className="text-[13px] text-slate-500 mt-0.5">{desc}</p>}
          </div>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

type BtnVariant = "brand" | "ghost" | "green" | "red" | "dark" | "amber";
export function Btn({ variant = "brand", size = "md", className = "", ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: "sm" | "md" }) {
  const v = {
    brand: "bg-brand-600 text-white hover:bg-brand-700",
    ghost: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50",
    green: "bg-emerald-600 text-white hover:bg-emerald-700",
    red: "bg-rose-600 text-white hover:bg-rose-700",
    dark: "bg-[#0e1433] text-white hover:bg-[#1a2152]",
    amber: "bg-amber-500 text-white hover:bg-amber-600",
  }[variant];
  const s = size === "sm" ? "px-2.5 py-1 text-xs rounded-lg" : "px-4 py-2 text-sm rounded-xl";
  return <button {...p} className={`${v} ${s} font-semibold whitespace-nowrap transition-colors disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1.5 ${className}`} />;
}

export function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`flex flex-col gap-1.5 min-w-0 ${className}`}>
      <span className="text-xs font-semibold text-slate-500">{label}</span>
      {children}
    </label>
  );
}

export type Tone = "green" | "red" | "amber" | "violet" | "gray" | "blue";
export function Badge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  const c = {
    green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    red: "bg-rose-50 text-rose-700 ring-rose-200",
    amber: "bg-amber-50 text-amber-700 ring-amber-200",
    violet: "bg-brand-50 text-brand-700 ring-brand-100",
    gray: "bg-slate-100 text-slate-600 ring-slate-200",
    blue: "bg-sky-50 text-sky-700 ring-sky-200",
  }[tone];
  return <span className={`pill inline-flex items-center px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset whitespace-nowrap ${c}`}>{children}</span>;
}

export function StatusBadge({ s }: { s: MarketStatus }) {
  const m: Record<MarketStatus, [Tone, string]> = { open: ["green", "Open"], closed: ["red", "Closed"], upcoming: ["amber", "Upcoming"], declared: ["violet", "Declared"], inactive: ["gray", "Inactive"] };
  return <Badge tone={m[s][0]}>{m[s][1]}</Badge>;
}

export function BidBadge({ s }: { s: BidStatus }) {
  const m: Record<BidStatus, [Tone, string]> = { pending: ["amber", "Pending"], won: ["green", "Won"], lost: ["red", "Lost"], reverted: ["gray", "Reverted"] };
  return <Badge tone={m[s][0]}>{m[s][1]}</Badge>;
}

export function Stat({ label, value, tone, sub }: { label: string; value: React.ReactNode; tone?: "green" | "red"; sub?: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`text-xl font-bold mt-1 ${tone === "green" ? "text-emerald-600" : tone === "red" ? "text-rose-600" : "text-slate-900"}`}>{value}</div>
      {sub && <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}

export function Table({ head, rows, empty = "No data available in table", max = true }: { head: React.ReactNode[]; rows: React.ReactNode[][]; empty?: string; max?: boolean }) {
  return (
    <div className={`overflow-auto border border-slate-200 rounded-xl ${max ? "max-h-[560px]" : ""}`}>
      <table className="w-full text-[13px] border-collapse">
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={i} className="sticky top-0 z-[1] bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500 font-semibold px-3 py-2.5 border-b border-slate-200 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? rows.map((r, i) => (
            <tr key={i} className="hover:bg-brand-50/40 border-b border-slate-100 last:border-0">
              {r.map((c, j) => <td key={j} className="px-3 py-2.5 whitespace-nowrap text-slate-700">{c}</td>)}
            </tr>
          )) : (
            <tr><td colSpan={head.length} className="text-center text-slate-400 py-8">{empty}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { id: T; label: React.ReactNode }[] }) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-slate-200 mb-4">
      {items.map((it) => (
        <button key={it.id} onClick={() => onChange(it.id)} className={`px-3.5 py-2.5 text-sm font-semibold -mb-px border-b-2 transition-colors ${value === it.id ? "text-brand-600 border-brand-600" : "text-slate-500 border-transparent hover:text-slate-700"}`}>
          {it.label}
        </button>
      ))}
    </div>
  );
}

export function Modal({ title, onClose, children, footer, wide }: { title: React.ReactNode; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center p-4">
      <div className="absolute inset-0 bg-slate-950/50 fadein" onClick={onClose} />
      <div className={`relative w-full ${wide ? "max-w-4xl" : "max-w-lg"} max-h-[88dvh] flex flex-col bg-white rounded-2xl shadow-2xl pop`}>
        <div className="flex items-center px-5 py-4 border-b border-slate-100">
          <div className="font-semibold text-slate-900">{title}</div>
          <button onClick={onClose} className="ml-auto text-slate-400 hover:text-slate-700" aria-label="Close"><X size={20} /></button>
        </div>
        <div className="p-5 overflow-auto">{children}</div>
        {footer && <div className="flex justify-end gap-2 px-5 py-3 border-t border-slate-100">{footer}</div>}
      </div>
    </div>
  );
}

/** Ank buttons 0–9. `selected` may be a single value or a list. */
export function AnkPicker({ selected, onPick, disabled = [] }: { selected: number | null | number[]; onPick: (a: number) => void; disabled?: number[] }) {
  const on = (a: number) => (Array.isArray(selected) ? selected.includes(a) : selected === a);
  return (
    <div className="flex flex-wrap gap-2">
      {ANKS.map((a) => (
        <button key={a} disabled={disabled.includes(a)} onClick={() => onPick(a)}
          className={`w-12 h-12 rounded-xl text-lg font-bold border transition-colors disabled:opacity-30 ${on(a) ? "bg-brand-600 border-brand-600 text-white shadow-lg shadow-brand-600/30" : "bg-white border-slate-200 text-slate-800 hover:border-brand-400"}`}>
          {a}
        </button>
      ))}
    </div>
  );
}

export const ANK_COLORS = ["#1f6fd1", "#16a34a", "#0ea5e9", "#ea580c", "#16a34a", "#0ea5e9", "#ea580c", "#1f6fd1", "#7c3aed", "#0e1433"];
