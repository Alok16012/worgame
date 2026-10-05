"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { deleteGame, deleteInactiveGames, log, nid } from "../../lib/engine";
import { DAYS, fmtTime } from "../../lib/format";
import { DIGITS, DOUBLE_PANA, JODIS, SINGLE_PANA, TRIPLE_PANA } from "../../lib/matka";
import { useStore } from "../../lib/store";
import { CAT_LABEL, CAT_TYPES, TYPE_LABEL, type Cat, type Game, type GameType, type Rate } from "../../lib/types";
import { Btn, Card, DataTable, Field, Modal, YesNo, useAdmin } from "../ui";

export function GameNames({ cat }: { cat: Cat }) {
  const { state: s, attempt, update } = useStore();
  const { toast, confirm } = useAdmin();
  const two = cat === "main";
  const blank: Game = { id: 0, cat, name: "", open: "10:00", close: "11:00", active: true, offDays: [] };
  const [edit, setEdit] = useState<Game | null>(null);
  const games = s.games.filter((g) => g.cat === cat);
  const inactiveGames = games.filter((g) => !g.active);

  const removeGame = async (g: Game) => {
    if (
      !(await confirm({
        title: "Delete Game",
        body: (
          <>
            Are you sure you want to permanently delete game <b>{g.name}</b>?
          </>
        ),
        ok: "Delete Permanently",
        tone: "red",
      }))
    )
      return;

    const r = attempt((d) => deleteGame(d, g.id));
    if (r.ok) {
      toast(`Game ${g.name} deleted`, "ok");
    } else {
      toast(r.error, "bad");
    }
  };

  const removeInactive = async () => {
    if (!inactiveGames.length) return;
    if (
      !(await confirm({
        title: "Delete All Inactive / Closed Games",
        body: (
          <>
            Are you sure you want to permanently delete all <b>{inactiveGames.length}</b> closed (inactive) games in{" "}
            <b>{CAT_LABEL[cat]}</b>?
          </>
        ),
        ok: `Delete ${inactiveGames.length} Closed Games`,
        tone: "red",
      }))
    )
      return;

    const r = attempt((d) => deleteInactiveGames(d, cat));
    if (r.ok) {
      toast(`${r.value} closed games deleted`, "ok");
    } else {
      toast(r.error, "bad");
    }
  };

  const save = () => {
    if (!edit) return;
    const name = edit.name.trim().toUpperCase();
    if (!name) return toast("Game name is required", "bad");
    if (two && edit.open >= edit.close) return toast("Close time must be after open time", "bad");
    if (s.games.some((g) => g.cat === cat && g.name === name && g.id !== edit.id)) return toast("Game name already exists", "bad");
    const g: Game = { ...edit, name, open: two ? edit.open : edit.close };
    update((d) => {
      if (g.id) d.games = d.games.map((x) => (x.id === g.id ? g : x));
      else d.games.push({ ...g, id: nid(d) });
      log(d, g.id ? "Edit Game" : "Add Game", `${CAT_LABEL[cat]} ${name}`);
    });
    toast(g.id ? "Game updated" : "Game added", "ok");
    setEdit(null);
  };

  return (
    <Card
      title={`${cat === "main" ? "" : CAT_LABEL[cat] + " "}Game Name`}
      right={
        <div className="flex items-center gap-2">
          {inactiveGames.length > 0 && (
            <Btn variant="red" onClick={removeInactive}>
              <Trash2 size={14} /> Delete Closed ({inactiveGames.length})
            </Btn>
          )}
          <Btn variant="dark" onClick={() => setEdit(blank)}>+ Add Game</Btn>
        </div>
      }
    >
      <DataTable head={["Sr No", "Game Name", ...(two ? ["Open Time", "Close Time"] : ["Result Time"]), "Market Off Days", "Active", "Action"]}
        rows={games.map((g, i) => [i + 1, <b key="n">{g.name}</b>, ...(two ? [fmtTime(g.open), fmtTime(g.close)] : [fmtTime(g.close)]),
          g.offDays?.length ? <span key="o" className="text-rose-600 font-medium">{g.offDays.map((d) => DAYS[d]).join(", ")}</span> : <span key="o" className="text-slate-400">Open all days</span>,
          <YesNo key="a" on={g.active} onChange={() => update((d) => { const x = d.games.find((y) => y.id === g.id)!; x.active = !x.active; log(d, "Game Status", `${x.name} → ${x.active ? "active" : "inactive"}`); })} />,
          <div key="act" className="flex items-center gap-1">
            <button className="p-1.5 text-slate-600 hover:text-[#0d6efd]" onClick={() => setEdit({ ...g, offDays: g.offDays ?? [] })} aria-label="Edit" title="Edit Game"><Pencil size={15} /></button>
            <button className="p-1.5 text-rose-500 hover:text-rose-700" onClick={() => removeGame(g)} aria-label="Delete" title="Delete Game"><Trash2 size={15} /></button>
          </div>])}
        text={games.map((g) => g.name)} />
      {edit && (
        <Modal title={edit.id ? "Edit Game" : "Add Game"} onClose={() => setEdit(null)} footer={<><Btn variant="ghost" onClick={() => setEdit(null)}>Close</Btn><Btn onClick={save}>Submit</Btn></>}>
          <div className="space-y-3">
            <Field label="Game Name"><input className="admin-input uppercase" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            {two && <Field label="Open Time"><input type="time" className="admin-input" value={edit.open} onChange={(e) => setEdit({ ...edit, open: e.target.value })} /></Field>}
            <Field label={two ? "Close Time" : "Result Time"}><input type="time" className="admin-input" value={edit.close} onChange={(e) => setEdit({ ...edit, close: e.target.value })} /></Field>
            <div>
              <div className="text-[13px] text-slate-600 mb-1.5">Market Off Days (closed on)</div>
              <div className="flex flex-wrap gap-1.5">
                {DAYS.map((d, i) => {
                  const on = edit.offDays.includes(i);
                  return <label key={d} className={`flex items-center gap-1.5 border rounded px-2.5 py-1.5 text-sm cursor-pointer ${on ? "border-rose-300 bg-rose-50 text-rose-700" : "border-slate-200"}`}><input type="checkbox" checked={on} onChange={() => setEdit({ ...edit, offDays: on ? edit.offDays.filter((x) => x !== i) : [...edit.offDays, i].sort() })} />{d}</label>;
                })}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">On these days the market shows Holiday in the app and no bids are taken.</div>
            </div>
          </div>
        </Modal>
      )}
    </Card>
  );
}

