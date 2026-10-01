"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, ChevronsRight, CircleDot, Club, Coins, Dices, Diamond, Layers, Plus, Spade, Trash2 } from "lucide-react";
import { findGame, marketState, placeBids, validValue, type BidInput } from "../../lib/engine";
import { ymd } from "../../lib/format";
import { byAnk, isPana, normalizePana, numbersFor } from "../../lib/matka";
import { useStore } from "../../lib/store";
import type { GameType, Session } from "../../lib/types";
import type { Nav } from "../nav";
import { AlertBox, Header, useSession } from "../ui";

const TILE: Record<GameType, [string, string, React.ReactNode]> = {
  single_ank: ["SINGLE", "DIGIT", <CircleDot key="i" size={30} />], jodi: ["JODI", "DIGIT", <Layers key="i" size={30} />],
  single_pana: ["SINGLE", "PANNA", <Spade key="i" size={30} />], double_pana: ["DOUBLE", "PANNA", <Coins key="i" size={30} />],
  triple_pana: ["TRIPLE", "PANNA", <Club key="i" size={30} />], half_sangam: ["HALF", "SANGAM", <Dices key="i" size={30} />],
  full_sangam: ["FULL", "SANGAM", <Diamond key="i" size={30} />], left_digit: ["LEFT", "DIGIT", <ArrowLeft key="i" size={30} />],
  right_digit: ["RIGHT", "DIGIT", <ArrowRight key="i" size={30} />],
};
const title = (t: GameType) => `${TILE[t][0][0]}${TILE[t][0].slice(1).toLowerCase()} ${TILE[t][1][0]}${TILE[t][1].slice(1).toLowerCase()}`;
const dmy = () => ymd().split("-").reverse().join("/");

export function GameTypes({ nav, gameId }: { nav: Nav; gameId: number }) {
  const { state } = useStore();
  const g = findGame(state, gameId)!;
  const st = marketState(state, g);
  return (
    <>
      <Header title={g.name} onBack={nav.back} />
      <div className="text-center text-[#13306f] font-semibold py-3 bg-white border-b border-slate-200">Select Betting Type</div>
      {st.types.length ? (
        <div className="grid grid-cols-2 gap-4 p-4">
          {st.types.map((t) => (
            <button key={t} onClick={() => nav.push({ name: "bet", gameId, type: t })} className="aspect-[1.05] rounded-2xl text-white flex flex-col items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform" style={{ background: "linear-gradient(160deg,#1f45a8,#0d2463)" }}>
              <span className="w-14 h-14 rounded-full bg-white/10 grid place-items-center text-[#f5c542]">{TILE[t][2]}</span>
              <span className="font-bold leading-tight text-center">{TILE[t][0]}<div className="text-[10px] font-semibold tracking-widest text-white/70">{TILE[t][1]}</div></span>
            </button>
          ))}
        </div>
      ) : <div className="text-center text-slate-500 mt-20">Betting is closed for today</div>}
      {g.cat === "main" && st.types.length > 0 && !st.openOk && <p className="text-center text-xs text-slate-500 px-8">Open session is closed. You can still play Single Digit and Panna for the close session.</p>}
    </>
  );
}

export function BetScreen({ nav, gameId, type }: { nav: Nav; gameId: number; type: GameType }) {
  return type === "half_sangam" || type === "full_sangam" ? <SangamScreen nav={nav} gameId={gameId} type={type} /> : <GridScreen nav={nav} gameId={gameId} type={type} />;
}

