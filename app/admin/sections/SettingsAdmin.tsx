"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { log, nid, withdrawOpen } from "../../lib/engine";
import { DAYS, ymd } from "../../lib/format";
import { useStore } from "../../lib/store";
import type { Settings } from "../../lib/types";
import { Btn, Card, Field, useAdmin } from "../ui";

function useSettingsForm<K extends keyof Settings>(keys: K[]) {
  const { state: s, update } = useStore();
  const { toast } = useAdmin();
  const [f, setF] = useState(() => structuredClone(Object.fromEntries(keys.map((k) => [k, s.settings[k]]))) as Pick<Settings, K>);
  const save = (label: string, validate?: (v: Pick<Settings, K>) => string | null) => {
    const err = validate?.(f);
    if (err) return toast(err, "bad");
    update((d) => { Object.assign(d.settings, structuredClone(f)); log(d, label, "updated"); });
    toast("Updated successfully", "ok");
  };
  return { f, setF, save };
}

function Switch({ on, onChange, label, hint }: { on: boolean; onChange: (v: boolean) => void; label: string; hint: string }) {
  return (
    <button type="button" onClick={() => onChange(!on)} className="flex items-start gap-3 text-left border border-slate-200 rounded-lg p-3 hover:bg-slate-50">
      <div className={`w-11 h-6 shrink-0 rounded-full p-0.5 transition-colors ${on ? "bg-[#28a745]" : "bg-slate-300"}`}><div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : ""}`} /></div>
      <div><div className="text-sm font-semibold text-slate-800">{label}</div><div className="text-xs text-slate-500">{hint}</div></div>
    </button>
  );
}

type NumKey = "minDeposit" | "maxDeposit" | "minWithdraw" | "maxWithdraw" | "minBid" | "maxBid" | "welcomeBonus";

export function MainSetting() {
  const { f, setF, save } = useSettingsForm(["appName", "marquee", "website", "upiId", "version", "minDeposit", "maxDeposit", "minWithdraw", "maxWithdraw", "minBid", "maxBid", "welcomeBonus", "demoMode", "maintenance"]);
  const num = (k: NumKey, label: string) => <Field label={label}><input className="admin-input" inputMode="numeric" value={f[k]} onChange={(e) => setF({ ...f, [k]: Number(e.target.value.replace(/\D/g, "")) })} /></Field>;
  const text = (k: "appName" | "marquee" | "website" | "upiId" | "version", label: string) => <Field label={label}><input className="admin-input" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></Field>;
  return (
    <Card title="Main Setting">
      <div className="grid md:grid-cols-3 gap-4">
        {text("appName", "App Name")}
        {text("website", "Official Website")}
        {text("upiId", "Merchant UPI ID")}
        <Field label="Welcome Marquee" className="md:col-span-3"><input className="admin-input" value={f.marquee} onChange={(e) => setF({ ...f, marquee: e.target.value })} /></Field>
        {num("minDeposit", "Min Deposit")}
        {num("maxDeposit", "Max Deposit")}
        {num("welcomeBonus", "Welcome Bonus")}
        {num("minWithdraw", "Min Withdraw")}
        {num("maxWithdraw", "Max Withdraw")}
        {text("version", "App Version")}
        {num("minBid", "Min Bid Amount")}
        {num("maxBid", "Max Bid Amount")}
      </div>
      <div className="grid md:grid-cols-2 gap-3 mt-5">
        <Switch on={f.demoMode} onChange={(v) => setF({ ...f, demoMode: v })} label="Demo mode" hint="Ignore market timings: a session stays open for bids until its result is declared." />
        <Switch on={f.maintenance} onChange={(v) => setF({ ...f, maintenance: v })} label="Maintenance mode" hint="Player app shows 'under maintenance'." />
      </div>
      <Btn className="mt-5" onClick={() => save("Main Setting", (v) => (!v.appName.trim() ? "App name is required" : v.minBid < 1 || v.minBid > v.maxBid ? "Check min/max bid" : v.minDeposit > v.maxDeposit ? "Check min/max deposit" : v.minWithdraw > v.maxWithdraw ? "Check min/max withdraw" : null))}>Update</Btn>
    </Card>
  );
}

export function ContactSetting() {
  const { f, setF, save } = useSettingsForm(["contact"]);
  const c = f.contact;
  return (
    <Card title="Contact Setting">
      <div className="grid md:grid-cols-2 gap-4">
        {([["whatsapp", "WhatsApp Number"], ["phone", "Mobile Number"], ["email", "Email"], ["telegram", "Telegram Link"]] as const).map(([k, l]) => (
          <Field key={k} label={l}><input className="admin-input" value={c[k]} onChange={(e) => setF({ contact: { ...c, [k]: e.target.value } })} /></Field>
        ))}
      </div>
      <Btn className="mt-5" onClick={() => save("Contact Setting")}>Update</Btn>
    </Card>
  );
}

export function HowToPlaySetting() {
  const { f, setF, save } = useSettingsForm(["howToPlay", "video"]);
  return (
    <Card title="How To Play">
      <Field label="Content"><textarea rows={10} className="admin-input" value={f.howToPlay} onChange={(e) => setF({ ...f, howToPlay: e.target.value })} /></Field>
      <Field label="Video Link" className="mt-3"><input className="admin-input" value={f.video} onChange={(e) => setF({ ...f, video: e.target.value })} /></Field>
      <Btn className="mt-5" onClick={() => save("How To Play")}>Update</Btn>
    </Card>
  );
}

export function SliderImages() {
  const { state: s, update } = useStore();
  const { toast } = useAdmin();
  const [f, setF] = useState({ title: "", sub: "", c1: "#f5a623", c2: "#c2410c" });
  return (
    <>
      <Card title="Slider Image">
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {s.settings.sliders.map((b) => (
            <div key={b.id} className="relative rounded-xl p-5 min-h-32 text-white flex flex-col justify-end" style={{ background: `linear-gradient(135deg,${b.c1},${b.c2})` }}>
              <div className="font-bold text-lg">{b.title}</div><div className="text-sm opacity-85">{b.sub}</div>
              <button onClick={() => update((d) => { d.settings.sliders = d.settings.sliders.filter((x) => x.id !== b.id); })} className="absolute top-3 right-3 p-1.5 rounded bg-black/30" aria-label="Delete"><Trash2 size={14} /></button>
            </div>
          ))}
          {!s.settings.sliders.length && <div className="text-sm text-slate-400">No slider images.</div>}
        </div>
      </Card>
      <Card className="mt-5" title="Upload Image">
        <p className="text-xs text-slate-500 mb-3">The live app uploads a banner image. This demo creates a gradient banner with your text.</p>
        <div className="grid md:grid-cols-[2fr_2fr_auto_auto_auto] gap-4 items-end">
          <Field label="Title"><input className="admin-input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
          <Field label="Sub Title"><input className="admin-input" value={f.sub} onChange={(e) => setF({ ...f, sub: e.target.value })} /></Field>
          <Field label="Color 1"><input type="color" className="h-10 w-16 rounded border border-slate-200" value={f.c1} onChange={(e) => setF({ ...f, c1: e.target.value })} /></Field>
          <Field label="Color 2"><input type="color" className="h-10 w-16 rounded border border-slate-200" value={f.c2} onChange={(e) => setF({ ...f, c2: e.target.value })} /></Field>
          <Btn onClick={() => { if (!f.title.trim()) return toast("Title is required", "bad"); update((d) => { d.settings.sliders.push({ id: nid(d), ...f, title: f.title.trim() }); }); setF({ ...f, title: "", sub: "" }); toast("Slider added", "ok"); }}>Upload</Btn>
        </div>
      </Card>
    </>
  );
}

export function WithdrawDays() {
  const { state: s } = useStore();
  const { f, setF, save } = useSettingsForm(["withdraw"]);
  const w = f.withdraw;
  return (
    <Card title="Withdraw Day Option">
      <div className="flex flex-wrap gap-2">
        {DAYS.map((d, i) => {
          const on = w.days.includes(i);
          return <label key={d} className="flex items-center gap-1.5 border border-slate-200 rounded px-3 py-2 text-sm cursor-pointer"><input type="checkbox" checked={on} onChange={() => setF({ withdraw: { ...w, days: on ? w.days.filter((x) => x !== i) : [...w.days, i].sort() } })} />{d}</label>;
        })}
      </div>
      <div className="grid sm:grid-cols-2 gap-4 mt-4 max-w-md">
        <Field label="Withdraw Open Time"><input type="time" className="admin-input" value={w.from} onChange={(e) => setF({ withdraw: { ...w, from: e.target.value } })} /></Field>
        <Field label="Withdraw Close Time"><input type="time" className="admin-input" value={w.to} onChange={(e) => setF({ withdraw: { ...w, to: e.target.value } })} /></Field>
      </div>
      <Btn className="mt-5" onClick={() => save("Withdraw Day Option", (v) => (v.withdraw.from >= v.withdraw.to ? "Close time must be after open time" : null))}>Update</Btn>
      <p className="text-sm text-slate-500 mt-4">Withdraw is currently <b>{withdrawOpen(s) ? "open" : "closed"}</b> for players{s.settings.demoMode ? " (time window ignored in demo mode)" : ""}.</p>
    </Card>
  );
}

export function GoldenAnk() {
  const { f, setF, save } = useSettingsForm(["golden"]);
  const g = f.golden;
  return (
    <Card title="Golden Ank">
      <Field label="Date" className="max-w-xs"><input type="date" className="admin-input" value={g.date} onChange={(e) => setF({ golden: { ...g, date: e.target.value } })} /></Field>
      <div className="text-[13px] text-slate-600 mt-4 mb-2">Golden Ank (max 4)</div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 10 }, (_, a) => {
          const on = g.anks.includes(a);
          return <button key={a} onClick={() => setF({ golden: { ...g, anks: on ? g.anks.filter((x) => x !== a) : g.anks.length < 4 ? [...g.anks, a].sort() : g.anks } })} className={`w-11 h-11 rounded border text-lg font-semibold ${on ? "bg-[#f5b301] border-[#f5b301] text-white" : "border-slate-300"}`}>{a}</button>;
        })}
      </div>
      <Btn className="mt-5" onClick={() => save("Golden Ank")}>Update</Btn>
      {g.date !== ymd() && <p className="text-xs text-amber-600 mt-2">Shown in the app only on {g.date}.</p>}
    </Card>
  );
}
