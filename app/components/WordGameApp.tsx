"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Award, Banknote, Bell, BookOpen, Gamepad2, History, Home as HomeIcon, Landmark, Lightbulb, LogOut, Percent, Phone, Play, ReceiptText, Share2, Star, Trophy, User as UserIcon, Wallet, Wrench } from "lucide-react";
import { Share } from "@capacitor/share";
import { findUser } from "../lib/engine";
import { StoreProvider, useStore } from "../lib/store";
import { SessionCtx, Toast, useSession } from "./ui";
import { Logo } from "./Logo";
import type { Nav, Route } from "./nav";
import { Auth, Splash } from "./screens/Auth";
import { Chart, Home, MarketList } from "./screens/Home";
import { BetScreen, GameTypes } from "./screens/Play";
import { BankDetails, Deposit, Withdraw, WithdrawHistory } from "./screens/Funds";
import { BidHistory, Contact, GameRatesScreen, HowToPlay, Notices, Profile, Statement, WinHistory } from "./screens/Account";
import { QuizInstructions, QuizSection, SubmitIdea } from "./screens/Quiz";

const SESSION_KEY = "wg_session";

function Drawer({ nav, onClose }: { nav: Nav; onClose: () => void }) {
  const { state } = useStore();
  const { user: u } = useSession();
  const quizMode = u ? !(u.betting ?? true) : state.settings.bettingDisabled;
  const go = (r: Route) => { onClose(); nav.push(r); };

  const bettingItems: [React.ReactNode, string, () => void][] = [
    [<HomeIcon key="i" size={19} />, "Home", () => { onClose(); nav.reset({ name: "home" }); }],
    [<UserIcon key="i" size={19} />, "My Profile", () => go({ name: "profile" })],
    [<Wallet key="i" size={19} />, "Deposit Fund", () => go({ name: "deposit" })],
    [<Banknote key="i" size={19} />, "Withdraw Fund", () => go({ name: "withdraw" })],
    [<Landmark key="i" size={19} />, "Add Bank Details", () => go({ name: "bank" })],
    [<History key="i" size={19} />, "Bid History", () => go({ name: "bids" })],
    [<Trophy key="i" size={19} />, "Win History", () => go({ name: "wins" })],
    [<ReceiptText key="i" size={19} />, "Wallet Statement", () => go({ name: "statement" })],
    [<Gamepad2 key="i" size={19} />, "Starline", () => go({ name: "list", cat: "starline" })],
    [<Gamepad2 key="i" size={19} />, "Gali Desawar", () => go({ name: "list", cat: "gali" })],
    [<Percent key="i" size={19} />, "Game Rates", () => go({ name: "rates" })],
    [<BookOpen key="i" size={19} />, "How To Play", () => go({ name: "howto" })],
    [<Bell key="i" size={19} />, "Notifications", () => go({ name: "notices" })],
    [<Phone key="i" size={19} />, "Contact Us", () => go({ name: "contact" })],
    [<Share2 key="i" size={19} />, "Share App", async () => {
      onClose();
      try {
        await Share.share({ title: state.settings.appName, text: `Play on ${state.settings.appName}!`, url: location.origin });
      } catch (err) {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(location.origin);
          alert("Link copied to clipboard!");
        }
      }
    }],
  ];

  const quizItems: [React.ReactNode, string, () => void][] = [
    [<HomeIcon key="i" size={19} />, "Home", () => { onClose(); nav.reset({ name: "home" }); }],
    [<Play key="i" size={19} />, "Play Daily Quiz", () => go({ name: "quiz", title: "Daily Market Quiz" })],
    [<Lightbulb key="i" size={19} />, "Submit Idea", () => go({ name: "submitIdea" })],
    [<Star key="i" size={19} />, "Starline Quiz", () => go({ name: "list", cat: "starline" })],
    [<Gamepad2 key="i" size={19} />, "Gali Desawar Quiz", () => go({ name: "list", cat: "gali" })],
    [<BookOpen key="i" size={19} />, "Quiz Guidelines", () => go({ name: "quizRules" })],
    [<UserIcon key="i" size={19} />, "My Profile", () => go({ name: "profile" })],
    [<Bell key="i" size={19} />, "Notifications", () => go({ name: "notices" })],
    [<Phone key="i" size={19} />, "Contact Us", () => go({ name: "contact" })],
    [<Share2 key="i" size={19} />, "Share App", async () => {
      onClose();
      try {
        await Share.share({ title: state.settings.appName, text: `Play Quiz on ${state.settings.appName}!`, url: location.origin });
      } catch (err) {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(location.origin);
          alert("Link copied to clipboard!");
        }
      }
    }],
  ];

  const items = quizMode ? quizItems : bettingItems;

  return (
    <div className="fixed inset-0 z-50 flex justify-center">
      <div className="absolute inset-0 bg-black/50 fadein" onClick={onClose} />
      <div className="relative w-full max-w-[430px] h-full pointer-events-none">
        <aside className="slidein pointer-events-auto absolute left-0 top-0 h-full w-[78%] bg-white overflow-y-auto no-scrollbar shadow-2xl">
          <div className="px-5 pb-5 text-white" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 24px)", background: "radial-gradient(100% 80% at 50% 0%, #23489f, #0b1d4f)" }}>
            <div className="flex justify-center mb-4"><Logo size={26} /></div>
            <div className="font-bold text-lg">{u?.name}</div>
            <div className="text-sm opacity-80">
              {quizMode ? `${u?.mobile} · 🎓 Quiz Player` : `${u?.mobile} · ₹${u?.balance.toLocaleString("en-IN")}`}
            </div>
          </div>
          <div className="py-2">
            {items.map(([icon, label, fn]) => (
              <button key={label} onClick={fn} className="w-full flex items-center gap-4 px-5 py-3 text-[15px] text-slate-700 active:bg-slate-100 transition"><span className="text-[#13306f]">{icon}</span>{label}</button>
            ))}
            <button onClick={() => { onClose(); nav.logout(); }} className="w-full flex items-center gap-4 px-5 py-3 text-[15px] text-rose-600 active:bg-rose-50 transition"><LogOut size={19} /> Logout</button>
          </div>
          <div className="text-center text-xs text-slate-400 pb-6 flex flex-col items-center gap-1.5">
            <div>Version {state.settings.version}</div>
            <a href="/privacy-policy" className="text-blue-600 underline">Privacy Policy</a>
            <a href="/delete-account" className="text-blue-600 underline">Delete Account &amp; Data</a>
            <a href="/admin" target="_blank" className="text-blue-600 hover:underline font-medium">Admin Portal →</a>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Shell() {
  const { state, update, isCloudSynced } = useStore();
  const [uid, setUid] = useState<number | null | undefined>(undefined);
  const [splash, setSplash] = useState(true);
  const [stack, setStack] = useState<Route[]>([{ name: "home" }]);
  const [drawer, setDrawer] = useState(false);
  const [toast, setToast] = useState<{ text: string; tone: "ok" | "bad" } | null>(null);
  const timer = useRef(0);
  const lastBackPress = useRef(0);
  const route = stack[stack.length - 1];

  useEffect(() => {
    try { setUid(Number(localStorage.getItem(SESSION_KEY)) || null); } catch { setUid(null); }
  }, []);

  const showToast = useCallback((text: string, tone: "ok" | "bad" = "ok") => {
    setToast({ text, tone });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  const signIn = useCallback((id: number | null) => {
    try { if (id) localStorage.setItem(SESSION_KEY, String(id)); else localStorage.removeItem(SESSION_KEY); } catch {}
    setUid(id);
    setStack([{ name: "home" }]);
  }, []);

  const nav = useMemo<Nav>(() => ({
    push: (r) => {
      try { window.history.pushState({ r: r.name }, ""); } catch {}
      setStack((s) => [...s, r]);
      window.scrollTo(0, 0);
    },
    back: () => {
      setStack((s) => (s.length > 1 ? s.slice(0, -1) : [{ name: "home" }]));
      window.scrollTo(0, 0);
    },
    reset: (r) => {
      setStack([r]);
      window.scrollTo(0, 0);
    },
    logout: () => {
      if (uid) update((d) => { const u = d.users.find((x) => x.id === uid); if (u) u.loggedIn = false; });
      signIn(null);
    },
  }), [uid, update, signIn]);

  // Native Android hardware back button and web popstate support
  useEffect(() => {
    let sub: any;
    const setupBack = async () => {
      try {
        const { App } = await import("@capacitor/app");
        sub = await App.addListener("backButton", () => {
          if (drawer) {
            setDrawer(false);
            return;
          }
          if (stack.length > 1) {
            nav.back();
            return;
          }
          const now = Date.now();
          if (now - lastBackPress.current < 2000) {
            App.exitApp();
          } else {
            lastBackPress.current = now;
            showToast("Press back again to exit");
          }
        });
      } catch {}
    };
    setupBack();

    const onPop = () => {
      if (drawer) {
        setDrawer(false);
        return;
      }
      if (stack.length > 1) {
        setStack((s) => (s.length > 1 ? s.slice(0, -1) : [{ name: "home" }]));
      }
    };
    window.addEventListener("popstate", onPop);

    return () => {
      sub?.remove?.();
      window.removeEventListener("popstate", onPop);
    };
  }, [drawer, stack.length, nav, showToast]);

  const user = uid ? findUser(state, uid) : undefined;

  // Auto-logout ONLY after cloud sync has confirmed the user is blocked or nonexistent
  useEffect(() => {
    if (!uid || !isCloudSynced) return;
    if (user && user.status !== "active") {
      signIn(null);
      showToast("Your account is blocked. Contact admin.", "bad");
    } else if (!user) {
      signIn(null);
      showToast("Session expired. Please login again.", "bad");
    }
  }, [uid, user, isCloudSynced, signIn, showToast]);

  const handleSplashDone = useCallback(() => {
    setSplash(false);
  }, []);

  if (state.settings.maintenance) {
    return <div className="min-h-dvh grid place-items-center text-center px-8 page-blue"><div><Wrench size={48} className="mx-auto text-[#f5c542]" /><div className="text-xl font-bold mt-4">Under Maintenance</div><p className="text-sm text-slate-500 mt-1">We&apos;ll be back shortly.</p></div></div>;
  }
  if (uid === undefined) return null;
  if (splash) return <Splash onDone={handleSplashDone} />;
  if (!uid || !user) return <><Auth onSignedIn={(id) => { signIn(id); showToast("Login successful!"); }} toast={showToast} /><Toast msg={toast} /></>;

  const quizMode = user ? !(user.betting ?? true) : state.settings.bettingDisabled;
  let screen: React.ReactNode;
  switch (route.name) {
    case "home": screen = <Home nav={nav} openMenu={() => setDrawer(true)} />; break;
    case "list": screen = <MarketList nav={nav} cat={route.cat} />; break;
    case "quiz": screen = <QuizSection nav={nav} gameId={route.gameId} title={route.title} />; break;
    case "submitIdea": screen = <SubmitIdea nav={nav} />; break;
    case "quizRules": screen = <QuizInstructions nav={nav} />; break;
    case "chart": screen = <Chart nav={nav} gameId={route.gameId} />; break;
    case "market":
      screen = quizMode ? <QuizSection nav={nav} gameId={route.gameId} /> : <GameTypes nav={nav} gameId={route.gameId} />;
      break;
    case "bet":
      screen = quizMode ? <QuizSection nav={nav} gameId={route.gameId} /> : <BetScreen key={route.type} nav={nav} gameId={route.gameId} type={route.type} />;
      break;
    case "deposit":
      screen = quizMode ? <Home nav={nav} openMenu={() => setDrawer(true)} /> : <Deposit nav={nav} />;
      break;
    case "withdraw":
      screen = quizMode ? <Home nav={nav} openMenu={() => setDrawer(true)} /> : <Withdraw nav={nav} />;
      break;
    case "bank":
      screen = quizMode ? <Home nav={nav} openMenu={() => setDrawer(true)} /> : <BankDetails nav={nav} />;
      break;
    case "withdrawHistory":
      screen = quizMode ? <Home nav={nav} openMenu={() => setDrawer(true)} /> : <WithdrawHistory nav={nav} />;
      break;
    case "bids":
      screen = quizMode ? <Home nav={nav} openMenu={() => setDrawer(true)} /> : <BidHistory nav={nav} />;
      break;
    case "wins":
      screen = quizMode ? <Home nav={nav} openMenu={() => setDrawer(true)} /> : <WinHistory nav={nav} />;
      break;
    case "statement":
      screen = quizMode ? <Home nav={nav} openMenu={() => setDrawer(true)} /> : <Statement nav={nav} />;
      break;
    case "rates":
      screen = quizMode ? <QuizInstructions nav={nav} /> : <GameRatesScreen nav={nav} />;
      break;
    case "howto": screen = quizMode ? <QuizInstructions nav={nav} /> : <HowToPlay nav={nav} />; break;
    case "notices": screen = <Notices nav={nav} />; break;
    case "profile": screen = <Profile nav={nav} />; break;
    case "contact": screen = <Contact nav={nav} />; break;
    default: screen = <Home nav={nav} openMenu={() => setDrawer(true)} />; break;
  }

  return (
    <SessionCtx.Provider value={{ uid, toast: showToast }}>
      <div key={stack.length + route.name} className={`fadein pb-10 ${route.name === "home" || route.name === "list" ? "page-blue" : "page-light"}`}>{screen}</div>
      {drawer && <Drawer nav={nav} onClose={() => setDrawer(false)} />}
      <Toast msg={toast} />
    </SessionCtx.Provider>
  );
}

export default function WordGameApp() {
  return (
    <div className="stage">
      <div className="app">
        <StoreProvider fallback={<div className="min-h-dvh grid place-items-center page-blue"><Logo size={52} boxed /></div>}>
          <Shell />
        </StoreProvider>
      </div>
    </div>
  );
}
