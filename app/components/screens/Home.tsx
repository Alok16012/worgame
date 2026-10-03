"use client";

import { useEffect, useState } from "react";
import { ArrowDownToLine, BarChart3, Play, PlusCircle, Send, Star } from "lucide-react";
import { displayResult, findGame, isOffDay, marketState, resultOf } from "../../lib/engine";
import { addDays, fmtDate, fmtTime, ymd } from "../../lib/format";
import { resultText } from "../../lib/matka";
import { useStore } from "../../lib/store";
import type { Game } from "../../lib/types";
import type { Nav } from "../nav";
import { Header, useSession, whatsappLink } from "../ui";

// Ticks every 30 s so cards flip from Play → closed when a session's time passes.
function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(t);
  }, []);
  return now;
}

/** Market card: white OPEN/CLOSE times, white name, gold result, green ▶ when open, red ▶ when closed. */
export function MarketCard({ g, nav, now }: { g: Game; nav: Nav; now: Date }) {
  const { state } = useStore();
  const { toast } = useSession();
  const st = marketState(state, g, now);
  const holiday = isOffDay(g, now);
  const text = resultText(g.cat, displayResult(state, g, now));
  return (
    <div className="rounded-xl overflow-hidden border border-white/10" style={{ background: "linear-gradient(180deg,#173a8c,#10296b)" }}>
      <div className="bg-[#0a1a48] text-white text-[11px] font-semibold px-3 py-1.5 flex justify-between tracking-wide">
        {g.cat === "main" ? <><span>OPEN : {fmtTime(g.open)}</span><span>CLOSE : {fmtTime(g.close)}</span></> : <><span>RESULT TIME</span><span>{fmtTime(g.close)}</span></>}
      </div>
      <div className="flex items-center gap-3 px-3 py-3">
        <button onClick={() => nav.push({ name: "chart", gameId: g.id })} className="w-10 h-10 rounded-lg bg-white/10 grid place-items-center text-[#f5c542]" aria-label="Chart"><BarChart3 size={22} /></button>
        <div className="flex-1 text-center min-w-0">
          <div className="text-[15px] font-bold text-white truncate tracking-wide">{g.name}</div>
          {holiday ? <div className="inline-block mt-0.5 px-3 py-0.5 rounded-full bg-[#e11d2e]/90 text-white text-xs font-bold tracking-wider">HOLIDAY TODAY</div>
            : <div className="gold text-xl font-extrabold tracking-[2px]">{text}</div>}
        </div>
        <button
          onClick={() => (st.anyOk ? nav.push({ name: "market", gameId: g.id }) : toast(holiday ? `${g.name} is closed today (holiday)` : "Betting is closed for today", "bad"))}
          className={`w-11 h-11 rounded-full grid place-items-center text-white shadow-lg ${st.anyOk ? "bg-[#22c55e]" : "bg-[#e11d2e]"}`} aria-label={st.anyOk ? "Play" : "Closed"}>
          <Play size={20} fill="currentColor" className="ml-0.5" />
        </button>
      </div>
    </div>
  );
}

function Pill({ icon, label, onClick, href }: { icon: React.ReactNode; label: string; onClick?: () => void; href?: string }) {
  const cls = "flex items-center gap-2 rounded-full bg-white px-3 py-2.5 text-[#13306f] font-semibold text-sm shadow";
  const body = <><span className="w-7 h-7 rounded-full bg-[#13306f] text-[#f5c542] grid place-items-center shrink-0">{icon}</span><span className="flex-1 text-center">{label}</span></>;
  return href ? <a href={href} target="_blank" rel="noreferrer" className={cls}>{body}</a> : <button onClick={onClick} className={cls}>{body}</button>;
}

export function Home({ nav, openMenu }: { nav: Nav; openMenu: () => void }) {
  const { state } = useStore();
  const now = useClock();
  const s = state.settings;
  const [slide, setSlide] = useState(0);
  useEffect(() => {
    if (s.sliders.length < 2) return;
    const t = window.setInterval(() => setSlide((i) => i + 1), 3500);
    return () => window.clearInterval(t);
  }, [s.sliders.length]);
  const b = s.sliders.length ? s.sliders[slide % s.sliders.length] : null;
  const hindi = !!b && /[\u0900-\u097F]/.test(b.title); // Devanagari title, e.g. "शुभ लाभ"

  return (
    <>
      <Header title={s.appName} onMenu={openMenu} brand />
      <div className="marquee overflow-hidden whitespace-nowrap text-[#f5c542] font-semibold text-sm py-1.5 bg-black/20"><span>{s.marquee}</span></div>
      <div className="px-3 pt-3 space-y-3">
        {b && (
          <div className="relative rounded-xl overflow-hidden aspect-[2.2] px-5 py-5 flex flex-col justify-end border border-[#f5c542]/30" style={{ background: b.img ? `center / cover no-repeat url(${b.img})` : `linear-gradient(135deg,${b.c1},${b.c2})` }}>
            {!b.img && <>
              <div className={`font-extrabold drop-shadow ${hindi ? "gold text-4xl" : "text-2xl text-white"}`} style={hindi ? { fontFamily: "var(--font-yatra)" } : undefined}>{b.title}{hindi && <span className="ml-2 text-2xl">🪔</span>}</div>
              <div className="text-sm text-white/85">{b.sub}</div>
            </>}
            <div className="absolute bottom-3 right-4 flex gap-1">{s.sliders.map((x, i) => <span key={x.id} className={`h-1.5 rounded-full ${i === slide % s.sliders.length ? "w-4 bg-white" : "w-1.5 bg-white/40"}`} />)}</div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Pill icon={<ArrowDownToLine size={15} />} label="Withdraw" onClick={() => nav.push({ name: "withdraw" })} />
          <Pill icon={<PlusCircle size={15} />} label="Add Fund" onClick={() => nav.push({ name: "deposit" })} />
          <Pill icon={<span className="text-[13px] font-bold">W</span>} label="WhatsApp" href={whatsappLink(s.contact.whatsapp)} />
          <Pill icon={<Play size={13} fill="currentColor" />} label="Gali Disawar" onClick={() => nav.push({ name: "list", cat: "gali" })} />
          <Pill icon={<Star size={15} />} label="Starline" onClick={() => nav.push({ name: "list", cat: "starline" })} />
          <Pill icon={<Send size={14} />} label="Telegram" href={`https://t.me/${s.contact.telegram.replace("@", "")}`} />
        </div>
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
      <Header title={cat === "starline" ? "Starline" : "Gali Disawar"} onBack={nav.back} />
      <div className="px-3 pt-3 space-y-3">
        <div className="rounded-xl px-4 py-3 text-sm text-white/80 bg-white/10">
          {cat === "starline" ? "One result every hour. Play Single Digit and Panna — result like 123-6." : "Play Left Digit, Right Digit or Jodi. Result is a 2-digit jodi."}
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
      <div className="px-3 pt-3">
        <div className="ybox overflow-hidden">
          <div className="grid grid-cols-2 bg-[#13306f] text-white font-semibold text-sm"><div className="px-4 py-2">Date</div><div className="px-4 py-2 text-center">Result</div></div>
          {days.map((d) => {
            const r = resultOf(state, gameId, d);
            return <div key={d} className="grid grid-cols-2 border-b border-slate-100 text-sm"><div className="px-4 py-2.5 text-slate-600">{fmtDate(d)}</div><div className={`px-4 py-2.5 text-center font-bold tracking-wider ${r ? "text-[#13306f]" : "text-slate-300"}`}>{resultText(g.cat, r)}</div></div>;
          })}
        </div>
      </div>
    </>
  );
}
