"use client";

import { useEffect, useState } from "react";
import { Lock, MessageCircle, Smartphone, User, UserPlus } from "lucide-react";
import { loginUser, registerUser } from "../../lib/engine";
import { DEMO_LOGIN } from "../../lib/seed";
import { useStore } from "../../lib/store";
import { IconField, whatsappLink } from "../ui";

export function Logo({ size = "lg" }: { size?: "lg" | "sm" }) {
  const big = size === "lg";
  return (
    <div className="flex items-center justify-center select-none">
      <div className={`${big ? "w-16 h-16 text-3xl" : "w-9 h-9 text-lg"} rounded-full bg-[#f6b52e] grid place-items-center font-black text-white shadow`}>W</div>
      <div className={`${big ? "text-[34px] -ml-3" : "text-xl -ml-2"} font-medium text-slate-700 tracking-tight`}><span className="bg-transparent">ord</span><span className="font-bold text-[#f6b52e]">Game</span></div>
    </div>
  );
}

export function Splash({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = window.setTimeout(onDone, 1500);
    return () => window.clearTimeout(t);
  }, [onDone]);
  return (
    <div className="min-h-dvh grid place-items-center">
      <div className="pop"><Logo /><div className="text-center text-slate-500 text-sm mt-3">Matka • Starline • Gali Desawar</div></div>
    </div>
  );
}

export function Auth({ onSignedIn, toast }: { onSignedIn: (uid: number) => void; toast: (m: string, tone?: "ok" | "bad") => void }) {
  const { state, attempt } = useStore();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");

  const submit = () => {
    const r = mode === "login" ? attempt((d) => loginUser(d, mobile, password)) : attempt((d) => registerUser(d, name, mobile, password));
    if (!r.ok) return toast(r.error, "bad");
    onSignedIn(r.value);
  };

  return (
    <div className="min-h-dvh px-6 pt-10 pb-10 flex flex-col">
      <div className="flex items-start justify-between">
        <div className="border-l-4 border-[#f6b52e] pl-3 text-[26px] leading-tight text-slate-700" style={{ fontFamily: "var(--font-poppins)" }}>
          {mode === "login" ? <>Login To Your<br />Account</> : <>Create A New<br />Account</>}
        </div>
        {mode === "register" && <UserPlus size={32} className="text-slate-700 mt-2" />}
      </div>
      <div className="mt-12 mb-10"><Logo /></div>
      <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        {mode === "register" && <IconField icon={<User size={18} />} placeholder="Enter Your Full Name" value={name} onChange={(e) => setName(e.target.value)} />}
        <IconField icon={<Smartphone size={18} />} placeholder="Enter Your Mobile Number" inputMode="numeric" maxLength={10} value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))} />
        <IconField icon={<Lock size={18} />} placeholder="Enter Your Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="ybtn w-full py-3.5 rounded-xl text-lg">{mode === "login" ? "LOGIN" : "REGISTER"}</button>
      </form>
      <div className="text-center text-slate-600 mt-6">
        {mode === "login" ? <>Don&apos;t have an account? <button className="text-[#f6b52e] font-semibold" onClick={() => setMode("register")}>Register</button></>
          : <>Already have an account? <button className="text-[#f6b52e] font-semibold" onClick={() => setMode("login")}>Login</button></>}
      </div>
      <a href={whatsappLink(state.settings.contact.whatsapp)} target="_blank" rel="noreferrer" className="mx-auto mt-8 flex items-center gap-2 bg-white rounded-full px-7 py-3 shadow-md font-bold text-slate-800">
        <MessageCircle size={20} className="text-emerald-500" /> ADMIN
      </a>
      {mode === "login" && (
        <button onClick={() => { setMobile(DEMO_LOGIN.mobile); setPassword(DEMO_LOGIN.password); }} className="mt-auto pt-8 text-xs text-slate-500 underline decoration-dashed">
          Demo login: {DEMO_LOGIN.mobile} / {DEMO_LOGIN.password} (tap to fill)
        </button>
      )}
    </div>
  );
}
