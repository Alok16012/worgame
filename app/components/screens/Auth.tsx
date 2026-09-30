"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ShieldCheck } from "lucide-react";
import { registerUser } from "../../lib/engine";
import { useStore } from "../../lib/store";
import { Avatar, Ball } from "../ui";

const DEMO_OTP = "123456";

export function Splash({ onDone }: { onDone: () => void }) {
  const { state } = useStore();
  useEffect(() => {
    const t = window.setTimeout(onDone, 2000);
    return () => window.clearTimeout(t);
  }, [onDone]);
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center text-center px-8" style={{ background: "radial-gradient(circle at 50% 40%, #3a2aa8, transparent 65%)" }}>
      <div className="text-5xl font-extrabold tracking-tight">Word<span className="gold-text">Game</span></div>
      <div className="text-[var(--ink-soft)] mt-2">{state.settings.tagline}</div>
      <div className="flex gap-3 my-10">
        <div className="float"><Ball n={3} size={56} /></div>
        <div className="float" style={{ animationDelay: ".4s" }}><Ball n={7} size={64} tone="violet" /></div>
        <div className="float" style={{ animationDelay: ".8s" }}><Ball n={9} size={56} tone="blue" /></div>
      </div>
      <div className="w-40 h-1 rounded-full bg-white/10 overflow-hidden"><div className="loadbar h-full bg-gold-400 rounded-full" /></div>
    </div>
  );
}

type Step = { k: "login" } | { k: "register" } | { k: "otp"; mobile: string; uid: number };

export function Auth({ onSignedIn }: { onSignedIn: (uid: number) => void }) {
  const { state, attempt } = useStore();
  const [step, setStep] = useState<Step>({ k: "login" });
  const [mobile, setMobile] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");

  const sendOtp = (m = mobile) => {
    const u = state.users.find((x) => x.mobile === m);
    if (!/^\d{10}$/.test(m)) return setErr("Enter your 10-digit mobile number");
    if (!u) return setErr("This number is not registered. Tap Register below.");
    if (u.status !== "active") return setErr("Your account is blocked. Contact support.");
    setErr("");
    setStep({ k: "otp", mobile: m, uid: u.id });
  };

  const register = () => {
    const r = attempt((d) => registerUser(d, name, mobile));
    if (!r.ok) return setErr(r.error);
    setErr("");
    setStep({ k: "otp", mobile, uid: r.value });
  };

  if (step.k === "otp") return <Otp mobile={step.mobile} onBack={() => setStep({ k: "login" })} onVerified={() => onSignedIn(step.uid)} />;

  const demo = state.users.filter((u) => u.status === "active").slice(0, 4);
  return (
    <div className="min-h-dvh px-6 pt-16 pb-10 flex flex-col">
      <div className="text-center">
        <div className="text-4xl font-extrabold">Word<span className="gold-text">Game</span></div>
        <div className="text-[var(--ink-soft)] text-sm mt-1">{step.k === "login" ? "Login to your account" : "Create your account"}</div>
      </div>

      <div className="card p-5 mt-10">
        {step.k === "register" && (
          <>
            <label className="text-xs text-[var(--ink-soft)]">Full Name</label>
            <input className="field mt-1.5 mb-4" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
          </>
        )}
        <label className="text-xs text-[var(--ink-soft)]">Mobile Number</label>
        <div className="flex gap-2 mt-1.5">
          <div className="field !w-16 text-center text-[var(--ink-soft)]">+91</div>
          <input className="field" inputMode="numeric" maxLength={10} placeholder="Mobile Number" value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))} />
        </div>
        {err && <div className="text-rose-300 text-xs mt-3">{err}</div>}
        <button className="btn-brand w-full py-3.5 rounded-2xl mt-5" onClick={() => (step.k === "login" ? sendOtp() : register())}>
          {step.k === "login" ? "Get OTP" : "Register & Get OTP"}
        </button>
      </div>

      <div className="text-center text-sm text-[var(--ink-soft)] mt-5">
        {step.k === "login" ? <>Don&apos;t have an account? <button className="text-brand-300 font-semibold" onClick={() => { setErr(""); setStep({ k: "register" }); }}>Register</button></>
          : <>Already registered? <button className="text-brand-300 font-semibold" onClick={() => { setErr(""); setStep({ k: "login" }); }}>Login</button></>}
      </div>

      {step.k === "login" && (
        <div className="mt-auto pt-10">
          <div className="text-[11px] uppercase tracking-wider text-[var(--ink-mute)] text-center mb-3">Demo: tap a player to log in</div>
          <div className="grid grid-cols-2 gap-2">
            {demo.map((u) => (
              <button key={u.id} onClick={() => { setMobile(u.mobile); sendOtp(u.mobile); }} className="btn-ghost rounded-2xl p-2.5 flex items-center gap-2 text-left">
                <Avatar name={u.name} size={32} />
                <div className="min-w-0"><div className="text-sm font-medium truncate">{u.name}</div><div className="text-[10px] text-[var(--ink-mute)]">{u.mobile}</div></div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Otp({ mobile, onBack, onVerified }: { mobile: string; onBack: () => void; onVerified: () => void }) {
  const [otp, setOtp] = useState("");
  const [err, setErr] = useState("");
  const [left, setLeft] = useState(30);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
    const t = window.setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    return () => window.clearInterval(t);
  }, []);
  const verify = () => (otp === DEMO_OTP ? onVerified() : setErr("Incorrect OTP. Try again."));
  return (
    <div className="min-h-dvh px-6 pt-5">
      <button onClick={onBack} className="w-9 h-9 grid place-items-center rounded-full bg-white/5" aria-label="Back"><ChevronLeft size={22} /></button>
      <div className="mt-8 w-14 h-14 rounded-2xl grid place-items-center bg-brand-500/20 text-brand-300"><ShieldCheck size={28} /></div>
      <div className="text-2xl font-semibold mt-5">Verify OTP</div>
      <div className="text-sm text-[var(--ink-soft)] mt-1">Enter the 6-digit code sent to +91 {mobile}</div>
      <div className="relative mt-8" onClick={() => ref.current?.focus()}>
        <input ref={ref} value={otp} inputMode="numeric" maxLength={6} className="absolute inset-0 opacity-0" onChange={(e) => { setErr(""); setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); }} onKeyDown={(e) => e.key === "Enter" && verify()} />
        <div className="grid grid-cols-6 gap-2">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className={`h-14 rounded-xl grid place-items-center text-xl font-bold border ${otp.length === i ? "border-brand-400 bg-brand-500/10" : "border-white/10 bg-white/5"}`}>{otp[i] ?? ""}</div>
          ))}
        </div>
      </div>
      {err && <div className="text-rose-300 text-xs mt-3">{err}</div>}
      <div className="text-xs text-[var(--ink-mute)] mt-4">{left ? `Resend OTP in 00:${String(left).padStart(2, "0")}` : <button className="text-brand-300 font-semibold" onClick={() => setLeft(30)}>Resend OTP</button>}</div>
      <button className="btn-brand w-full py-3.5 rounded-2xl mt-8" disabled={otp.length !== 6} onClick={verify}>Verify &amp; Login</button>
      <button className="w-full mt-3 py-2 text-xs rounded-xl border border-dashed border-white/20 text-[var(--ink-soft)]" onClick={() => setOtp(DEMO_OTP)}>Demo: fill OTP {DEMO_OTP}</button>
    </div>
  );
}
