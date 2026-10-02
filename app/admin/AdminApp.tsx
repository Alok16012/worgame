"use client";

import { useEffect, useState } from "react";
import { BarChart3, ChevronDown, ChevronUp, FileText, Gamepad2, Home, LogOut, Megaphone, Menu, RotateCcw, Settings as SettingsIcon, Smartphone, Star, Target, Users, Wallet, Dices } from "lucide-react";
import { StoreProvider, useStore } from "../lib/store";
import type { Cat } from "../lib/types";
import { AdminProvider, useAdmin } from "./ui";
import { Dashboard } from "./sections/Dashboard";
import { DeclareResult } from "./sections/Declare";
import { Prediction } from "./sections/Prediction";
import { Roles, UserDetail, UsersPage } from "./sections/Users";
import { AutoDeposit, FundManagement, WithdrawManagement } from "./sections/WalletAdmin";
import { BidRevert } from "./sections/Revert";
import { GameNames, GameNumbers, GameRates } from "./sections/Games";
import { BidHistory, CustomerSell } from "./sections/Reports";
import { PushNotification, SendNotice } from "./sections/Notices";
import { ContactSetting, HowToPlaySetting, MainSetting, SliderImages, WithdrawDays } from "./sections/SettingsAdmin";

// Admin panel modelled on the live Sara777 panel: same menu tree, page names and flows.
// Routes live in the URL hash (#declare/starline, #users/1001) so refresh keeps your place.

type Leaf = { id: string; label: string };
type Item = { id: string; label: string; icon: React.ReactNode } | { group: string; icon: React.ReactNode; items: Leaf[] };

