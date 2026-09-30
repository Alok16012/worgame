"use client";

import { useState } from "react";
import { log, marketStatus, nid } from "../../lib/engine";
import { fmtTime, inr } from "../../lib/format";
import { useNow, useStore } from "../../lib/store";
import { CAT_ICON, CAT_LABEL, type Cat, type Game } from "../../lib/types";
import { AnkPicker, Btn, Card, Field, Modal, StatusBadge, Table, Title, useAdmin } from "../ui";

const validTime = (t: string) => /^\d{2}:\d{2}$/.test(t);

export function GameNames({ cat }: { cat: Cat }) {
  const { state: s, update } = useStore();
  const { toast, confirm } = useAdmin();
  const now = useNow();
  const games = s.games.filter((g) => g.cat === cat);
  const [f, setF] = useState({ name: "", open: "10:00", close: "11:00", rate: cat === "starline" ? "9" : "9.5" });
  const [edit, setEdit] = useState<Game | null>(null);

  const add = () => {
    const name = f.name.trim();
    if (!name) return toast("Game name is required", "bad");
    if (!validTime(f.open) || !validTime(f.close) || f.open >= f.close) return toast("Close time must be after open time", "bad");
    if (!(Number(f.rate) > 1)) return toast("Rate must be greater than 1", "bad");
    if (s.games.some((g) => g.name.toLowerCase() === name.toLowerCase())) return toast("A game with this name exists", "bad");
    update((d) => { d.games.push({ id: nid(d), cat, name, open: f.open, close: f.close, rate: Number(f.rate), active: true, numbers: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] }); log(d, "Add Game", `${name} (${CAT_LABEL[cat]})`); });
    setF({ ...f, name: "" });
    toast("Game added", "ok");
  };

  const save = () => {
    if (!edit) return;
    if (!edit.name.trim() || edit.open >= edit.close || !(edit.rate > 1)) return toast("Check name, timings and rate", "bad");
    update((d) => { const i = d.games.findIndex((g) => g.id === edit.id); d.games[i] = { ...edit, name: edit.name.trim() }; log(d, "Edit Game", edit.name); });
    setEdit(null);
    toast("Game updated", "ok");
  };

  const remove = async (g: Game) => {
    if (s.bids.some((b) => b.gameId === g.id)) return toast("This game has bids — switch it off instead", "bad");
    if (await confirm({ title: "Delete game", body: <>Delete <b>{g.name}</b>?</>, ok: "Delete", tone: "red" })) update((d) => { d.games = d.games.filter((x) => x.id !== g.id); log(d, "Delete Game", g.name); });
  };

  return (
    <>
      <Title t={`${CAT_ICON[cat]} ${CAT_LABEL[cat]} — Game Name`} s="A market has an open time (bidding starts) and a close time (bidding stops, result due)." />
      <Card title={`Add ${CAT_LABEL[cat]} market`}>
        <div className="grid md:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-3 items-end">
          <Field label="Game Name"><input className="admin-input" placeholder="e.g. Lucky Noon" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Open Time"><input type="time" className="admin-input" value={f.open} onChange={(e) => setF({ ...f, open: e.target.value })} /></Field>
          <Field label="Close Time"><input type="time" className="admin-input" value={f.close} onChange={(e) => setF({ ...f, close: e.target.value })} /></Field>
          <Field label="Rate (x)"><input type="number" step="0.1" className="admin-input" value={f.rate} onChange={(e) => setF({ ...f, rate: e.target.value })} /></Field>
          <Btn onClick={add}>Add Game</Btn>
        </div>
      </Card>
      <Card className="mt-4">
        <Table head={["ID", "Game Name", "Open", "Close", "Rate", "Today", "Active", "Action"]} rows={games.map((g) => [
          `#${g.id}`, <b key="n" className="text-slate-900">{g.name}</b>, fmtTime(g.open), fmtTime(g.close), `${g.rate}x`, <StatusBadge key="s" s={marketStatus(s, g, undefined, now)} />,
          <button key="t" onClick={() => update((d) => { const x = d.games.find((y) => y.id === g.id)!; x.active = !x.active; log(d, "Game Status", `${x.name} → ${x.active ? "on" : "off"}`); })}
            className={`w-11 h-6 rounded-full p-0.5 transition-colors ${g.active ? "bg-emerald-500" : "bg-slate-300"}`} aria-label="Toggle active">
            <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${g.active ? "translate-x-5" : ""}`} />
          </button>,
          <div key="a" className="flex gap-1.5"><Btn size="sm" variant="ghost" onClick={() => setEdit({ ...g })}>Edit</Btn><Btn size="sm" variant="ghost" onClick={() => remove(g)}>Delete</Btn></div>,
        ])} />
      </Card>
      {edit && (
        <Modal title={`Edit ${edit.name}`} onClose={() => setEdit(null)} footer={<><Btn variant="ghost" onClick={() => setEdit(null)}>Cancel</Btn><Btn onClick={save}>Update</Btn></>}>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Name"><input className="admin-input" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            <Field label="Rate (x)"><input type="number" step="0.1" className="admin-input" value={edit.rate} onChange={(e) => setEdit({ ...edit, rate: Number(e.target.value) })} /></Field>
            <Field label="Open"><input type="time" className="admin-input" value={edit.open} onChange={(e) => setEdit({ ...edit, open: e.target.value })} /></Field>
            <Field label="Close"><input type="time" className="admin-input" value={edit.close} onChange={(e) => setEdit({ ...edit, close: e.target.value })} /></Field>
          </div>
        </Modal>
      )}
    </>
  );
}

export function GameRates({ cat }: { cat: Cat }) {
  const { state: s, update } = useStore();
  const { toast } = useAdmin();
  const games = s.games.filter((g) => g.cat === cat);
  const [rates, setRates] = useState<Record<number, string>>(() => Object.fromEntries(games.map((g) => [g.id, String(g.rate)])));
  const [all, setAll] = useState("");

  const save = () => {
    if (Object.values(rates).some((r) => !(Number(r) > 1))) return toast("Every rate must be greater than 1", "bad");
    update((d) => { for (const g of d.games) if (rates[g.id] !== undefined) g.rate = Number(rates[g.id]); log(d, "Game Rates", `${CAT_LABEL[cat]}: ${games.map((g) => `${g.name} ${rates[g.id]}x`).join(", ")}`); });
    toast("Rates updated", "ok");
  };

  return (
    <>
      <Title t={`${CAT_ICON[cat]} ${CAT_LABEL[cat]} — Game Rates`} s="Winning amount = Bid × Rate. The rate is locked on each bid when placed, so changes only affect new bids." />
      <Card>
        <div className="flex flex-wrap gap-3 items-end mb-4">
          <Field label="Set same rate for all" className="w-52"><input type="number" step="0.1" className="admin-input" placeholder="e.g. 9.5" value={all} onChange={(e) => setAll(e.target.value)} /></Field>
          <Btn variant="ghost" onClick={() => Number(all) > 1 && setRates(Object.fromEntries(games.map((g) => [g.id, all])))}>Apply to all</Btn>
        </div>
        <Table max={false} head={["Game", "Current Rate", "New Rate", "₹10 bid wins"]} rows={games.map((g) => [
          <b key="n" className="text-slate-900">{g.name}</b>, `${g.rate}x`,
          <input key="i" type="number" step="0.1" className="admin-input !w-28" value={rates[g.id] ?? ""} onChange={(e) => setRates({ ...rates, [g.id]: e.target.value })} />,
          inr(10 * (Number(rates[g.id]) || 0)),
        ])} />
        <Btn className="mt-4" onClick={save}>Update Rates</Btn>
      </Card>
    </>
  );
}

export function GameNumbers() {
  const { state: s, update } = useStore();
  const toggle = (g: Game, a: number) =>
    update((d) => {
      const x = d.games.find((y) => y.id === g.id)!;
      x.numbers = x.numbers.includes(a) ? x.numbers.filter((n) => n !== a) : [...x.numbers, a].sort((p, q) => p - q);
      log(d, "Game Numbers", `${x.name} → ${x.numbers.join("") || "none"}`);
    });
  return (
    <>
      <Title t="Game Numbers" s="Switch an Ank off to stop users bidding on it (e.g. when exposure on that number is too high)." />
      <Card>
        <div className="divide-y divide-slate-100">
          {s.games.map((g) => (
            <div key={g.id} className="flex flex-wrap items-center gap-4 py-3">
              <div className="w-48"><div className="font-semibold text-slate-900">{g.name}</div><div className="text-xs text-slate-400">{CAT_LABEL[g.cat]} · {g.numbers.length}/10 enabled</div></div>
              <AnkPicker selected={g.numbers} onPick={(a) => toggle(g, a)} />
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
