"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, CircleDot, Club, Coins, Dices, Layers, Plus, Spade, Trash2, Diamond } from "lucide-react";
import { findGame, marketState, placeBids, validValue, type BidInput } from "../../lib/engine";
import { fmtDate, ymd } from "../../lib/format";
import { byAnk, isPana, normalizePana, numbersFor } from "../../lib/matka";
import { useStore } from "../../lib/store";
import { TYPE_LABEL, type GameType, type Session } from "../../lib/types";
import type { Nav } from "../nav";
import { Header, useSession } from "../ui";

const ICON: Record<GameType, React.ReactNode> = {
  single_ank: <CircleDot size={34} />, jodi: <Layers size={34} />, single_pana: <Spade size={34} />, double_pana: <Coins size={34} />,
  triple_pana: <Club size={34} />, half_sangam: <Dices size={34} />, full_sangam: <Diamond size={34} />,
  left_digit: <ArrowLeft size={34} />, right_digit: <ArrowRight size={34} />,
};

export function GameTypes({ nav, gameId }: { nav: Nav; gameId: number }) {
  const { state } = useStore();
  const g = findGame(state, gameId)!;
  const st = marketState(state, g);
  return (
    <>
      <Header title={g.name} onBack={nav.back} />
      {st.types.length ? (
        <div className="grid grid-cols-3 gap-y-6 px-4 pt-4">
          {st.types.map((t) => (
            <button key={t} onClick={() => nav.push({ name: "bet", gameId, type: t })} className="flex flex-col items-center gap-2 active:scale-95 transition-transform">
              <span className="w-[92px] h-[92px] rounded-full bg-white shadow grid place-items-center"><span className="w-[74px] h-[74px] rounded-full bg-[#f6b52e] grid place-items-center text-[#5b3a00]">{ICON[t]}</span></span>
              <span className="text-[13px] font-bold text-slate-700">{TYPE_LABEL[t]}</span>
            </button>
          ))}
        </div>
      ) : <div className="text-center text-slate-500 mt-20">Market is closed for today</div>}
      {g.cat === "main" && st.types.length > 0 && !st.openOk && <p className="text-center text-xs text-slate-500 mt-8 px-8">Open session is closed. You can still play Single Ank and Pana for the close session.</p>}
    </>
  );
}

export function BetScreen({ nav, gameId, type }: { nav: Nav; gameId: number; type: GameType }) {
  return type === "half_sangam" || type === "full_sangam" ? <SangamScreen nav={nav} gameId={gameId} type={type} /> : <GridScreen nav={nav} gameId={gameId} type={type} />;
}

function useSubmit(gameId: number) {
  const { attempt } = useStore();
  const { user, toast } = useSession();
  return (items: BidInput[]) => {
    const r = attempt((d) => placeBids(d, user.id, gameId, items));
    if (!r.ok) { toast(r.error, "bad"); return false; }
    toast("User Bid Successfully!");
    return true;
  };
}

function SessionPicker({ value, options, onChange }: { value: Session; options: Session[]; onChange: (s: Session) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as Session)} className="bg-white rounded-md shadow px-3 py-1.5 text-sm font-semibold text-slate-700 outline-none">
      {options.map((o) => <option key={o} value={o}>{o.toUpperCase()}</option>)}
    </select>
  );
}

