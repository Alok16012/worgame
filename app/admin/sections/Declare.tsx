"use client";

import { useState } from "react";
import { declareResult, deleteResult, gameDay, findGame, findUser, previewWinners, resultOf } from "../../lib/engine";
import { fmtDate, inr, ymd } from "../../lib/format";
import { normalizePana, panaDigit } from "../../lib/matka";
import { useStore } from "../../lib/store";
import { CAT_LABEL, type Bid, type Cat, type Game, type Session } from "../../lib/types";
import { bidTypeLabel, fmtStamp, GameSelect, safe, sessionLabel } from "../common";
import { Btn, Card, Field, Table, useAdmin } from "../ui";

export function DeclareResult({ cat }: { cat: Cat }) {
  const { state: s, attempt } = useStore();
  const { confirm, toast } = useAdmin();
  const [date, setDate] = useState(() => gameDay()); // after midnight, night markets still belong to yesterday
  const [gameId, setGameId] = useState<number | "">("");
  const [session, setSession] = useState<Session>("open");
  const [loaded, setLoaded] = useState<{ gameId: number; date: string; session: Session } | null>(null);
  const [value, setValue] = useState("");
  const [winners, setWinners] = useState<(Bid & { win: number })[] | null>(null);
  const [histDate, setHistDate] = useState(() => gameDay());

  // Only games that still have a result to declare for this date: fully declared games are hidden.
  const pending = (game: Game, d = date) => {
    const x = resultOf(s, game.id, d);
    return game.cat === "gali" ? !x?.jodi : game.cat === "starline" ? !x?.openPana : !x?.closePana;
  };

  const g = loaded ? findGame(s, loaded.gameId) : undefined;
  const r = gameId ? resultOf(s, gameId, date) : undefined;
  const sessions: Session[] = cat !== "main" ? ["open"] : (["open", "close"] as Session[]).filter((x) => (x === "open" ? !r?.openPana : !r?.closePana));

  const go = () => {
    if (!gameId) return toast("Select a game", "bad");
    const done = cat === "gali" ? r?.jodi : cat === "starline" ? r?.openPana : sessions.length === 0;
    if (done) return toast("Result already declared for this game and date", "bad");
    const ses = cat === "main" ? (sessions.includes(session) ? session : sessions[0]) : "open";
    setSession(ses);
    setLoaded({ gameId, date, session: ses });
    setValue("");
    setWinners(null);
  };

  const cleanValue = () => (cat === "gali" ? value : value.length === 3 ? normalizePana(value) : value);
  const digit = cat !== "gali" && /^\d{3}$/.test(value) ? panaDigit(value) : "";

  const showWinner = () => {
    if (!loaded) return;
    const v = cleanValue();
    if (v !== value) setValue(v);
    const res = safe(() => previewWinners(s, loaded.gameId, loaded.date, loaded.session, v));
    if (res.ok) setWinners(res.value.winners); else toast(res.error, "bad");
  };

  const declare = async () => {
    if (!loaded || !g) return;
    const v = cleanValue();
    const pv = safe(() => previewWinners(s, loaded.gameId, loaded.date, loaded.session, v));
    if (!pv.ok) return toast(pv.error, "bad");
    const label = cat === "gali" ? `Jodi ${v}` : `${v}-${panaDigit(v)}`;
    const ok = await confirm({
      title: "Declare Result",
      body: <><b>{g.name}</b> · {fmtDate(loaded.date)}{cat === "main" ? ` · ${loaded.session === "open" ? "Open" : "Close"}` : ""}<br />Result <b>{label}</b> — {pv.value.winners.length} winners, payout <b>{inr(pv.value.payout)}</b>.</>,
      ok: "Declare", tone: "green", requireText: v,
    });
    if (!ok) return;
    const res = attempt((d) => declareResult(d, loaded.gameId, loaded.date, loaded.session, v));
    if (!res.ok) return toast(res.error, "bad");
    toast(`Result declared · ${res.value.winners} winners · ${inr(res.value.payout)}`, "ok");
    if (cat !== "main" || loaded.session === "close") setGameId("");
    setLoaded(null);
    setWinners(null);
    setValue("");
  };

  const remove = async (gid: number, d: string, ses: Session) => {
    const game = findGame(s, gid)!;
    const ok = await confirm({ title: "Delete Result", body: <>Delete the {cat === "main" ? (ses === "open" ? "open" : "close") + " " : ""}result of <b>{game.name}</b> ({fmtDate(d)})? Winning amounts already credited will be taken back and bids go back to pending.</>, ok: "Delete", tone: "red" });
    if (!ok) return;
    const res = attempt((x) => deleteResult(x, gid, d, ses));
    if (res.ok) toast("Result deleted", "ok"); else toast(res.error, "bad");
  };

  const history = s.results.filter((x) => x.date === histDate && findGame(s, x.gameId)?.cat === cat).sort((a, b) => (b.closeAt ?? b.openAt ?? "").localeCompare(a.closeAt ?? a.openAt ?? ""));
  const del = (gid: number, d: string, ses: Session) => <button className="text-rose-600 underline text-xs ml-2" onClick={() => remove(gid, d, ses)}>Delete</button>;

  return (
    <>
      <Card title={cat === "main" ? "Result Declared" : `${CAT_LABEL[cat]} Result Declared`}>
        <div className="grid sm:grid-cols-[1fr_1fr_1fr_auto] gap-4 items-end">
          <Field label="Date"><input type="date" className="admin-input" value={date} max={ymd()} onChange={(e) => { const d = e.target.value; setDate(d); setLoaded(null); const sel = gameId ? findGame(s, gameId) : undefined; if (sel && !pending(sel, d)) setGameId(""); }} /></Field>
          <Field label="Game Name"><GameSelect cat={cat} all="-Select Game-" show={(x) => pending(x) || x.id === loaded?.gameId} value={gameId} onChange={(v) => { setGameId(v); setLoaded(null); }} /></Field>
          {cat === "main" ? (
            <Field label="Session">
              <select className="admin-input" value={session} onChange={(e) => { setSession(e.target.value as Session); setLoaded(null); }}>
                {(gameId ? sessions : (["open", "close"] as Session[])).map((x) => <option key={x} value={x}>{x === "open" ? "Open" : "Close"}</option>)}
              </select>
            </Field>
          ) : <div />}
          <Btn variant="dark" onClick={go}>Go</Btn>
        </div>

        {loaded && g && (
          <div className="mt-6 fadein">
            <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-4 items-end">
              {cat === "gali" ? (
                <>
                  <Field label="Jodi"><input autoFocus className="admin-input" inputMode="numeric" maxLength={2} value={value} onChange={(e) => { setValue(e.target.value.replace(/\D/g, "")); setWinners(null); }} /></Field>
                  <Field label="Left / Right Digit"><input className="admin-input bg-slate-50" readOnly value={value.length === 2 ? `${value[0]} / ${value[1]}` : ""} /></Field>
                </>
              ) : (
                <>
                  <Field label={cat === "starline" ? "Pana" : loaded.session === "open" ? "Open Panna" : "Close Panna"}>
                    <input autoFocus className="admin-input" inputMode="numeric" maxLength={3} value={value} onChange={(e) => { setValue(e.target.value.replace(/\D/g, "")); setWinners(null); }} />
                  </Field>
                  <Field label={cat === "starline" ? "Digit" : loaded.session === "open" ? "Open Digit" : "Close Digit"}><input className="admin-input bg-slate-50" readOnly value={digit} /></Field>
                </>
              )}
              <div className="flex flex-col gap-2">
                <Btn variant="amber" onClick={showWinner}>SHOW WINNER</Btn>
                <Btn variant="green" onClick={declare}>DECLARE</Btn>
              </div>
            </div>
            {cat === "main" && loaded.session === "close" && (
              <p className="text-xs text-slate-500 mt-2">Open result: {resultOf(s, g.id, loaded.date)?.openPana}-{panaDigit(resultOf(s, g.id, loaded.date)?.openPana ?? "0")}. Close declares Jodi, Half Sangam and Full Sangam too.</p>
            )}
            {winners && (
              <div className="mt-5">
                <div className="text-sm text-slate-600 mb-2">{winners.length} winning bids · payout <b>{inr(winners.reduce((a, b) => a + b.win, 0))}</b></div>
                <Table head={["#", "Date", "User", "Mobile", "Amount", "Winning Amount", "Game Type", "Choose Number", "Session"]}
                  rows={winners.map((b, i) => { const u = findUser(s, b.userId)!; return [i + 1, fmtDate(b.date), u.name, u.mobile, inr(b.amount), inr(b.win), bidTypeLabel(b), b.value, sessionLabel(b)]; })}
                  empty="No winner for this result" />
              </div>
            )}
          </div>
        )}
      </Card>

      <Card className="mt-5" title="Today Result History">
        <Field label="Result Date" className="max-w-xs mb-4"><input type="date" className="admin-input" value={histDate} onChange={(e) => setHistDate(e.target.value)} /></Field>
        {cat === "main" ? (
          <Table empty="No Data Found" head={["#", "Game Name", "Result Date", "Open Declare Time", "Close Declare Time", "Open Number", "Close Number"]}
            rows={history.map((x, i) => [i + 1, findGame(s, x.gameId)?.name, x.date, fmtStamp(x.openAt), fmtStamp(x.closeAt),
              x.openPana ? <span key="o">{panaDigit(x.openPana)} - {x.openPana}{!x.closePana && del(x.gameId, x.date, "open")}</span> : "—",
              x.closePana ? <span key="c">{panaDigit(x.closePana)} - {x.closePana}{del(x.gameId, x.date, "close")}</span> : "—"])} />
        ) : (
          <Table empty="No Data Found" head={["#", "Game Name", "Result Date", "Declare Time", "Result"]}
            rows={history.map((x, i) => [i + 1, findGame(s, x.gameId)?.name, x.date, fmtStamp(x.openAt),
              <span key="r">{cat === "gali" ? x.jodi : `${x.openPana}-${panaDigit(x.openPana ?? "0")}`}{del(x.gameId, x.date, "open")}</span>])} />
        )}
      </Card>
    </>
  );
}
