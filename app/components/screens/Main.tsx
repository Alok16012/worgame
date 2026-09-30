"use client";

import { useEffect, useState } from "react";
import { Bell, ChevronRight, Clock, Megaphone, Plus, Trophy, X } from "lucide-react";
import { findGame, marketStatus, placeBids, resultOf } from "../../lib/engine";
import { addDays, fmtDate, fmtTime, inr, sum, ymd } from "../../lib/format";
import { useNow, useStore } from "../../lib/store";
import { ANKS, CAT_ICON, CAT_LABEL, CATS, type Cat, type Game } from "../../lib/types";
import type { Nav } from "../nav";
import { Avatar, Ball, Header, MarketPill, Money, useSession } from "../ui";

function MarketRow({ g, nav }: { g: Game; nav: Nav }) {
  const { state } = useStore();
  const now = useNow();
  const st = marketStatus(state, g, ymd(now), now);
  const r = resultOf(state, g.id, ymd(now));
  return (
    <div className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0">
      <div className="w-11 h-11 rounded-2xl grid place-items-center text-xl shrink-0 bg-brand-500/15">{CAT_ICON[g.cat]}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2"><span className="font-semibold truncate">{g.name}</span><MarketPill s={st} /></div>
        <div className="text-[11px] text-[var(--ink-soft)] flex items-center gap-1 mt-0.5"><Clock size={11} /> {fmtTime(g.open)} – {fmtTime(g.close)} · Rate {g.rate}x</div>
      </div>
      {r ? <Ball n={r.ank} size={34} />
        : st === "open" ? <button onClick={() => nav.push({ name: "bid", gameId: g.id })} className="btn-brand px-4 py-2 rounded-xl text-xs">Play Now</button>
        : <span className="text-[11px] text-[var(--ink-mute)] w-16 text-right">{st === "upcoming" ? `Opens ${fmtTime(g.open)}` : "Awaiting result"}</span>}
    </div>
  );
}

