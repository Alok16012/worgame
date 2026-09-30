"use client";

import { useEffect, useState } from "react";
import {
  BarChart3, BookOpen, ChevronDown, FileText, Gamepad2, Home, LogOut, Megaphone, Menu, Moon, RotateCcw, Settings as SettingsIcon, Smartphone, Star, Target, Users, Wallet,
} from "lucide-react";
import { StoreProvider, useStore } from "../lib/store";
import type { Cat } from "../lib/types";
import { AdminProvider, Btn, useAdmin } from "./ui";
import { Dashboard, Guide } from "./sections/Dashboard";
import { BidRevert, DeclareResult, Prediction } from "./sections/Results";
import { Roles, UsersPage } from "./sections/People";
import { AutoDeposit, FundManagement, WithdrawManagement } from "./sections/WalletAdmin";
import { GameNames, GameNumbers, GameRates } from "./sections/Games";
import { BidHistory, CustomerSell } from "./sections/Reports";
import { PushNotification, SendNotice } from "./sections/Notices";
import { ActivityLog, ContactSetting, GoldenAnk, HowToPlaySetting, MainSetting, SliderImages, WithdrawDays } from "./sections/SettingsAdmin";

// Admin console for the Sara777-style PRD. Routes live in the URL hash (#declare/main) so a refresh
// keeps your place. Menu structure mirrors the live panel: Management, Wallet, Setting, Notice,
// Report, Game, Starline and Galidesawar groups.

type Leaf = { id: string; label: string };
type Item = { id: string; label: string; icon: React.ReactNode } | { group: string; icon: React.ReactNode; items: Leaf[] };

const catItems = (c: Cat): Leaf[] => [
  { id: `games/${c}`, label: "Game Name" },
  { id: `rates/${c}`, label: "Game Rates" },
  ...(c === "main" ? [{ id: "numbers/main", label: "Game Numbers" }] : [
    { id: `bids/${c}`, label: "Bid History" },
    { id: `declare/${c}`, label: "Declare Result" },
    { id: `revert/${c}`, label: "Bid Revert" },
  ]),
];

const NAV: Item[] = [
  { id: "dashboard", label: "Dashboard", icon: <Home size={18} /> },
  { id: "declare/main", label: "Declare Result", icon: <Target size={18} /> },
  { id: "prediction", label: "Prediction", icon: <BarChart3 size={18} /> },
  { group: "Management", icon: <Users size={18} />, items: [{ id: "roles", label: "Role" }, { id: "users", label: "Users" }] },
  { group: "Wallet Management", icon: <Wallet size={18} />, items: [{ id: "fund", label: "Fund Management" }, { id: "withdraw", label: "Withdraw Management" }, { id: "autodeposit", label: "Auto Deposit History" }, { id: "revert/main", label: "Bid Revert" }] },
  { group: "Setting", icon: <SettingsIcon size={18} />, items: [{ id: "settings", label: "Main Setting" }, { id: "contact", label: "Contact Setting" }, { id: "howtoplay", label: "How To Play" }, { id: "slider", label: "Slider Image" }, { id: "withdrawdays", label: "Withdraw Day Option" }, { id: "golden", label: "Golden Ank" }, { id: "audit", label: "Activity Log" }] },
  { group: "Notice Management", icon: <Megaphone size={18} />, items: [{ id: "notice", label: "Send Notice" }, { id: "push", label: "Push Notification" }] },
  { group: "Report Management", icon: <FileText size={18} />, items: [{ id: "bids", label: "Bid History Report" }, { id: "sell", label: "Customer Sell Report" }] },
  { group: "Game Management", icon: <Gamepad2 size={18} />, items: catItems("main") },
  { group: "Starline Management", icon: <Star size={18} />, items: catItems("starline") },
  { group: "Galidesawar", icon: <Moon size={18} />, items: catItems("gali") },
  { id: "guide", label: "Game Flow Guide", icon: <BookOpen size={18} /> },
];

const TITLES: Record<string, string> = {
  dashboard: "Dashboard", declare: "Declare Result", prediction: "Prediction", roles: "Role", users: "Users", fund: "Fund Management",
  withdraw: "Withdraw Management", autodeposit: "Auto Deposit History", revert: "Bid Revert", settings: "Main Setting", contact: "Contact Setting",
  howtoplay: "How To Play", slider: "Slider Image", withdrawdays: "Withdraw Day Option", golden: "Golden Ank", audit: "Activity Log",
  notice: "Send Notice", push: "Push Notification", bids: "Bid History", sell: "Customer Sell Report", games: "Game Name", rates: "Game Rates",
  numbers: "Game Numbers", guide: "Game Flow Guide",
};

