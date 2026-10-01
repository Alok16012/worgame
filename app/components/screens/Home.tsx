"use client";

import { useEffect, useState } from "react";
import { Globe, IndianRupee, MessageCircle, Send, Star, Wallet } from "lucide-react";
import { findGame, marketState, resultOf } from "../../lib/engine";
import { addDays, fmtDate, fmtTime, ymd } from "../../lib/format";
import { resultText } from "../../lib/matka";
import { useStore } from "../../lib/store";
import type { Game } from "../../lib/types";
import type { Nav } from "../nav";
import { Header, whatsappLink } from "../ui";

// Ticks every 30 s so cards flip from Play → Close when a session's time passes.
function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(t);
  }, []);
  return now;
}

/** Market card exactly like the app: yellow OPEN/CLOSE strip, Chart, name + result, Play/Close. */
export function MarketCard({ g, nav, now }: { g: Game; nav: Nav; now: Date }) {
  const { state } = useStore();
  const st = marketState(state, g, now);
  const r = resultOf(state, g.id, ymd(now));
  const text = resultText(g.cat, r);
  const declared = text.replace(/[*\-]/g, "").length > 0;
  return (
    <div className="ybox overflow-hidden">
      <div className="bg-[#f6b52e] text-white text-[13px] font-semibold px-3 py-1 flex justify-between">
        {g.cat === "main" ? <><span>OPEN : {g.open}</span><span>CLOSE : {g.close}</span></> : <><span>RESULT TIME</span><span>{fmtTime(g.close)}</span></>}
      </div>
      <div className="flex items-center gap-3 px-3 py-3">
        <button onClick={() => nav.push({ name: "chart", gameId: g.id })} className="border border-[#f6b52e] text-[#f6b52e] rounded px-4 py-1 text-sm">Chart</button>
        <div className="flex-1 text-center min-w-0">
          <div className="text-[17px] text-slate-800 truncate">{g.name}</div>
          <div className={`tracking-[2px] font-bold ${declared ? "text-[#f6b52e] text-xl" : "text-[#f6b52e]/80 text-sm"}`}>{text}</div>
        </div>
        {st.anyOk
          ? <button onClick={() => nav.push({ name: "market", gameId: g.id })} className="ybtn rounded px-5 py-1.5">Play</button>
          : <button disabled className="bg-[#9b9b9b] text-white rounded px-4 py-1.5">Close</button>}
      </div>
    </div>
  );
}

