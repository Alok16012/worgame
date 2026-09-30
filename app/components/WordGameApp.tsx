"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Wrench } from "lucide-react";
import { findUser } from "../lib/engine";
import { StoreProvider, useStore } from "../lib/store";
import { BottomNav, SessionCtx, Toast, type Tab } from "./ui";
import type { Nav, Route } from "./nav";
import { Auth, Splash } from "./screens/Auth";
import { Games, Home, PlaceBid, Results } from "./screens/Main";
import { AddFunds, WalletScreen, Withdraw } from "./screens/WalletScreens";
import { HowToPlay, MyBets, Notifications, Profile, Support } from "./screens/Account";

const TAB_OF: Partial<Record<Route["name"], Tab>> = { home: "home", games: "games", wallet: "wallet", bets: "bets", profile: "profile" };
const SESSION_KEY = "wg_session";

function Shell() {
  const { state } = useStore();
  const [uid, setUid] = useState<number | null | undefined>(undefined);
  const [splash, setSplash] = useState(true);
  const [stack, setStack] = useState<Route[]>([{ name: "home" }]);
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef(0);
  const route = stack[stack.length - 1];

  useEffect(() => {
    try { setUid(Number(localStorage.getItem(SESSION_KEY)) || null); } catch { setUid(null); }
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  const signIn = (id: number | null) => {
    try { if (id) localStorage.setItem(SESSION_KEY, String(id)); else localStorage.removeItem(SESSION_KEY); } catch {}
    setUid(id);
    setStack([{ name: "home" }]);
  };

  const nav = useMemo<Nav>(() => ({
    push: (r) => { setStack((s) => [...s, r]); window.scrollTo(0, 0); },
    back: () => { setStack((s) => (s.length > 1 ? s.slice(0, -1) : [{ name: "home" }])); window.scrollTo(0, 0); },
    reset: (r) => { setStack([r]); window.scrollTo(0, 0); },
    logout: () => signIn(null),
  }), []);

  const user = uid ? findUser(state, uid) : undefined;
  // Admin blocked this user (possibly from another tab) → sign out.
  useEffect(() => {
    if (uid && (!user || user.status !== "active")) {
      signIn(null);
      showToast("Your account is blocked. Contact support.");
    }
  }, [uid, user, showToast]);

  if (state.settings.maintenance) {
    return (
      <div className="min-h-dvh grid place-items-center text-center px-8">
        <div><Wrench size={48} className="mx-auto text-gold-400" /><div className="text-xl font-semibold mt-4">Under maintenance</div><p className="text-sm text-[var(--ink-soft)] mt-1">We&apos;ll be back shortly.</p></div>
      </div>
    );
  }
  if (uid === undefined) return null;
  if (splash) return <Splash onDone={() => setSplash(false)} />;
  if (!uid || !user) return <><Auth onSignedIn={(id) => signIn(id)} /><Toast msg={toast} /></>;

  const tab = TAB_OF[route.name];
  let screen: React.ReactNode;
  switch (route.name) {
    case "home": screen = <Home nav={nav} />; break;
    case "games": screen = <Games nav={nav} initial={route.cat} />; break;
    case "bid": screen = <PlaceBid nav={nav} gameId={route.gameId} />; break;
    case "results": screen = <Results nav={nav} />; break;
    case "wallet": screen = <WalletScreen nav={nav} />; break;
    case "addfunds": screen = <AddFunds nav={nav} />; break;
    case "withdraw": screen = <Withdraw nav={nav} />; break;
    case "bets": screen = <MyBets nav={nav} />; break;
    case "profile": screen = <Profile nav={nav} />; break;
    case "notifications": screen = <Notifications nav={nav} />; break;
    case "howto": screen = <HowToPlay nav={nav} />; break;
    case "support": screen = <Support nav={nav} />; break;
  }

  return (
    <SessionCtx.Provider value={{ uid, toast: showToast }}>
      <div key={stack.length + route.name} className={`fadein ${tab ? "pb-24" : "pb-8"}`}>{screen}</div>
      {tab && <BottomNav tab={tab} onTab={(t) => nav.reset({ name: t })} />}
      <Toast msg={toast} />
    </SessionCtx.Provider>
  );
}

export default function WordGameApp() {
  return (
    <div className="stage">
      <div className="app">
        <StoreProvider>
          <Shell />
        </StoreProvider>
      </div>
    </div>
  );
}