function GridScreen({ nav, gameId, type }: { nav: Nav; gameId: number; type: GameType }) {
  const { state } = useStore();
  const g = findGame(state, gameId)!;
  const st = marketState(state, g);
  const sessioned = g.cat === "main" && type !== "jodi";
  const options: Session[] = st.openOk ? ["open", "close"] : ["close"];
  const [session, setSession] = useState<Session>(options[0]);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const submit = useSubmit(gameId);
  const list = numbersFor(type);
  const groups = useMemo(() => (type.endsWith("_pana") ? byAnk(list) : [{ ank: "", items: list }]), [type, list]);
  const items = Object.entries(amounts).filter(([, a]) => Number(a) > 0).map(([value, a]) => ({ type, session: sessioned ? session : null, value, amount: Number(a) }));
  const total = items.reduce((a, b) => a + b.amount, 0);

  return (
    <>
      <Header title={g.name} onBack={nav.back} />
      <div className="mx-3 ybox px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold text-slate-800">{TYPE_LABEL[type]}</div>
          {sessioned && <SessionPicker value={session} options={options} onChange={setSession} />}
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600 mt-1"><CalendarDays size={15} className="text-[#f6b52e]" />{fmtDate(ymd())}</div>
      </div>
      <div className="px-3 pt-3 pb-28">
        {groups.map((grp) => (
          <div key={grp.ank || "all"}>
            {grp.ank && <div className="flex justify-center my-3"><span className="bg-black text-white font-bold rounded-lg px-4 py-1">{grp.ank}</span></div>}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {grp.items.map((v) => (
                <div key={v} className="flex items-center">
                  <span className="bg-[#f6b52e] text-white font-bold rounded-l-md h-10 min-w-12 px-2 grid place-items-center text-[15px]">{v}</span>
                  <div className="flex-1 flex items-center bg-white rounded-r-full h-10 pl-2 shadow-sm">
                    <span className="text-slate-500">₹</span>
                    <input inputMode="numeric" className="w-full bg-transparent outline-none px-2 text-[15px]" value={amounts[v] ?? ""} onChange={(e) => setAmounts({ ...amounts, [v]: e.target.value.replace(/\D/g, "").slice(0, 6) })} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-[#efefef] px-3 pt-2 pb-4 z-20">
        {items.length > 0 && <div className="flex justify-between text-sm text-slate-600 mb-2 px-1"><span>Total Bids: {items.length}</span><span>Total Amount: {total}</span></div>}
        <button className="ybtn w-full py-3.5 rounded-xl text-lg" disabled={!items.length} onClick={() => { if (submit(items)) setAmounts({}); }}>Submit Bids</button>
      </div>
    </>
  );
}

function SangamScreen({ nav, gameId, type }: { nav: Nav; gameId: number; type: "half_sangam" | "full_sangam" }) {
  const { state } = useStore();
  const { toast } = useSession();
  const g = findGame(state, gameId)!;
  const [session, setSession] = useState<Session>("open");
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [points, setPoints] = useState("");
  const [list, setList] = useState<BidInput[]>([]);
  const submit = useSubmit(gameId);
  const full = type === "full_sangam";
  const labels = full ? ["Enter Open Pana", "Enter Close Pana"] : session === "open" ? ["Enter Open Pana", "Enter Close Digit"] : ["Enter Close Pana", "Enter Open Digit"];

  const add = () => {
    const p1 = normalizePana(a);
    const second = full ? normalizePana(b) : b;
    if (!isPana(p1)) return toast(`${a || "Pana"} is not a valid pana`, "bad");
    if (full ? !isPana(second) : !/^\d$/.test(second)) return toast(full ? `${b || "Close pana"} is not a valid pana` : "Enter one digit (0-9)", "bad");
    const amount = Number(points);
    if (!(amount >= state.settings.minBid)) return toast(`Minimum bid amount is ${state.settings.minBid}`, "bad");
    const item: BidInput = { type, session: full ? null : session, value: `${p1}-${second}`, amount };
    if (!validValue(item.type, item.value, item.session)) return toast("Invalid bid", "bad");
    setList([...list, item]);
    setA(""); setB(""); setPoints("");
  };

  const total = list.reduce((x, y) => x + y.amount, 0);
  return (
    <>
      <Header title={g.name} onBack={nav.back} />
      <div className="mx-3 rounded-lg bg-[#5d5d5d] text-white px-4 py-3">
        <div className="font-bold">{full ? `FULL SANGAM / ${fmtDate(ymd())}` : `Half Sangam ${session === "open" ? "Open" : "Close"}`}</div>
        {!full && (
          <div className="flex items-center justify-between mt-2">
            <div className="flex gap-1 bg-white/15 rounded p-1">
              {(["open", "close"] as Session[]).map((x) => <button key={x} onClick={() => { setSession(x); setA(""); setB(""); }} className={`px-3 py-1 rounded text-sm ${session === x ? "bg-[#f6b52e]" : ""}`}>{x === "open" ? "Open" : "Close"}</button>)}
            </div>
            <span className="text-sm font-semibold">{fmtDate(ymd())}</span>
          </div>
        )}
      </div>
      <div className="px-3 mt-3 space-y-3">
        <input className="w-full bg-transparent border-b border-slate-300 px-1 py-3 outline-none" placeholder={labels[0]} inputMode="numeric" maxLength={3} value={a} onChange={(e) => setA(e.target.value.replace(/\D/g, ""))} />
        <input className="w-full bg-transparent border-b border-slate-300 px-1 py-3 outline-none" placeholder={labels[1]} inputMode="numeric" maxLength={full ? 3 : 1} value={b} onChange={(e) => setB(e.target.value.replace(/\D/g, ""))} />
        <input className="w-full bg-transparent border-b border-slate-300 px-1 py-3 outline-none" placeholder="Enter Points" inputMode="numeric" value={points} onChange={(e) => setPoints(e.target.value.replace(/\D/g, "").slice(0, 6))} />
        <button onClick={add} className="ybtn w-full py-3 rounded-lg flex items-center justify-center gap-1"><Plus size={18} /> Add</button>
        <div className="bg-[#f6b52e] text-white text-sm rounded px-3 py-2 grid grid-cols-[1fr_auto_auto] gap-6"><span>Digit</span><span>Point</span><span>Delete</span></div>
        {list.map((x, i) => (
          <div key={i} className="grid grid-cols-[1fr_auto_auto] gap-6 items-center px-3">
            <span className="flex items-center gap-2"><span className="w-9 h-9 rounded-full bg-[#fde7b0] text-[#8a5a00] text-xs font-bold grid place-items-center">{x.value.split("-")[0]}</span>{x.value}</span>
            <span className="text-sm">{x.amount}</span>
            <button onClick={() => setList(list.filter((_, j) => j !== i))} className="text-rose-600" aria-label="Delete"><Trash2 size={20} /></button>
          </div>
        ))}
      </div>
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-[#efefef] px-3 pt-2 pb-4 z-20">
        <div className="flex justify-between text-sm text-slate-700 mb-2 px-1"><span>Total Bids: {list.length}</span><span>Total Amount: {total}</span></div>
        <button className="ybtn w-full py-3.5 rounded-xl text-lg" disabled={!list.length} onClick={() => { if (submit(list)) setList([]); }}>Submit Bids</button>
      </div>
    </>
  );
}
