"use client";

import { useState } from "react";
import { findGame, findUser, revertBids } from "../../lib/engine";
import { fmtTime, inr, sum, ymd } from "../../lib/format";
import { useStore } from "../../lib/store";
import { CAT_LABEL, type Cat } from "../../lib/types";
import { bidTypeLabel, GameSelect, sessionLabel } from "../common";
import { Btn, Card, DataTable, Field, useAdmin } from "../ui";

/** Refund all pending bids of a market for a date — used when a market is cancelled. */
export function BidRevert({ cat }: { cat: Cat }) {
  const { state: s, attempt } = useStore();
  const { confirm, toast } = useAdmin();
  const [draft, setDraft] = useState<{ date: string; game: number | "" }>({ date: ymd(), game: "" });
  const [f, setF] = useState(draft);
  const list = f.game ? s.bids.filter((b) => b.gameId === f.game && b.date === f.date && b.status === "pending") : [];

  const run = async () => {
    if (!f.game || !list.length) return;
    const g = findGame(s, f.game)!;
    const ok = await confirm({ title: "Bid Revert", body: <>Revert <b>{list.length}</b> pending bids of <b>{g.name}</b> and refund <b>{inr(sum(list, (b) => b.amount))}</b> to users?</>, ok: "Revert", tone: "red" });
    if (!ok) return;
    const r = attempt((d) => revertBids(d, f.game as number, f.date));
    if (r.ok) toast(`${r.value.count} bids reverted · ${inr(r.value.total)} refunded`, "ok"); else toast(r.error, "bad");
  };

  return (
    <Card title={cat === "main" ? "Bid Revert" : `${CAT_LABEL[cat]} Bid Revert`}>
      <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-4 items-end mb-4">
        <Field label="Date"><input type="date" className="admin-input" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} /></Field>
        <Field label="Game Name"><GameSelect cat={cat} all="-Select Game Name-" value={draft.game} onChange={(v) => setDraft({ ...draft, game: v })} /></Field>
        <Btn variant="dark" onClick={() => setF(draft)}>Submit</Btn>
      </div>
      {f.game !== "" && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="text-sm text-slate-600">{list.length} pending bids · {inr(sum(list, (b) => b.amount))}</div>
            <Btn variant="red" disabled={!list.length} onClick={run}>Revert All Bids</Btn>
          </div>
          <DataTable head={["#", "User Name", "Mobile", "Game Type", "Session", "Number", "Amount", "Time"]}
            rows={list.map((b, i) => { const u = findUser(s, b.userId); return [i + 1, u?.name ?? "Deleted User", u?.mobile ?? "—", bidTypeLabel(b), sessionLabel(b), b.value, inr(b.amount), fmtTime(b.time)]; })}
            text={list.map((b) => findUser(s, b.userId)?.name ?? "Deleted User")} />
        </>
      )}
    </Card>
  );
}