export function GameRates({ cat }: { cat: Cat }) {
  const { state: s, update } = useStore();
  const { toast } = useAdmin();
  const types = CAT_TYPES[cat];
  const [rates, setRates] = useState<Partial<Record<GameType, Rate>>>(() => structuredClone(s.settings.rates[cat]));

  const save = () => {
    if (types.some((t) => !(rates[t]?.bet && rates[t]!.bet > 0 && rates[t]!.win > rates[t]!.bet))) return toast("Value 2 (win) must be more than Value 1 (bid) for every game type", "bad");
    update((d) => { d.settings.rates[cat] = rates; log(d, "Game Rates", `${CAT_LABEL[cat]}: ${types.map((t) => `${TYPE_LABEL[t]} ${rates[t]!.bet}→${rates[t]!.win}`).join(", ")}`); });
    toast("Game rates updated", "ok");
  };

  return (
    <Card title={`${cat === "main" ? "" : CAT_LABEL[cat] + " "}Game Rates`}>
      <p className="text-sm text-slate-500 mb-4">Value 1 is the bid, Value 2 is the winning amount. Example: Single Ank 10 → 100 means a ₹10 bid wins ₹100. Rates are locked on each bid when it is placed.</p>
      <div className="space-y-3">
        {types.map((t) => (
          <div key={t} className="grid grid-cols-[1fr_1fr_1fr] sm:grid-cols-[200px_160px_160px_1fr] gap-3 items-end">
            <div className="font-medium text-slate-700 pb-2">{TYPE_LABEL[t]}</div>
            <Field label="Value 1"><input className="admin-input" inputMode="numeric" value={rates[t]?.bet ?? ""} onChange={(e) => setRates({ ...rates, [t]: { bet: Number(e.target.value.replace(/\D/g, "")), win: rates[t]?.win ?? 0 } })} /></Field>
            <Field label="Value 2"><input className="admin-input" inputMode="numeric" value={rates[t]?.win ?? ""} onChange={(e) => setRates({ ...rates, [t]: { bet: rates[t]?.bet ?? 0, win: Number(e.target.value.replace(/\D/g, "")) } })} /></Field>
            <div className="hidden sm:block text-xs text-slate-400 pb-3">{rates[t]?.bet ? `${(rates[t]!.win / rates[t]!.bet).toFixed(1)}x` : ""}</div>
          </div>
        ))}
      </div>
      <Btn className="mt-5" onClick={save}>Update</Btn>
    </Card>
  );
}

export function GameNumbers() {
  const block = (title: string, list: string[], cols: string) => (
    <Card title={title} className="mb-5">
      <div className={`grid ${cols} gap-3`}>
        {list.map((n) => <div key={n} className="border border-[#0d6efd]/60 text-[#0d6efd] rounded text-center py-1.5 text-sm">{n}</div>)}
      </div>
    </Card>
  );
  return (
    <>
      {block("Single Digit", DIGITS, "grid-cols-5")}
      {block("Jodi", JODIS, "grid-cols-5 sm:grid-cols-10")}
      {block("Single Pana", SINGLE_PANA, "grid-cols-5 sm:grid-cols-10")}
      {block("Double Pana", DOUBLE_PANA, "grid-cols-5 sm:grid-cols-10")}
      {block("Triple Pana", TRIPLE_PANA, "grid-cols-5 sm:grid-cols-10")}
    </>
  );
}
