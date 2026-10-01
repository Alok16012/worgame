"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import type { BidStatus } from "../lib/types";

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
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
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
            <Btn variant="ghost" onClick={() => close(false)}>Close</Btn>
            <Btn variant={dlg.tone ?? "brand"} disabled={!!dlg.requireText && typed.trim() !== dlg.requireText} onClick={() => close(true)}>{dlg.ok ?? "Submit"}</Btn>
          </>}>
          <div className="text-sm text-slate-600 leading-relaxed">{dlg.body}</div>
          {dlg.requireText && (
            <Field label={`Type "${dlg.requireText}" to confirm`} className="mt-4">
              <input autoFocus className="admin-input" value={typed} onChange={(e) => setTyped(e.target.value)} />
            </Field>
          )}
        </Modal>
      )}
      <div className="fixed top-4 right-4 z-[80] flex flex-col items-end gap-2">
        {toasts.map((t) => (
          <div key={t.id} className={`fadein px-4 py-2.5 rounded-lg text-sm font-semibold text-white shadow-xl ${t.tone === "ok" ? "bg-emerald-600" : t.tone === "bad" ? "bg-rose-600" : "bg-slate-900"}`}>{t.msg}</div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

/* ---------------- building blocks ---------------- */

export function Card({ title, right, children, className = "" }: { title?: React.ReactNode; right?: React.ReactNode; children?: React.ReactNode; className?: string }) {
  return (
    <section className={`bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(16,24,64,.08)] ${className}`}>
      {(title || right) && (
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          {title && <h2 className="font-semibold text-slate-800 text-[17px]">{title}</h2>}
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
    brand: "bg-[#0d6efd] text-white hover:bg-[#0b5ed7]",
    ghost: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50",
    green: "bg-[#28a745] text-white hover:bg-[#218838]",
    red: "bg-[#dc3545] text-white hover:bg-[#c82333]",
    dark: "bg-[#0e1a3a] text-white hover:bg-[#1a2a55]",
    amber: "bg-[#f5b301] text-white hover:bg-[#e0a300]",
  }[variant];
  const s = size === "sm" ? "px-2.5 py-1 text-xs rounded" : "px-4 py-2 text-sm rounded-md";
  return <button {...p} className={`${v} ${s} font-medium whitespace-nowrap transition-colors disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1.5 ${className}`} />;
}

export function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`flex flex-col gap-1.5 min-w-0 ${className}`}>
      <span className="text-[13px] text-slate-600">{label}</span>
      {children}
    </label>
  );
}

export type Tone = "green" | "red" | "amber" | "blue" | "gray" | "orange";
export function Badge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  const c = { green: "bg-[#28a745]", red: "bg-[#dc3545]", amber: "bg-[#f5b301]", blue: "bg-[#0d6efd]", gray: "bg-slate-400", orange: "bg-[#fd7e14]" }[tone];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold text-white whitespace-nowrap ${c}`}>{children}</span>;
}

export function BidBadge({ s }: { s: BidStatus }) {
  const m: Record<BidStatus, [Tone, string]> = { pending: ["amber", "Pending"], won: ["green", "Win"], lost: ["red", "Loss"], reverted: ["gray", "Reverted"] };
  return <Badge tone={m[s][0]}>{m[s][1]}</Badge>;
}

/** Yes/No pill toggle like the live panel. */
export function YesNo({ on, onChange }: { on: boolean; onChange?: () => void }) {
  return <button onClick={onChange} className={`px-3 py-1 rounded text-xs font-semibold text-white ${on ? "bg-[#28a745]" : "bg-[#dc3545]"}`}>{on ? "Yes" : "No"}</button>;
}

export function Stat({ label, value, tone }: { label: string; value: React.ReactNode; tone?: "green" | "red" }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-[0_1px_3px_rgba(16,24,64,.08)]">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`text-xl font-bold mt-1 ${tone === "green" ? "text-emerald-600" : tone === "red" ? "text-rose-600" : "text-slate-900"}`}>{value}</div>
    </div>
  );
}

export function Table({ head, rows, empty = "No data available in table" }: { head: React.ReactNode[]; rows: React.ReactNode[][]; empty?: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px] border-collapse">
        <thead>
          <tr className="bg-[#e9ecef]">
            {head.map((h, i) => <th key={i} className="text-left text-[12px] uppercase tracking-wide text-slate-600 font-semibold px-3 py-2.5 whitespace-nowrap">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.length ? rows.map((r, i) => (
            <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
              {r.map((c, j) => <td key={j} className="px-3 py-2.5 whitespace-nowrap text-slate-700">{c}</td>)}
            </tr>
          )) : <tr><td colSpan={head.length} className="text-center text-slate-500 py-6">{empty}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

/** DataTables-style table: "Show N entries", Search box, pagination. `text` is the searchable string per row. */
export function DataTable({ head, rows, text, pageSize = 10 }: { head: React.ReactNode[]; rows: React.ReactNode[][]; text?: string[]; pageSize?: number }) {
  const [q, setQ] = useState("");
  const [n, setN] = useState(pageSize);
  const [page, setPage] = useState(0);
  const idx = useMemo(() => rows.map((_, i) => i).filter((i) => !q || (text?.[i] ?? "").toLowerCase().includes(q.toLowerCase())), [rows, text, q]);
  const pages = Math.max(1, Math.ceil(idx.length / n));
  const p = Math.min(page, pages - 1);
  const shown = idx.slice(p * n, p * n + n);
  const nums = Array.from({ length: pages }, (_, i) => i).filter((i) => i < 2 || i >= pages - 2 || Math.abs(i - p) <= 1);
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 text-[13px] text-slate-600">
        <label className="flex items-center gap-2">Show
          <select className="admin-input !w-auto !py-1" value={n} onChange={(e) => { setN(Number(e.target.value)); setPage(0); }}>{[10, 25, 50, 100].map((x) => <option key={x}>{x}</option>)}</select>
          entries</label>
        {text && <label className="flex items-center gap-2">Search: <input className="admin-input !w-52 !py-1" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} /></label>}
      </div>
      <Table head={head} rows={shown.map((i) => rows[i])} />
      <div className="flex flex-wrap items-center justify-between gap-3 mt-3 text-[13px] text-slate-600">
        <div>Showing {idx.length ? p * n + 1 : 0} to {Math.min(idx.length, p * n + n)} of {idx.length} entries</div>
        <div className="flex items-center gap-1">
          <button disabled={p === 0} onClick={() => setPage(p - 1)} className="px-2.5 py-1 rounded disabled:text-slate-300">Previous</button>
          {nums.map((i, k) => (
            <span key={i} className="flex items-center gap-1">
              {k > 0 && nums[k - 1] !== i - 1 && <span className="px-1">…</span>}
              <button onClick={() => setPage(i)} className={`min-w-8 px-2 py-1 rounded border ${i === p ? "bg-[#0d6efd] text-white border-[#0d6efd]" : "border-slate-200"}`}>{i + 1}</button>
            </span>
          ))}
          <button disabled={p >= pages - 1} onClick={() => setPage(p + 1)} className="px-2.5 py-1 rounded disabled:text-slate-300">Next</button>
        </div>
      </div>
    </div>
  );
}

export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { id: T; label: React.ReactNode }[] }) {
  return (
    <div className="flex flex-wrap border-b border-slate-200 mb-4">
      {items.map((it) => (
        <button key={it.id} onClick={() => onChange(it.id)} className={`flex-1 min-w-24 px-4 py-2.5 text-sm -mb-px border-b-2 ${value === it.id ? "text-[#0d6efd] border-[#0d6efd] font-semibold" : "text-slate-500 border-transparent"}`}>{it.label}</button>
      ))}
    </div>
  );
}

export function Modal({ title, onClose, children, footer, wide }: { title: React.ReactNode; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center p-4">
      <div className="absolute inset-0 bg-slate-950/50 fadein" onClick={onClose} />
      <div className={`relative w-full ${wide ? "max-w-5xl" : "max-w-md"} max-h-[88dvh] flex flex-col bg-white rounded-lg shadow-2xl pop`}>
        <div className="flex items-center px-5 py-3.5 border-b border-slate-200">
          <div className="font-semibold text-slate-800">{title}</div>
          <button onClick={onClose} className="ml-auto text-slate-400 hover:text-slate-700" aria-label="Close"><X size={20} /></button>
        </div>
        <div className="p-5 overflow-auto">{children}</div>
        {footer && <div className="flex justify-end gap-2 px-5 py-3 border-t border-slate-200">{footer}</div>}
      </div>
    </div>
  );
}

export const ANK_COLORS = ["#1f6fd1", "#2eb24b", "#3d97e0", "#f36b0a", "#2eb24b", "#3d97e0", "#f36b0a", "#1f6fd1", "#1f6fd1", "#141a33"];
