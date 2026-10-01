"use client";

import { useEffect, useState } from "react";
import { Lock, MessageCircle, Smartphone, User } from "lucide-react";
import { loginUser, registerUser } from "../../lib/engine";
import { DEMO_LOGIN } from "../../lib/seed";
import { useStore } from "../../lib/store";
import { Logo } from "../Logo";
import { IconField, whatsappLink } from "../ui";

export function Splash({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = window.setTimeout(onDone, 1800);
    return () => window.clearTimeout(t);
  }, [onDone]);
  return (
    <div className="min-h-dvh grid place-items-center page-blue">
      <div className="pop"><Logo size={52} boxed /><div className="text-center text-white/70 text-sm mt-5 tracking-wide">Matka • Starline • Gali Desawar</div></div>
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
    <div className="min-h-dvh px-6 pt-10 pb-8 flex flex-col page-blue">
      <div className="flex justify-center"><Logo size={40} boxed /></div>
      <div className="text-center text-white text-xl font-semibold mt-8">{mode === "login" ? "Login To Your Account" : "Create A New Account"}</div>
      <form className="space-y-4 mt-6" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        {mode === "register" && <IconField icon={<User size={18} />} placeholder="Enter Your Full Name" value={name} onChange={(e) => setName(e.target.value)} />}
        <IconField icon={<Smartphone size={18} />} placeholder="Enter Your Mobile Number" inputMode="numeric" maxLength={10} value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))} />
        <IconField icon={<Lock size={18} />} placeholder="Enter Your Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="gbtn w-full py-3.5 rounded-xl text-lg">{mode === "login" ? "LOGIN" : "REGISTER"}</button>
      </form>
      <div className="text-center text-white/80 mt-5">
        {mode === "login" ? <>Don&apos;t have an account? <button className="text-[#f5c542] font-semibold" onClick={() => setMode("register")}>Register</button></>
          : <>Already have an account? <button className="text-[#f5c542] font-semibold" onClick={() => setMode("login")}>Login</button></>}
      </div>
      <a href={whatsappLink(state.settings.contact.whatsapp)} target="_blank" rel="noreferrer" className="mx-auto mt-7 flex items-center gap-2 bg-white rounded-full px-7 py-3 shadow-md font-bold text-[#13306f]">
        <MessageCircle size={20} className="text-emerald-500" /> ADMIN
      </a>
      {mode === "login" && (
        <button onClick={() => { setMobile(DEMO_LOGIN.mobile); setPassword(DEMO_LOGIN.password); }} className="mt-auto pt-8 text-xs text-white/60 underline decoration-dashed">
          Demo login: {DEMO_LOGIN.mobile} / {DEMO_LOGIN.password} (tap to fill)
        </button>
      )}
    </div>
  );
}
