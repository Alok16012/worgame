"use client";

import { useState } from "react";
import { editBid, findGame, findUser } from "../lib/engine";
import { fmtDate, fmtTime, inr } from "../lib/format";
import { normalizePana } from "../lib/matka";
import { useStore } from "../lib/store";
import { CAT_TYPES, TYPE_LABEL, type Bid, type GameType, type Session } from "../lib/types";
import { Btn, Field, Modal, useAdmin } from "./ui";

/** Fix a customer's bid placed on the wrong number / market / type, before the result is declared. */
export function EditBidModal({ bid, onClose }: { bid: Bid; onClose: () => void }) {
  const { state: s, attempt } = useStore();
  const { toast } = useAdmin();
  const game = findGame(s, bid.gameId);
  const u = findUser(s, bid.userId);
  const [f, setF] = useState({ gameId: bid.gameId, type: bid.type, session: (bid.session ?? "open") as Session, value: bid.value, amount: String(bid.amount) });
  const sessioned = game?.cat === "main" && f.type !== "jodi" && f.type !== "full_sangam";
  const hint: Partial<Record<GameType, string>> = { single_ank: "0-9", jodi: "00-99", single_pana: "e.g. 123", double_pana: "e.g. 112", triple_pana: "e.g. 777", half_sangam: "pana-digit, e.g. 123-5", full_sangam: "pana-pana, e.g. 123-456", left_digit: "0-9", right_digit: "0-9" };

  const save = () => {
    // Accept panas typed in any order ("321" → "123"), also inside sangam values.
    const value = f.value.trim().split("-").map((p) => (/^\d{3}$/.test(p) ? normalizePana(p) : p)).join("-");
    const r = attempt((d) => editBid(d, bid.id, { gameId: f.gameId, type: f.type, session: sessioned ? f.session : null, value, amount: Number(f.amount) || 0 }));
    if (!r.ok) return toast(r.error, "bad");
    toast("Bid updated", "ok");
    onClose();
  };

  return (
    <Modal title="Edit Bid" onClose={onClose} footer={<><Btn variant="ghost" onClick={onClose}>Close</Btn><Btn onClick={save}>Update</Btn></>}>
      <div className="text-xs text-slate-500 mb-4">{u?.name ?? "Deleted User"} ({u?.mobile ?? "—"}) · placed {fmtDate(bid.date)} {fmtTime(bid.time)} · {game?.name ?? "Game"} {TYPE_LABEL[bid.type]} <b>{bid.value}</b> · {inr(bid.amount)}</div>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Game Name">
          <select className="admin-input" value={f.gameId} onChange={(e) => setF({ ...f, gameId: Number(e.target.value) })}>
            {s.games.filter((g) => !game || g.cat === game.cat).map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </Field>
        <Field label="Game Type">
          <select className="admin-input" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as GameType })}>
            {CAT_TYPES[game?.cat ?? "main"].map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
          </select>
        </Field>
        {sessioned && (
          <Field label="Session">
            <select className="admin-input" value={f.session} onChange={(e) => setF({ ...f, session: e.target.value as Session })}><option value="open">Open</option><option value="close">Close</option></select>
          </Field>
        )}
        <Field label={`Number (${hint[f.type] ?? ""})`}><input className="admin-input" value={f.value} onChange={(e) => setF({ ...f, value: e.target.value.replace(/[^\d-]/g, "") })} /></Field>
        <Field label="Amount"><input className="admin-input" inputMode="numeric" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value.replace(/\D/g, "") })} /></Field>
      </div>
      <p className="text-[11px] text-slate-400 mt-3">If the amount changes, the difference is taken from or returned to the user&apos;s wallet. The win rate follows the new game type.</p>
    </Modal>
  );
}