/** Confirmation step after SUBMIT GAME: rows can be removed; shows wallet before/after deduction. */
function Review({ gameName, items, onRemove, onCancel, onSubmit }: { gameName: string; items: BidInput[]; onRemove: (i: number) => void; onCancel: () => void; onSubmit: () => void }) {
  const { user } = useSession();
  const total = items.reduce((a, b) => a + b.amount, 0);
  const label = (it: BidInput) => (it.session ? `${it.value} (${it.session === "open" ? "Open" : "Close"})` : it.value);
  return (
    <div className="fixed inset-0 z-40 flex justify-center">
      <div className="w-full max-w-[430px] bg-white flex flex-col fadein">
        <div className="bg-[#0d2463] text-white font-semibold px-4 h-14 flex items-center uppercase">{gameName} - {dmy()}</div>
        <div className="flex-1 overflow-y-auto px-4 pt-3">
          <div className="grid grid-cols-[1fr_1fr_40px] text-sm font-semibold text-slate-800 px-2 py-2"><span>Digit</span><span>Amount</span><span /></div>
          {items.map((it, i) => (
            <div key={i} className={`grid grid-cols-[1fr_1fr_40px] items-center text-sm px-2 py-2 rounded ${i % 2 ? "" : "bg-slate-50"}`}>
              <span className="font-semibold">{label(it)}</span><span>{it.amount}</span>
              <button onClick={() => onRemove(i)} className="w-7 h-7 rounded bg-[#e11d48] text-white grid place-items-center" aria-label="Remove"><Trash2 size={14} /></button>
            </div>
          ))}
          <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm text-slate-700 mt-5 px-2">
            <div className="flex justify-between"><span>Total Bet:</span><b>{items.length}</b></div>
            <div className="flex justify-between"><span>Total Bet Amount:</span><b>Rs. {total}</b></div>
            <div className="flex justify-between"><span>Wallet Balance Before Deduction:</span><b className="whitespace-nowrap pl-2">Rs. {user.balance}</b></div>
            <div className="flex justify-between"><span>Wallet Balance after Deduction:</span><b className={`whitespace-nowrap pl-2 ${user.balance - total < 0 ? "text-rose-600" : ""}`}>Rs. {user.balance - total}</b></div>
          </div>
          <p className="text-center text-[#e11d48] text-sm mt-6">*Note: Bets once placed cannot be cancelled*</p>
        </div>
        <div className="grid grid-cols-2 gap-6 p-5">
          <button onClick={onCancel} className="bg-[#0d2463] text-white rounded-lg py-2.5 font-medium">Cancel</button>
          <button onClick={onSubmit} disabled={!items.length} className="bg-[#22e03a] text-white rounded-lg py-2.5 font-semibold disabled:opacity-50">Submit Bet</button>
        </div>
      </div>
    </div>
  );
}