const catItems = (c: Cat): Leaf[] => [
  { id: `games/${c}`, label: "Game Name" },
  { id: `rates/${c}`, label: "Game Rates" },
  ...(c === "main" ? [{ id: "numbers", label: "Game Numbers" }] : [
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
  { group: "Setting", icon: <SettingsIcon size={18} />, items: [{ id: "settings", label: "Main Setting" }, { id: "contact", label: "Contact Setting" }, { id: "howtoplay", label: "How To Play" }, { id: "slider", label: "Slider Image" }, { id: "withdrawdays", label: "Withdraw Day Option" }] },
  { group: "Notice Management", icon: <Megaphone size={18} />, items: [{ id: "notice", label: "Send Notice" }, { id: "push", label: "Push Notification" }] },
  { group: "Report Managment", icon: <FileText size={18} />, items: [{ id: "bids", label: "Bid History Report" }, { id: "sell", label: "Customer Sell Report" }] },
  { group: "Game Managment", icon: <Dices size={18} />, items: catItems("main") },
  { group: "Starline Management", icon: <Star size={18} />, items: catItems("starline") },
  { group: "Galidesawar", icon: <Gamepad2 size={18} />, items: catItems("gali") },
];

const CRUMB: Record<string, string> = {
  dashboard: "Dashboard", declare: "Result Declared", prediction: "Prediction", roles: "Role", users: "Users", fund: "Fund Management",
  withdraw: "Withdraw Management", autodeposit: "Auto Deposit History", revert: "Bid Revert", settings: "Main Setting", contact: "Contact Setting",
  howtoplay: "How To Play", slider: "Slider Image", withdrawdays: "Withdraw Day Option", notice: "Send Notice",
  push: "Push Notification", bids: "Bid History", sell: "Customer Sell Report", games: "Game Name", rates: "Game Rates", numbers: "Game Numbers",
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

export function Logo({ name }: { name: string }) {
  return (
    <div className="bg-white rounded px-2.5 py-1.5 flex items-center gap-1.5 select-none">
      <div className="w-7 h-7 rounded-full bg-[#0e1a3a] grid place-items-center text-[#f5c542] text-[13px]" style={{ fontFamily: "var(--font-yatra)" }}>श्री</div>
      <div className="font-bold text-[#0e1a3a] leading-none text-[15px]" style={{ fontFamily: "var(--font-cinzel)" }}>{name}</div>
    </div>
  );
}

const isOn = (route: string, id: string) => route === id || route.startsWith(`${id}/`);

function Console({ onLogout }: { onLogout: () => void }) {
  const { state, reset } = useStore();
  const { confirm, toast } = useAdmin();
  const [route, go] = useHashRoute();
  const [drawer, setDrawer] = useState(false);
  const [open, setOpen] = useState<Set<string>>(new Set(["Management", "Wallet Management"]));
  const [page, arg] = route.split("/") as [string, string | undefined];
  const cat = (["main", "starline", "gali"].includes(arg ?? "") ? arg : "main") as Cat;

  useEffect(() => {
    const g = NAV.find((n) => "group" in n && n.items.some((i) => isOn(route, i.id)));
    if (g && "group" in g) setOpen((o) => (o.has(g.group) ? o : new Set(o).add(g.group)));
  }, [route]);

  const nav = (r: string) => { go(r); setDrawer(false); };

  let body: React.ReactNode;
  switch (page) {
    case "declare": body = <DeclareResult key={cat} cat={cat} />; break;
    case "prediction": body = <Prediction />; break;
    case "roles": body = <Roles />; break;
    case "users": body = arg ? <UserDetail key={arg} id={Number(arg)} go={nav} /> : <UsersPage go={nav} />; break;
    case "fund": body = <FundManagement />; break;
    case "withdraw": body = <WithdrawManagement go={nav} />; break;
    case "autodeposit": body = <AutoDeposit />; break;
    case "revert": body = <BidRevert key={cat} cat={cat} />; break;
    case "settings": body = <MainSetting />; break;
    case "contact": body = <ContactSetting />; break;
    case "howtoplay": body = <HowToPlaySetting />; break;
    case "slider": body = <SliderImages />; break;
    case "withdrawdays": body = <WithdrawDays />; break;
    case "notice": body = <SendNotice />; break;
    case "push": body = <PushNotification />; break;
    case "bids": body = <BidHistory key={arg ?? "all"} cat={arg ? cat : undefined} />; break;
    case "sell": body = <CustomerSell />; break;
    case "games": body = <GameNames key={cat} cat={cat} />; break;
    case "rates": body = <GameRates key={cat} cat={cat} />; break;
    case "numbers": body = <GameNumbers />; break;
    default: body = <Dashboard go={nav} />;
  }

  const crumbs = ["Dashboard", ...(page === "dashboard" || !CRUMB[page] ? [] : [page === "users" && arg ? "User" : CRUMB[page]]), ...(page === "users" && arg ? ["User Profile"] : [])];

  const resetData = async () => {
    if (await confirm({ title: "Reset demo data", body: "All users, bids, results and settings will be replaced with fresh sample data in every open tab.", ok: "Reset", tone: "red" })) {
      reset();
      toast("Demo data reset", "ok");
    }
  };

  return (
    <div className="min-h-dvh bg-[#f4f6f9] text-slate-800">
      <header className="sticky top-0 z-30 h-[68px] bg-[#0e1a3a] flex items-center gap-3 px-4">
        <button className="text-white/80 p-1.5 lg:hidden" onClick={() => setDrawer(true)} aria-label="Menu"><Menu size={22} /></button>
        <Logo name={state.settings.appName} />
        <button onClick={() => nav("dashboard")} className="hidden sm:inline-flex items-center gap-2 bg-[#f5b301] text-white font-medium px-4 py-2 rounded-md ml-2"><Home size={16} /> View Dashboard</button>
        <div className="flex-1" />
        <a href="/" target="_blank" className="hidden md:inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm"><Smartphone size={16} /> Player App</a>
        <button onClick={resetData} className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm px-2" title="Reset demo data"><RotateCcw size={16} /><span className="hidden md:inline">Reset</span></button>
        <div className="flex items-center gap-2 pl-2">
          <div className="w-9 h-9 rounded bg-[#28a745] text-white grid place-items-center font-bold">A</div>
          <span className="text-white/90 hidden sm:inline">admin</span>
          <button onClick={onLogout} className="p-1.5 text-white/60 hover:text-white" title="Logout"><LogOut size={16} /></button>
        </div>
      </header>

      <div className="flex">
        {drawer && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setDrawer(false)} />}
        <aside className={`fixed lg:sticky top-[68px] z-40 h-[calc(100dvh-68px)] w-64 shrink-0 bg-[#0e1a3a] text-[#d6dbef] overflow-y-auto no-scrollbar transition-transform ${drawer ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
          <nav className="pb-10">
            {NAV.map((n) => {
              if (!("group" in n)) {
                const on = isOn(route, n.id) || (n.id === "declare/main" && route === "declare");
                return <button key={n.id} onClick={() => nav(n.id)} className={`w-full flex items-center gap-3 px-5 py-3 text-[15px] ${on ? "bg-[#f5a623] text-white" : "hover:bg-white/5"}`}>{n.icon}{n.label}</button>;
              }
              const isOpen = open.has(n.group);
              return (
                <div key={n.group}>
                  <button onClick={() => setOpen((o) => { const x = new Set(o); if (isOpen) x.delete(n.group); else x.add(n.group); return x; })} className="w-full flex items-center gap-3 px-5 py-3 text-[15px] hover:bg-white/5">
                    {n.icon}<span className="flex-1 text-left">{n.group}</span>{isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                  {isOpen && n.items.map((it) => (
                    <button key={it.id} onClick={() => nav(it.id)} className={`w-full text-left pl-12 pr-4 py-2.5 text-[14px] ${isOn(route, it.id) ? "bg-white/10 text-white" : "text-[#c3c9e3] hover:text-white"}`}>{it.label}</button>
                  ))}
                </div>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 min-w-0 p-4 lg:p-6 pb-16" key={route}>
          {page !== "dashboard" && CRUMB[page] && <div className="text-[11px] tracking-wider uppercase mb-4 flex gap-2 text-slate-400">
            {crumbs.map((c, i) => <span key={i} className="flex gap-2">{i > 0 && <span>/</span>}<span className={i === 0 ? "text-[#0d6efd]" : ""}>{c}</span></span>)}
          </div>}
          <div className="fadein">{body}</div>
          <div className="text-center text-xs text-slate-400 mt-10">Copyright 2026 © {state.settings.appName} ONLINE APP</div>
        </main>
      </div>
    </div>
  );
}

function AdminLogin({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="min-h-dvh grid place-items-center bg-[#f4f6f9] px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-lg p-7">
        <div className="flex justify-center"><div className="bg-[#0e1a3a] rounded-lg p-3"><Logo name="Shri Kalyan" /></div></div>
        <div className="text-xl font-semibold mt-6 text-slate-800 text-center">Admin Login</div>
        <form className="mt-5 space-y-3" onSubmit={(e) => { e.preventDefault(); onLogin(); }}>
          <input defaultValue="admin" className="admin-input" placeholder="Username" />
          <input type="password" defaultValue="admin123" className="admin-input" placeholder="Password" />
          <button className="w-full bg-[#0d6efd] text-white font-medium py-2.5 rounded-md">Login</button>
        </form>
        <div className="text-[11px] text-slate-400 text-center mt-3">Demo: any password works</div>
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
  if (authed === null) return <div className="min-h-dvh bg-[#f4f6f9]" />;
  if (!authed) return <AdminLogin onLogin={() => set(true)} />;
  return (
    <StoreProvider fallback={<div className="min-h-dvh bg-[#f4f6f9]" />}>
      <AdminProvider>
        <Console onLogout={() => set(false)} />
      </AdminProvider>
    </StoreProvider>
  );
}
