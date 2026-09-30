"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { log, nid, withdrawOpen } from "../../lib/engine";
import { DAYS, fmtTime, ymd } from "../../lib/format";
import { useStore } from "../../lib/store";
import type { Settings } from "../../lib/types";
import { AnkPicker, Badge, Btn, Card, Field, Table, Title, useAdmin } from "../ui";

function useSettingsForm<K extends keyof Settings>(keys: K[]) {
  const { state: s, update } = useStore();
  const { toast } = useAdmin();
  const [f, setF] = useState(() => Object.fromEntries(keys.map((k) => [k, s.settings[k]])) as Pick<Settings, K>);
  const save = (label: string, validate?: (v: Pick<Settings, K>) => string | null) => {
    const err = validate?.(f);
    if (err) return toast(err, "bad");
    update((d) => { Object.assign(d.settings, f); log(d, label, "updated"); });
    toast("Saved", "ok");
  };
  return { f, setF, save };
}

function Toggle({ on, onChange, label, hint }: { on: boolean; onChange: (v: boolean) => void; label: string; hint: string }) {
  return (
    <button type="button" onClick={() => onChange(!on)} className="flex items-start gap-3 text-left border border-slate-200 rounded-xl p-3 hover:bg-slate-50">
      <div className={`w-11 h-6 shrink-0 rounded-full p-0.5 transition-colors ${on ? "bg-emerald-500" : "bg-slate-300"}`}><div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : ""}`} /></div>
      <div><div className="text-sm font-semibold text-slate-800">{label}</div><div className="text-xs text-slate-500">{hint}</div></div>
    </button>
  );
}

export function MainSetting() {
  const { f, setF, save } = useSettingsForm(["appName", "tagline", "upiId", "version", "minDeposit", "minWithdraw", "welcomeBonus", "minBid", "maxBid", "demoMode", "maintenance"]);
  const num = (k: "minDeposit" | "minWithdraw" | "welcomeBonus" | "minBid" | "maxBid", label: string) => (
    <Field label={label}><input type="number" min={0} className="admin-input" value={f[k]} onChange={(e) => setF({ ...f, [k]: Number(e.target.value) })} /></Field>
  );
  return (
    <>
      <Title t="Main Setting" s="Core limits and switches applied to the player app." />
      <Card>
        <div className="grid md:grid-cols-3 gap-3">
          <Field label="App Name"><input className="admin-input" value={f.appName} onChange={(e) => setF({ ...f, appName: e.target.value })} /></Field>
          <Field label="Tagline"><input className="admin-input" value={f.tagline} onChange={(e) => setF({ ...f, tagline: e.target.value })} /></Field>
          <Field label="Merchant UPI ID"><input className="admin-input" value={f.upiId} onChange={(e) => setF({ ...f, upiId: e.target.value })} /></Field>
          {num("minDeposit", "Min Deposit (₹)")}
          {num("minWithdraw", "Min Withdraw (₹)")}
          {num("welcomeBonus", "Welcome Bonus (₹)")}
          {num("minBid", "Min Bid (₹)")}
          {num("maxBid", "Max Bid (₹)")}
          <Field label="App Version"><input className="admin-input" value={f.version} onChange={(e) => setF({ ...f, version: e.target.value })} /></Field>
        </div>
        <div className="grid md:grid-cols-2 gap-3 mt-4">
          <Toggle on={f.demoMode} onChange={(v) => setF({ ...f, demoMode: v })} label="Demo mode" hint="Keep every market open for bidding, ignoring open/close times." />
          <Toggle on={f.maintenance} onChange={(v) => setF({ ...f, maintenance: v })} label="Maintenance mode" hint="Player app shows an 'under maintenance' screen." />
        </div>
        <Btn className="mt-4" onClick={() => save("Main Setting", (v) => (!v.appName.trim() ? "App name is required" : v.minBid > v.maxBid ? "Min bid cannot exceed max bid" : v.minBid < 1 ? "Min bid must be at least ₹1" : null))}>Save Settings</Btn>
      </Card>
    </>
  );
}

export function ContactSetting() {
  const { f, setF, save } = useSettingsForm(["contact"]);
  const c = f.contact;
  const fields = [["whatsapp", "WhatsApp Number"], ["phone", "Call Number"], ["email", "Email"], ["telegram", "Telegram"]] as const;
  return (
    <>
      <Title t="Contact Setting" s="Shown on the app's Help & Support screen." />
      <Card>
        <div className="grid md:grid-cols-2 gap-3">
          {fields.map(([k, l]) => <Field key={k} label={l}><input className="admin-input" value={c[k]} onChange={(e) => setF({ contact: { ...c, [k]: e.target.value } })} /></Field>)}
        </div>
        <Btn className="mt-4" onClick={() => save("Contact Setting")}>Save</Btn>
      </Card>
    </>
  );
}

export function HowToPlaySetting() {
  const { f, setF, save } = useSettingsForm(["howToPlay", "video"]);
  return (
    <>
      <Title t="How To Play" s="Instructions shown to players inside the app." />
      <Card>
        <Field label="Instructions"><textarea rows={10} className="admin-input" value={f.howToPlay} onChange={(e) => setF({ ...f, howToPlay: e.target.value })} /></Field>
        <Field label="Video Link" className="mt-3"><input className="admin-input" value={f.video} onChange={(e) => setF({ ...f, video: e.target.value })} /></Field>
        <Btn className="mt-4" onClick={() => save("How To Play")}>Update</Btn>
      </Card>
    </>
  );
}

export function SliderImages() {
  const { state: s, update } = useStore();
  const { toast } = useAdmin();
  const [f, setF] = useState({ title: "", sub: "", c1: "#5b3df5", c2: "#1a2152" });
  const add = () => {
    if (!f.title.trim()) return toast("Title is required", "bad");
    update((d) => { d.settings.sliders.push({ id: nid(d), ...f, title: f.title.trim() }); log(d, "Slider Image", `added ${f.title.trim()}`); });
    setF({ ...f, title: "", sub: "" });
    toast("Banner added", "ok");
  };
  return (
    <>
      <Title t="Slider Image" s="Banners that rotate on the app home screen." />
      <Card>
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {s.settings.sliders.map((b) => (
            <div key={b.id} className="relative rounded-2xl p-5 min-h-32 text-white flex flex-col justify-end" style={{ background: `linear-gradient(135deg,${b.c1},${b.c2})` }}>
              <div className="font-bold text-lg">{b.title}</div><div className="text-sm opacity-80">{b.sub}</div>
              <button onClick={() => update((d) => { d.settings.sliders = d.settings.sliders.filter((x) => x.id !== b.id); log(d, "Slider Image", `removed ${b.title}`); })} className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/30 hover:bg-black/50" aria-label="Remove"><Trash2 size={14} /></button>
            </div>
          ))}
          {!s.settings.sliders.length && <div className="text-sm text-slate-400">No banners yet.</div>}
        </div>
      </Card>
      <Card className="mt-4" title="Add banner" desc="Production uploads an image to storage; this demo uses a gradient banner.">
        <div className="grid md:grid-cols-[2fr_2fr_auto_auto_auto] gap-3 items-end">
          <Field label="Title"><input className="admin-input" placeholder="Big Wins Faster" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
          <Field label="Sub text"><input className="admin-input" placeholder="New market live" value={f.sub} onChange={(e) => setF({ ...f, sub: e.target.value })} /></Field>
          <Field label="Color 1"><input type="color" className="h-10 w-16 rounded-lg border border-slate-200" value={f.c1} onChange={(e) => setF({ ...f, c1: e.target.value })} /></Field>
          <Field label="Color 2"><input type="color" className="h-10 w-16 rounded-lg border border-slate-200" value={f.c2} onChange={(e) => setF({ ...f, c2: e.target.value })} /></Field>
          <Btn onClick={add}>Upload</Btn>
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
    <>
      <Title t="Withdraw Day Option" s="Players can request withdrawals only on these days, within the time window." />
      <Card>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((d, i) => {
            const on = w.days.includes(i);
            return <button key={d} onClick={() => setF({ withdraw: { ...w, days: on ? w.days.filter((x) => x !== i) : [...w.days, i].sort() } })} className={`w-16 py-2 rounded-xl text-sm font-semibold border ${on ? "bg-brand-600 text-white border-brand-600" : "bg-white text-slate-600 border-slate-200"}`}>{d}</button>;
          })}
        </div>
        <div className="grid sm:grid-cols-2 gap-3 mt-4 max-w-md">
          <Field label="From"><input type="time" className="admin-input" value={w.from} onChange={(e) => setF({ withdraw: { ...w, from: e.target.value } })} /></Field>
          <Field label="To"><input type="time" className="admin-input" value={w.to} onChange={(e) => setF({ withdraw: { ...w, to: e.target.value } })} /></Field>
        </div>
        <Btn className="mt-4" onClick={() => save("Withdraw Days", (v) => (v.withdraw.from >= v.withdraw.to ? "'To' must be after 'From'" : null))}>Save</Btn>
        <p className="text-sm bg-brand-50 text-brand-700 rounded-xl px-4 py-3 mt-4">
          Today is <b>{DAYS[new Date().getDay()]}</b>. Withdrawals are currently <b>{withdrawOpen(s) ? "allowed" : "not allowed"}</b> ({fmtTime(s.settings.withdraw.from)}–{fmtTime(s.settings.withdraw.to)}{s.settings.demoMode ? ", time window ignored in demo mode" : ""}).
        </p>
      </Card>
    </>
  );
}

export function GoldenAnk() {
  const { f, setF, save } = useSettingsForm(["golden"]);
  const g = f.golden;
  return (
    <>
      <Title t="Golden Ank" s="Featured 'lucky' Anks shown on the app home screen for the chosen date (up to 4). Informational only." />
      <Card>
        <Field label="Date" className="max-w-xs"><input type="date" className="admin-input" value={g.date} onChange={(e) => setF({ golden: { ...g, date: e.target.value } })} /></Field>
        <div className="text-xs font-semibold text-slate-500 mt-4 mb-2">Anks ({g.anks.length}/4)</div>
        <AnkPicker selected={g.anks} onPick={(a) => setF({ golden: { ...g, anks: g.anks.includes(a) ? g.anks.filter((x) => x !== a) : g.anks.length < 4 ? [...g.anks, a].sort() : g.anks } })} />
        <Btn className="mt-4" onClick={() => save("Golden Ank")}>Save</Btn>
        {g.date !== ymd() && <p className="text-xs text-amber-600 mt-2">Only shown in the app on {g.date}.</p>}
      </Card>
    </>
  );
}

export function ActivityLog() {
  const { state: s } = useStore();
  const [q, setQ] = useState("");
  const list = s.audit.slice().reverse().filter((a) => !q || `${a.action} ${a.detail}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <Title t="Activity Log" s="Every sensitive admin action (results, funds, reverts, settings) is recorded for fraud control." />
      <Card right={<input className="admin-input !w-64" placeholder="Search actions" value={q} onChange={(e) => setQ(e.target.value)} />}>
        <Table head={["Time", "Admin", "Action", "Detail"]} rows={list.map((a) => [a.at, a.by, <Badge key="a" tone="violet">{a.action}</Badge>, <span key="d" className="whitespace-normal">{a.detail}</span>])} />
      </Card>
    </>
  );
}