export function Home({ nav, openMenu }: { nav: Nav; openMenu: () => void }) {
  const { state } = useStore();
  const now = useClock();
  const s = state.settings;
  const golden = s.golden.date === ymd(now) ? s.golden.anks : [];
  return (
    <>
      <Header title={s.appName} onMenu={openMenu} />
      <div className="marquee overflow-hidden whitespace-nowrap text-[#e11d48] font-bold text-[17px] -mt-1 mb-2"><span>{s.marquee}</span></div>
      <div className="px-3 space-y-3">
        <a href={s.website} target="_blank" rel="noreferrer" className="ybtn rounded-xl flex items-center justify-center gap-2 py-3 !text-[#1d4ed8] underline text-[15px] whitespace-nowrap">{s.appName} Official Website : Visit Now <Globe size={20} className="text-[#1d4ed8]" /></a>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => nav.push({ name: "deposit" })} className="flex items-stretch rounded overflow-hidden">
            <span className="bg-white px-3 grid place-items-center text-slate-700"><Wallet size={20} /></span><span className="flex-1 bg-[#f6b52e] text-[#7c4a03] font-semibold text-sm py-2.5 text-left pl-3 whitespace-nowrap">DEPOSIT FUND</span>
          </button>
          <button onClick={() => nav.push({ name: "withdraw" })} className="flex items-stretch rounded overflow-hidden">
            <span className="bg-white px-3 grid place-items-center text-slate-700"><IndianRupee size={20} /></span><span className="flex-1 bg-[#f6b52e] text-[#7c4a03] font-semibold text-sm py-2.5 text-left pl-3">WITHDRAW</span>
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => nav.push({ name: "list", cat: "starline" })} className="flex items-stretch rounded overflow-hidden border-2 border-[#f6b52e]">
            <span className="bg-white px-3 grid place-items-center text-slate-700"><Star size={20} /></span><span className="flex-1 bg-[#f6b52e] text-[#7c4a03] font-bold text-sm py-2.5 text-left pl-3 whitespace-nowrap">STARLINE</span>
          </button>
          <button onClick={() => nav.push({ name: "list", cat: "gali" })} className="flex items-stretch rounded overflow-hidden border-2 border-[#f6b52e]">
            <span className="bg-white px-3 grid place-items-center text-slate-700"><Star size={20} /></span><span className="flex-1 bg-[#f6b52e] text-[#7c4a03] font-bold text-sm py-2.5 text-left pl-3 whitespace-nowrap">GALI DESAWAR</span>
          </button>
        </div>
        <div className="flex justify-between px-2 text-[17px] text-slate-800">
          <a href={whatsappLink(s.contact.whatsapp)} target="_blank" rel="noreferrer" className="flex items-center gap-1.5"><MessageCircle size={22} className="text-white bg-emerald-500 rounded-full p-0.5" /> Whatsapp Number</a>
          <a href={`https://t.me/${s.contact.telegram.replace("@", "")}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5"><Send size={20} className="text-white bg-sky-500 rounded-full p-1" /> Telegram</a>
        </div>
        {golden.length > 0 && (
          <div className="ybox px-4 py-2.5 flex items-center gap-3"><span className="font-semibold text-slate-700">Golden Ank</span>{golden.map((a) => <span key={a} className="w-8 h-8 rounded-full bg-[#f6b52e] text-white font-bold grid place-items-center">{a}</span>)}</div>
        )}
        {state.games.filter((g) => g.cat === "main" && g.active).map((g) => <MarketCard key={g.id} g={g} nav={nav} now={now} />)}
      </div>
    </>
  );
}

export function MarketList({ nav, cat }: { nav: Nav; cat: "starline" | "gali" }) {
  const { state } = useStore();
  const now = useClock();
  return (
    <>
      <Header title={cat === "starline" ? "Starline" : "Gali Desawar"} onBack={nav.back} />
      <div className="px-3 space-y-3">
        <div className="ybox px-4 py-3 text-sm text-slate-600">
          {cat === "starline" ? "One result every hour. Play Single Ank and Pana — result like 123-6." : "Play Left Digit, Right Digit or Jodi. Result is a 2-digit jodi."}
        </div>
        {state.games.filter((g) => g.cat === cat && g.active).map((g) => <MarketCard key={g.id} g={g} nav={nav} now={now} />)}
      </div>
    </>
  );
}

export function Chart({ nav, gameId }: { nav: Nav; gameId: number }) {
  const { state } = useStore();
  const g = findGame(state, gameId)!;
  const days = Array.from({ length: 30 }, (_, i) => addDays(-i));
  return (
    <>
      <Header title={`${g.name} Chart`} onBack={nav.back} />
      <div className="px-3">
        <div className="ybox overflow-hidden">
          <div className="grid grid-cols-2 bg-[#f6b52e] text-white font-semibold text-sm"><div className="px-4 py-2">Date</div><div className="px-4 py-2 text-center">Result</div></div>
          {days.map((d) => {
            const r = resultOf(state, gameId, d);
            return <div key={d} className="grid grid-cols-2 border-b border-slate-100 text-sm"><div className="px-4 py-2.5 text-slate-600">{fmtDate(d)}</div><div className={`px-4 py-2.5 text-center font-bold tracking-wider ${r ? "text-slate-800" : "text-slate-300"}`}>{resultText(g.cat, r)}</div></div>;
          })}
        </div>
      </div>
    </>
  );
}