/** Shared submit flow: review → place bids → success or the "Error!" box. */
function useBidFlow(gameId: number) {
  const { attempt } = useStore();
  const { user, toast } = useSession();
  const [review, setReview] = useState<BidInput[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const submit = (onDone: () => void) => {
    if (!review) return;
    const r = attempt((d) => placeBids(d, user.id, gameId, review));
    if (!r.ok) return setError(r.error.startsWith("Insufficient") ? "Something Went Wrong! Insufficient Balance" : r.error);
    setReview(null);
    toast("Bid placed successfully!");
    onDone();
  };
  return { review, setReview, error, setError, submit };
}

function GridScreen({ nav, gameId, type }: { nav: Nav; gameId: number; type: GameType }) {
  const { state } = useStore();
  const g = findGame(state, gameId)!;
  const st = marketState(state, g);
  const sessioned = g.cat === "main" && type !== "jodi";
  const options: Session[] = st.openOk ? ["open", "close"] : ["close"];
  const [session, setSession] = useState<Session>(options[0]);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const flow = useBidFlow(gameId);
  const list = numbersFor(type);
  const groups = useMemo(() => (type.endsWith("_pana") ? byAnk(list) : [{ ank: "", items: list }]), [type, list]);
  // Follow the grid order (Object.entries would put "00" after "78").
  const items: BidInput[] = list.filter((v) => Number(amounts[v]) > 0).map((value) => ({ type, session: sessioned ? session : null, value, amount: Number(amounts[value]) }));

  return (
    <>
      <Header title={g.name} onBack={nav.back} />
      <div className="text-center text-[#13306f] font-semibold py-3 bg-white border-b border-slate-200">{title(type)}</div>
      <div className="px-4 pt-4 pb-28">
        <label className="block text-xs text-slate-500 mb-1">Date</label>
        <input readOnly value={dmy()} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm" />
        {sessioned && (
          <>
            <div className="text-xs text-slate-500 mt-4 mb-2">Choose Session:</div>
            <div className="inline-flex bg-white border border-slate-200 rounded-full p-1">
              {(["open", "close"] as Session[]).map((x) => (
                <button key={x} disabled={!options.includes(x)} onClick={() => setSession(x)} className={`px-5 py-1.5 rounded-full text-sm font-medium disabled:opacity-30 ${session === x ? "bg-[#13306f] text-white" : "text-slate-600"}`}>{x === "open" ? "Open" : "Close"}</button>
              ))}
            </div>
          </>
        )}
        <div className="text-xs text-slate-500 mt-4 mb-2">Choose Bets:</div>
        {groups.map((grp) => (
          <div key={grp.ank || "all"}>
            {grp.ank && <div className="flex justify-center my-3"><span className="bg-[#13306f] text-[#f5c542] font-bold rounded-lg px-4 py-1">{grp.ank}</span></div>}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
              {grp.items.map((v) => (
                <div key={v} className="flex items-center rounded-full bg-white border border-slate-200 overflow-hidden">
                  <span className="bg-[#13306f] text-white font-bold h-9 min-w-11 px-2 grid place-items-center text-sm rounded-full">{v}</span>
                  <input inputMode="numeric" placeholder="Amount" className="w-full bg-transparent outline-none px-3 text-sm" value={amounts[v] ?? ""} onChange={(e) => setAmounts({ ...amounts, [v]: e.target.value.replace(/\D/g, "").slice(0, 6) })} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-20">
        <button onClick={() => (items.length ? flow.setReview(items) : flow.setError("Please enter amount on at least one number"))} className="w-full bg-[#0d2463] text-white font-bold py-4 rounded-t-2xl flex items-center justify-center gap-1 tracking-wide">
          SUBMIT GAME <ChevronsRight size={18} />{items.length > 0 && <span className="ml-2 text-xs font-medium text-[#f5c542]">({items.length} bets · ₹{items.reduce((a, b) => a + b.amount, 0)})</span>}
        </button>
      </div>
      {flow.review && (
        <Review gameName={g.name} items={flow.review}
          onRemove={(i) => { const it = flow.review![i]; flow.setReview(flow.review!.filter((_, j) => j !== i)); setAmounts((a) => { const n = { ...a }; delete n[it.value]; return n; }); }}
          onCancel={() => flow.setReview(null)} onSubmit={() => flow.submit(() => setAmounts({}))} />
      )}
      <AlertBox open={!!flow.error} title="Error!" msg={flow.error ?? ""} onClose={() => flow.setError(null)} />
    </>
  );
}

function SangamScreen({ nav, gameId, type }: { nav: Nav; gameId: number; type: "half_sangam" | "full_sangam" }) {
  const { state } = useStore();
  const g = findGame(state, gameId)!;
  const [session, setSession] = useState<Session>("open");
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [points, setPoints] = useState("");
  const [list, setList] = useState<BidInput[]>([]);
  const [warn, setWarn] = useState<string | null>(null);
  const flow = useBidFlow(gameId);
  const full = type === "full_sangam";
  const labels = full ? ["Open Panna", "Close Panna"] : session === "open" ? ["Open Panna", "Close Digit"] : ["Close Panna", "Open Digit"];

  const add = () => {
    const p1 = normalizePana(a);
    const second = full ? normalizePana(b) : b;
    if (!isPana(p1)) return setWarn(`${a || labels[0]} is not a valid panna`);
    if (full ? !isPana(second) : !/^\d$/.test(second)) return setWarn(full ? `${b || "Close panna"} is not a valid panna` : "Enter one digit (0-9)");
    const amount = Number(points);
    if (!(amount >= state.settings.minBid)) return setWarn(`Minimum bid amount is ${state.settings.minBid}`);
    const item: BidInput = { type, session: full ? null : session, value: `${p1}-${second}`, amount };
    if (!validValue(item.type, item.value, item.session)) return setWarn("Invalid bid");
    setList([...list, item]);
    setA(""); setB(""); setPoints("");
  };
  const field = "w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 outline-none";

  return (
    <>
      <Header title={g.name} onBack={nav.back} />
      <div className="text-center text-[#13306f] font-semibold py-3 bg-white border-b border-slate-200">{title(type)}</div>
      <div className="px-4 pt-4 pb-28 space-y-3">
        <div><label className="block text-xs text-slate-500 mb-1">Date</label><input readOnly value={dmy()} className={field} /></div>
        {!full && (
          <div>
            <div className="text-xs text-slate-500 mb-2">Choose Session:</div>
            <div className="inline-flex bg-white border border-slate-200 rounded-full p-1">
              {(["open", "close"] as Session[]).map((x) => <button key={x} onClick={() => { setSession(x); setA(""); setB(""); }} className={`px-5 py-1.5 rounded-full text-sm font-medium ${session === x ? "bg-[#13306f] text-white" : "text-slate-600"}`}>{x === "open" ? "Open" : "Close"}</button>)}
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-xs text-slate-500 mb-1">{labels[0]}</label><input className={field} inputMode="numeric" maxLength={3} value={a} onChange={(e) => setA(e.target.value.replace(/\D/g, ""))} /></div>
          <div><label className="block text-xs text-slate-500 mb-1">{labels[1]}</label><input className={field} inputMode="numeric" maxLength={full ? 3 : 1} value={b} onChange={(e) => setB(e.target.value.replace(/\D/g, ""))} /></div>
        </div>
        <div><label className="block text-xs text-slate-500 mb-1">Points</label><input className={field} inputMode="numeric" placeholder="Amount" value={points} onChange={(e) => setPoints(e.target.value.replace(/\D/g, "").slice(0, 6))} /></div>
        <button onClick={add} className="ybtn w-full py-3 rounded-lg flex items-center justify-center gap-1"><Plus size={18} /> Add</button>
        {list.length > 0 && (
          <div className="ybox overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_40px] gap-4 bg-[#13306f] text-white text-sm px-3 py-2"><span>Digit</span><span>Points</span><span /></div>
            {list.map((x, i) => (
              <div key={i} className="grid grid-cols-[1fr_auto_40px] gap-4 items-center px-3 py-2 border-b border-slate-100 last:border-0 text-sm">
                <span className="font-semibold">{x.value}{x.session ? ` (${x.session === "open" ? "Open" : "Close"})` : ""}</span><span>{x.amount}</span>
                <button onClick={() => setList(list.filter((_, j) => j !== i))} className="w-7 h-7 rounded bg-[#e11d48] text-white grid place-items-center" aria-label="Remove"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-20">
        <button onClick={() => (list.length ? flow.setReview(list) : setWarn("Please add at least one bid"))} className="w-full bg-[#0d2463] text-white font-bold py-4 rounded-t-2xl flex items-center justify-center gap-1 tracking-wide">
          SUBMIT GAME <ChevronsRight size={18} />{list.length > 0 && <span className="ml-2 text-xs font-medium text-[#f5c542]">({list.length} bets · ₹{list.reduce((x, y) => x + y.amount, 0)})</span>}
        </button>
      </div>
      {flow.review && <Review gameName={g.name} items={flow.review} onRemove={(i) => { flow.setReview(flow.review!.filter((_, j) => j !== i)); setList((l) => l.filter((_, j) => j !== i)); }} onCancel={() => flow.setReview(null)} onSubmit={() => flow.submit(() => setList([]))} />}
      <AlertBox open={!!flow.error || !!warn} title={flow.error ? "Error!" : "Alert!"} msg={flow.error ?? warn ?? ""} onClose={() => { flow.setError(null); setWarn(null); }} />
    </>
  );
}