function useHashRoute(): [string, (r: string) => void] {
  const [route, setRoute] = useState("dashboard");
  useEffect(() => {
    const read = () => setRoute(window.location.hash.replace(/^#\/?/, "") || "dashboard");
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);
  return [route, (r) => { window.location.hash = r; window.scrollTo(0, 0); }];
}

function Brand({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-9 h-9 rounded-xl grid place-items-center font-black text-[#1b1030]" style={{ background: "linear-gradient(135deg,#fbbf24,#f97316)" }}>W</div>
      <div>
        <div className="font-bold leading-none text-white">{name}</div>
        <div className="text-[10px] text-white/50 mt-0.5">Admin Console</div>
      </div>
    </div>
  );
}

function Console({ onLogout }: { onLogout: () => void }) {
  const { state, reset } = useStore();
  const { confirm, toast } = useAdmin();
  const [route, go] = useHashRoute();
  const [drawer, setDrawer] = useState(false);
  const [open, setOpen] = useState<Set<string>>(new Set(["Management", "Wallet Management"]));
  const [page, arg, extra] = route.split("/") as [string, string | undefined, string | undefined];
  const cat = (["main", "starline", "gali"].includes(arg ?? "") ? arg : "main") as Cat;

  // Expand the group that owns the current page.
  useEffect(() => {
    const g = NAV.find((n) => "group" in n && n.items.some((i) => i.id === route || route.startsWith(`${i.id}/`)));
    if (g && "group" in g) setOpen((o) => (o.has(g.group) ? o : new Set(o).add(g.group)));
  }, [route]);

  const nav = (r: string) => { go(r); setDrawer(false); };

  let body: React.ReactNode;
  switch (page) {
    case "declare": body = <DeclareResult key={route} cat={cat} initialGame={extra ? Number(extra) : undefined} />; break;
    case "prediction": body = <Prediction />; break;
    case "roles": body = <Roles />; break;
    case "users": body = <UsersPage go={nav} />; break;
    case "fund": body = <FundManagement key={route} initialUser={arg ? Number(arg) : undefined} />; break;
    case "withdraw": body = <WithdrawManagement />; break;
    case "autodeposit": body = <AutoDeposit />; break;
    case "revert": body = <BidRevert key={cat} cat={cat} />; break;
    case "settings": body = <MainSetting />; break;
    case "contact": body = <ContactSetting />; break;
    case "howtoplay": body = <HowToPlaySetting />; break;
    case "slider": body = <SliderImages />; break;
    case "withdrawdays": body = <WithdrawDays />; break;
    case "golden": body = <GoldenAnk />; break;
    case "audit": body = <ActivityLog />; break;
    case "notice": body = <SendNotice />; break;
    case "push": body = <PushNotification />; break;
    case "bids": body = <BidHistory key={arg ?? "all"} cat={arg ? cat : undefined} />; break;
    case "sell": body = <CustomerSell />; break;
    case "games": body = <GameNames key={cat} cat={cat} />; break;
    case "rates": body = <GameRates key={cat} cat={cat} />; break;
    case "numbers": body = <GameNumbers />; break;
    case "guide": body = <Guide go={nav} />; break;
    default: body = <Dashboard go={nav} />;
  }

  const crumbGroup = NAV.find((n) => "group" in n && n.items.some((i) => i.id === route || route.startsWith(`${i.id}/`)));
  const crumb = crumbGroup && "group" in crumbGroup ? crumbGroup.group : "Home";

  const resetData = async () => {
    if (await confirm({ title: "Reset demo data", body: "All bids, results, users and settings will be replaced with fresh sample data (in every open tab).", ok: "Reset", tone: "red" })) {
      reset();
      toast("Demo data reset", "ok");
    }
  };

  return (
    <div className="min-h-dvh bg-[#f3f4fa] text-slate-800 flex">
      {drawer && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setDrawer(false)} />}
      <aside className={`fixed lg:sticky top-0 z-40 h-dvh w-64 shrink-0 bg-[#0e1433] text-[#c9cdf0] overflow-y-auto no-scrollbar transition-transform ${drawer ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="px-5 pt-5 pb-4"><Brand name={state.settings.appName} /></div>
        <nav className="px-3 pb-8 space-y-0.5">
          {NAV.map((n) => {
            if (!("group" in n)) {
              const on = route === n.id || route.startsWith(`${n.id}/`) || (n.id === "declare/main" && route === "declare");
              return (
                <button key={n.id} onClick={() => nav(n.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${on ? "bg-brand-600 text-white" : "hover:bg-white/5 hover:text-white"}`}>
                  {n.icon}{n.label}
                </button>
              );
            }
            const isOpen = open.has(n.group);
            return (
              <div key={n.group}>
                <button onClick={() => setOpen((o) => { const x = new Set(o); if (isOpen) x.delete(n.group); else x.add(n.group); return x; })}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-white/5 hover:text-white">
                  {n.icon}{n.group}
                  <ChevronDown size={14} className={`ml-auto opacity-60 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && (
                  <div className="pl-10 pb-1 space-y-0.5">
                    {n.items.map((it) => (
                      <button key={it.id} onClick={() => nav(it.id)} className={`w-full text-left px-3 py-1.5 rounded-lg text-[13px] ${route === it.id || route.startsWith(`${it.id}/`) ? "bg-white/10 text-white font-semibold" : "hover:text-white"}`}>{it.label}</button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200 px-4 lg:px-6 py-3 flex items-center gap-3">
          <button className="lg:hidden p-2 rounded-lg bg-brand-50 text-brand-700" onClick={() => setDrawer(true)} aria-label="Menu"><Menu size={18} /></button>
          <div className="min-w-0">
            <div className="font-semibold text-slate-900 truncate">{TITLES[page] ?? "Dashboard"}</div>
            <div className="text-[11px] text-slate-400 truncate">{crumb} / {TITLES[page] ?? "Dashboard"}{arg && page !== "bids" ? ` · ${arg === "gali" ? "Galidesawar" : arg === "starline" ? "Starline" : "Main"}` : ""}</div>
          </div>
          <div className="flex-1" />
          <a href="/" target="_blank" className="hidden sm:inline-flex"><Btn variant="ghost" size="sm"><Smartphone size={14} /> Open Player App</Btn></a>
          <Btn variant="ghost" size="sm" onClick={resetData} title="Reset demo data"><RotateCcw size={14} /><span className="hidden md:inline">Reset data</span></Btn>
          <div className="flex items-center gap-2 pl-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white grid place-items-center font-bold text-sm">A</div>
            <div className="hidden md:block leading-tight"><div className="text-sm font-semibold">admin</div><div className="text-[11px] text-slate-400">Super Admin</div></div>
            <button onClick={onLogout} className="p-2 text-slate-400 hover:text-rose-600" title="Sign out"><LogOut size={16} /></button>
          </div>
        </header>
        <main className="p-4 lg:p-6 pb-16 fadein" key={route}>{body}</main>
      </div>
    </div>
  );
}

function AdminLogin({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="min-h-dvh grid place-items-center bg-[#0e1433] px-4" style={{ background: "radial-gradient(60% 50% at 30% 20%, rgba(109,77,255,.35), transparent 60%), #0b1030" }}>
      <div className="w-full max-w-sm rounded-2xl bg-white/5 border border-white/10 p-6 text-white">
        <Brand name="Word Game" />
        <div className="text-xl font-semibold mt-6">Sign in</div>
        <div className="text-xs text-white/50 mt-1">Role-based access • every action is logged</div>
        <form onSubmit={(e) => { e.preventDefault(); onLogin(); }}>
          <input defaultValue="admin" className="w-full mt-5 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-400" />
          <input type="password" defaultValue="demo1234" className="w-full mt-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-400" />
          <button className="btn-brand w-full py-3 rounded-xl mt-5">Sign in</button>
        </form>
        <div className="text-[11px] text-white/40 text-center mt-3">Demo: any password works</div>
      </div>
    </div>
  );
}

export default function AdminApp() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  useEffect(() => {
    try { setAuthed(sessionStorage.getItem("wg_admin") === "1"); } catch { setAuthed(false); }
  }, []);
  const set = (v: boolean) => {
    try { if (v) sessionStorage.setItem("wg_admin", "1"); else sessionStorage.removeItem("wg_admin"); } catch {}
    setAuthed(v);
  };
  if (authed === null) return <div className="min-h-dvh bg-[#0b1030]" />;
  if (!authed) return <AdminLogin onLogin={() => set(true)} />;
  return (
    <StoreProvider fallback={<div className="min-h-dvh bg-[#f3f4fa]" />}>
      <AdminProvider>
        <Console onLogout={() => set(false)} />
      </AdminProvider>
    </StoreProvider>
  );
}