export function Home({ nav }: { nav: Nav }) {
  const { state } = useStore();
  const { user } = useSession();
  const now = useNow();
  const [slide, setSlide] = useState(0);
  const sliders = state.settings.sliders;
  useEffect(() => {
    if (sliders.length < 2) return;
    const t = window.setInterval(() => setSlide((i) => i + 1), 4000);
    return () => window.clearInterval(t);
  }, [sliders.length]);
  const b = sliders.length ? sliders[slide % sliders.length] : null;
  const notice = state.notices.filter((n) => !n.userId || n.userId === user.id).slice(-1)[0];
  const golden = state.settings.golden;
  const h = now.getHours();
  const unread = state.notices.filter((n) => (!n.userId || n.userId === user.id) && n.date === ymd()).length;

  return (
    <div className="px-4 pt-5">
      <div className="flex items-center gap-3">
        <Avatar name={user.name} size={42} />
        <div className="flex-1">
          <div className="text-[11px] text-[var(--ink-soft)]">{h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening"}</div>
          <div className="font-semibold">Hello, {user.name.split(" ")[0]} 👋</div>
        </div>
        <button onClick={() => nav.push({ name: "notifications" })} className="relative w-10 h-10 rounded-full bg-white/5 grid place-items-center" aria-label="Notifications">
          <Bell size={19} />
          {unread > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-[10px] font-bold grid place-items-center">{unread}</span>}
        </button>
      </div>

      <div className="wallet-card p-4 mt-5 flex items-center justify-between">
        <div><div className="text-xs opacity-80">Wallet Balance</div><Money n={user.balance} className="text-3xl font-extrabold" /></div>
        <button onClick={() => nav.push({ name: "addfunds" })} className="bg-white text-brand-700 font-semibold text-sm px-4 py-2 rounded-xl flex items-center gap-1"><Plus size={16} /> Deposit</button>
      </div>

      <div className="grid grid-cols-4 gap-2 mt-4">
        {[
          { l: "Play", i: "🎲", go: () => nav.reset({ name: "games" }) },
          { l: "Wallet", i: "👛", go: () => nav.reset({ name: "wallet" }) },
          { l: "Results", i: "🏆", go: () => nav.push({ name: "results" }) },
          { l: "Support", i: "💬", go: () => nav.push({ name: "support" }) },
        ].map((q) => (
          <button key={q.l} onClick={q.go} className="card py-3 flex flex-col items-center gap-1.5 text-[11px]">
            <span className="w-10 h-10 rounded-full bg-brand-600 grid place-items-center text-lg">{q.i}</span>{q.l}
          </button>
        ))}
      </div>

      {b && (
        <button onClick={() => setSlide((i) => i + 1)} className="w-full text-left rounded-2xl p-4 mt-4 min-h-28 flex flex-col justify-end relative overflow-hidden" style={{ background: `linear-gradient(135deg,${b.c1},${b.c2})` }}>
          <div className="text-lg font-bold">{b.title}</div>
          <div className="text-xs opacity-85">{b.sub}</div>
          <div className="absolute bottom-3 right-4 flex gap-1">{sliders.map((x, i) => <span key={x.id} className={`h-1.5 rounded-full ${i === slide % sliders.length ? "w-4 bg-white" : "w-1.5 bg-white/40"}`} />)}</div>
        </button>
      )}

      {golden.date === ymd() && golden.anks.length > 0 && (
        <div className="rounded-2xl p-4 mt-4 border border-gold-500/40" style={{ background: "linear-gradient(135deg,#3b2a05,#6b4a00)" }}>
          <div className="text-sm font-semibold text-gold-300">⭐ Today&apos;s Golden Ank</div>
          <div className="flex gap-2 mt-2">{golden.anks.map((a) => <Ball key={a} n={a} size={38} />)}</div>
        </div>
      )}

      {notice && (
        <button onClick={() => nav.push({ name: "notifications" })} className="card w-full text-left p-4 mt-4 flex gap-3">
          <Megaphone size={18} className="text-brand-300 shrink-0 mt-0.5" />
          <div className="min-w-0"><div className="font-semibold text-sm">{notice.title}</div><div className="text-xs text-[var(--ink-soft)] line-clamp-2">{notice.msg}</div></div>
        </button>
      )}

      <div className="flex items-center justify-between mt-6 mb-2">
        <div className="font-semibold">Today&apos;s Markets</div>
        <button onClick={() => nav.reset({ name: "games" })} className="text-xs text-brand-300 flex items-center">View all <ChevronRight size={14} /></button>
      </div>
      <div className="card px-4">
        {state.games.filter((g) => g.active && g.cat !== "starline").map((g) => <MarketRow key={g.id} g={g} nav={nav} />)}
      </div>

      <div className="flex items-center justify-between mt-6 mb-2">
        <div className="font-semibold">⭐ Starline</div>
        <button onClick={() => nav.reset({ name: "games", cat: "starline" })} className="text-xs text-brand-300 flex items-center">All slots <ChevronRight size={14} /></button>
      </div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
        {state.games.filter((g) => g.active && g.cat === "starline").map((g) => {
          const st = marketStatus(state, g, ymd(now), now);
          const r = resultOf(state, g.id, ymd(now));
          return (
            <button key={g.id} disabled={st !== "open"} onClick={() => nav.push({ name: "bid", gameId: g.id })} className="card shrink-0 w-28 p-3 text-center disabled:opacity-60">
              <div className="text-xs text-[var(--ink-soft)]">{fmtTime(g.close)}</div>
              <div className="my-2 flex justify-center">{r ? <Ball n={r.ank} size={34} /> : <div className="w-[34px] h-[34px] rounded-full bg-white/5 grid place-items-center text-[var(--ink-mute)]">?</div>}</div>
              <MarketPill s={st} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Games({ nav, initial }: { nav: Nav; initial?: Cat }) {
  const { state } = useStore();
  const [cat, setCat] = useState<Cat>(initial ?? "main");
  const list = state.games.filter((g) => g.cat === cat && g.active);
  return (
    <>
      <Header title="Choose Game" sub="Pick an open market to play" right={<button onClick={() => nav.push({ name: "results" })} className="btn-ghost rounded-xl px-3 py-1.5 text-xs flex items-center gap-1"><Trophy size={14} /> Results</button>} />
      <div className="px-4">
        <div className="grid grid-cols-3 gap-2">
          {CATS.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`rounded-2xl py-3 text-xs font-semibold flex flex-col items-center gap-1 ${cat === c ? "bg-white text-brand-700" : "card text-[var(--ink-soft)]"}`}>
              <span className="text-lg">{CAT_ICON[c]}</span>{CAT_LABEL[c]}
            </button>
          ))}
        </div>
        <div className="card px-4 mt-4">
          {list.length ? list.map((g) => <MarketRow key={g.id} g={g} nav={nav} />) : <div className="py-8 text-center text-sm text-[var(--ink-mute)]">No markets in this category</div>}
        </div>
        <div className="text-[11px] text-[var(--ink-mute)] mt-4 text-center">Pick an Ank (0–9). If it matches the result you win Bid × Rate.</div>
      </div>
    </>
  );
}

export function PlaceBid({ nav, gameId }: { nav: Nav; gameId: number }) {
  const { state, attempt } = useStore();
  const { user, toast } = useSession();
  const now = useNow(5000);
  const g = findGame(state, gameId);
  const [anks, setAnks] = useState<number[]>([]);
  const [amount, setAmount] = useState("");
  if (!g) return <Header title="Market not found" onBack={nav.back} />;
  const st = marketStatus(state, g, ymd(now), now);
  const amt = Number(amount) || 0;
  const total = amt * anks.length;
  const mine = state.bids.filter((b) => b.userId === user.id && b.gameId === g.id && b.date === ymd()).slice().reverse();

  const place = () => {
    const r = attempt((d) => placeBids(d, user.id, g.id, anks, amt));
    if (!r.ok) return toast(r.error);
    toast(`✅ ${anks.length} bid${anks.length > 1 ? "s" : ""} placed · ${inr(r.value)}`);
    setAnks([]);
  };

  return (
    <>
      <Header title={g.name} sub={`${CAT_LABEL[g.cat]} · ${fmtTime(g.open)} – ${fmtTime(g.close)}`} onBack={nav.back} right={<MarketPill s={st} />} />
      <div className="px-4">
        <div className="card p-4 flex items-center justify-between">
          <div><div className="text-[11px] text-[var(--ink-soft)]">Current rate</div><div className="font-bold text-lg">{g.rate}x <span className="text-xs font-normal text-[var(--ink-soft)]">₹10 wins {inr(10 * g.rate)}</span></div></div>
          <div className="text-right"><div className="text-[11px] text-[var(--ink-soft)]">Wallet</div><Money n={user.balance} className="font-bold" /></div>
        </div>

        <div className="flex items-center justify-between mt-5 mb-2">
          <div className="text-sm font-semibold">Select Number (Ank)</div>
          {anks.length > 0 && <button onClick={() => setAnks([])} className="text-xs text-[var(--ink-soft)] flex items-center gap-0.5"><X size={12} /> Clear</button>}
        </div>
        <div className="grid grid-cols-5 gap-2">
          {ANKS.map((a) => {
            const on = anks.includes(a), off = !g.numbers.includes(a);
            return (
              <button key={a} disabled={off || st !== "open"} onClick={() => setAnks(on ? anks.filter((x) => x !== a) : [...anks, a].sort())}
                className={`aspect-square rounded-2xl text-2xl font-extrabold border transition-all disabled:opacity-25 ${on ? "bg-brand-600 border-brand-300 shadow-[0_0_0_3px_rgba(139,114,255,.35)] scale-105" : "bg-white/5 border-white/10"}`}>{a}</button>
            );
          })}
        </div>
        <div className="text-[11px] text-[var(--ink-mute)] mt-2">Tip: select several Anks to place the same amount on each.</div>

        <div className="text-sm font-semibold mt-5 mb-2">Amount per Ank <span className="text-[11px] font-normal text-[var(--ink-soft)]">(min {inr(state.settings.minBid)})</span></div>
        <input className="field text-lg" inputMode="numeric" placeholder="₹ Enter amount" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, "").slice(0, 6))} />
        <div className="flex gap-2 mt-2 flex-wrap">
          {[10, 50, 100, 500, 1000].map((v) => <button key={v} onClick={() => setAmount(String(v))} className="btn-ghost rounded-xl px-3 py-1.5 text-xs">₹{v}</button>)}
        </div>

        <div className="card p-4 mt-5 space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-[var(--ink-soft)]">Anks</span><b>{anks.length ? anks.join(", ") : "—"}</b></div>
          <div className="flex justify-between"><span className="text-[var(--ink-soft)]">Total Amount</span><b>{inr(total)}</b></div>
          <div className="flex justify-between"><span className="text-[var(--ink-soft)]">You win (if one Ank matches)</span><b className="text-emerald-300">{inr(amt * g.rate)}</b></div>
        </div>
        <button className="btn-brand w-full py-3.5 rounded-2xl mt-4" disabled={st !== "open" || !anks.length || !amt} onClick={place}>
          {st !== "open" ? `Market ${st}` : total > user.balance ? "Insufficient balance" : `Place Bid · ${inr(total)}`}
        </button>
        {total > user.balance && st === "open" && <button onClick={() => nav.push({ name: "addfunds" })} className="w-full text-xs text-brand-300 mt-2">+ Add money to wallet</button>}

        {mine.length > 0 && (
          <>
            <div className="text-sm font-semibold mt-6 mb-2">Your bids in this market today</div>
            <div className="card px-4">
              {mine.map((b) => (
                <div key={b.id} className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
                  <Ball n={b.ank} size={30} tone="violet" />
                  <div className="flex-1 text-xs text-[var(--ink-soft)]">{fmtTime(b.time)} · @ {b.rate}x</div>
                  <div className="text-right"><div className="font-semibold text-sm">{inr(b.amount)}</div><div className={`text-[10px] capitalize ${b.status === "won" ? "text-emerald-300" : b.status === "lost" ? "text-rose-300" : "text-amber-300"}`}>{b.status === "won" ? `won ${inr(b.win ?? 0)}` : b.status}</div></div>
                </div>
              ))}
            </div>
            <div className="text-[11px] text-[var(--ink-mute)] mt-2 text-right">Total today: {inr(sum(mine.filter((b) => b.status !== "reverted"), (b) => b.amount))}</div>
          </>
        )}
      </div>
    </>
  );
}

export function Results({ nav }: { nav: Nav }) {
  const { state } = useStore();
  const [day, setDay] = useState(0);
  const date = addDays(-day);
  return (
    <>
      <Header title="Results" onBack={nav.back} />
      <div className="px-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {[0, 1, 2, 3, 4, 5, 6].map((d) => (
            <button key={d} onClick={() => setDay(d)} className={`shrink-0 rounded-xl px-3 py-2 text-xs font-semibold ${day === d ? "bg-white text-brand-700" : "btn-ghost"}`}>
              {d === 0 ? "Today" : d === 1 ? "Yesterday" : fmtDate(addDays(-d)).slice(0, 6)}
            </button>
          ))}
        </div>
        {CATS.map((c) => (
          <div key={c} className="mt-5">
            <div className="text-sm font-semibold mb-2">{CAT_ICON[c]} {CAT_LABEL[c]}</div>
            <div className="card px-4">
              {state.games.filter((g) => g.cat === c).map((g) => {
                const r = resultOf(state, g.id, date);
                return (
                  <div key={g.id} className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
                    <div className="flex-1"><div className="font-medium text-sm">{g.name}</div><div className="text-[11px] text-[var(--ink-mute)]">Closes {fmtTime(g.close)}</div></div>
                    {r ? <Ball n={r.ank} size={34} /> : <div className="w-[34px] h-[34px] rounded-full bg-white/5 grid place-items-center text-[var(--ink-mute)]">?</div>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

