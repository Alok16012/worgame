"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, KeyRound, Lock, MessageCircle, Pencil, RotateCcw, ShieldCheck, Smartphone, User } from "lucide-react";
import { loginUser, registerUser, resetUserPassword } from "../../lib/engine";
import { send4DigitOtp, verify4DigitOtp } from "../../lib/otp";
import { useStore } from "../../lib/store";
import { Logo } from "../Logo";
import { IconField, whatsappLink } from "../ui";

export function Splash({ onDone }: { onDone: () => void }) {
  const { reloadFromCloud } = useStore();
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    reloadFromCloud().catch(() => {});
    const t = window.setTimeout(() => {
      onDoneRef.current();
    }, 1200);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="min-h-dvh grid place-items-center page-blue">
      <div className="pop"><Logo size={52} boxed /></div>
    </div>
  );
}

export function Auth({ onSignedIn, toast }: { onSignedIn: (uid: number) => void; toast: (m: string, tone?: "ok" | "bad") => void }) {
  const { state, attempt, reloadFromCloud } = useStore();
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // 4-Digit OTP state
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otpMode, setOtpMode] = useState<"register" | "forgot">("register");
  const [otpValue, setOtpValue] = useState("");
  const [expectedOtp, setExpectedOtp] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [countdown, setCountdown] = useState(30);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isTestFallback, setIsTestFallback] = useState(false);
  const otpInputRef = useRef<HTMLInputElement>(null);

  // Timer for 30s resend cooldown
  useEffect(() => {
    if (!isOtpStep || countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [isOtpStep, countdown]);

  // Focus hidden input when entering OTP step
  useEffect(() => {
    if (isOtpStep) {
      setTimeout(() => otpInputRef.current?.focus(), 250);
    }
  }, [isOtpStep]);

  const cleanMobile = mobile.replace(/\D/g, "");

  const handleSendOtp = async (targetMode: "register" | "forgot") => {
    const clean = mobile.replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(clean)) {
      return toast("Please enter a valid 10-digit mobile number", "bad");
    }

    setIsSending(true);
    // Refresh state from cloud to ensure up-to-date user check
    const fresh = await reloadFromCloud();
    const currentUsers = fresh?.users || state.users;

    if (targetMode === "register") {
      if (!name.trim()) {
        setIsSending(false);
        return toast("Please enter your full name", "bad");
      }
      if (password.length < 4) {
        setIsSending(false);
        return toast("Password must be at least 4 characters", "bad");
      }
      if (currentUsers.some((u) => u.mobile === clean)) {
        setIsSending(false);
        return toast("Mobile number already registered. Please login.", "bad");
      }
    } else {
      if (!currentUsers.some((u) => u.mobile === clean)) {
        setIsSending(false);
        return toast("Mobile number not registered in system", "bad");
      }
    }

    // If OTP is disabled in admin settings, register directly
    if (state.settings.otpEnabled === false && targetMode === "register") {
      const r = attempt((d) => registerUser(d, name, clean, password));
      setIsSending(false);
      if (!r.ok) return toast(r.error, "bad");
      toast("Registration successful!", "ok");
      return onSignedIn(r.value);
    }

    const res = await send4DigitOtp(clean, {
      apiKey: state.settings.otpApiKey,
      username: state.settings.smsUsername,
      senderName: state.settings.smsSenderName,
      peid: state.settings.smsPeid,
      templateId: state.settings.smsTemplateId,
    });
    setIsSending(false);

    if (!res.ok) {
      return toast(res.message || "Failed to send OTP. Please try again.", "bad");
    }

    setOtpMode(targetMode);
    setExpectedOtp(res.otp || "");
    setSessionId(res.sessionId || "");
    setIsTestFallback(!!res.isTestFallback);
    setOtpValue("");
    setCountdown(30);
    setIsOtpStep(true);

    if (res.isTestFallback) {
      toast(`Test Mode: 4-digit OTP is ${res.otp}`, "ok");
    } else {
      toast(`4-digit OTP sent to +91 ${clean}`, "ok");
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || isSending) return;
    setIsSending(true);
    const res = await send4DigitOtp(cleanMobile, {
      apiKey: state.settings.otpApiKey,
      username: state.settings.smsUsername,
      senderName: state.settings.smsSenderName,
      peid: state.settings.smsPeid,
      templateId: state.settings.smsTemplateId,
    });
    setIsSending(false);

    if (!res.ok) {
      return toast(res.message || "Failed to resend OTP", "bad");
    }

    setExpectedOtp(res.otp || "");
    setSessionId(res.sessionId || "");
    setIsTestFallback(!!res.isTestFallback);
    setOtpValue("");
    setCountdown(30);

    if (res.isTestFallback) {
      toast(`New Test OTP: ${res.otp}`, "ok");
    } else {
      toast(`New OTP sent to +91 ${cleanMobile}`, "ok");
    }
  };

  const handleVerifyOtpAndSubmit = async () => {
    if (otpValue.length !== 4) {
      return toast("Please enter the complete 4-digit OTP", "bad");
    }

    if (otpMode === "forgot" && newPassword.length < 4) {
      return toast("New password must be at least 4 characters", "bad");
    }

    setIsVerifying(true);
    const vResult = await verify4DigitOtp(otpValue, expectedOtp, sessionId);

    if (!vResult.ok) {
      setIsVerifying(false);
      return toast(vResult.message || "Invalid OTP! Please try again.", "bad");
    }

    if (otpMode === "register") {
      const r = attempt((d) => registerUser(d, name, cleanMobile, password));
      setIsVerifying(false);
      if (!r.ok) return toast(r.error, "bad");
      toast("Registration successful! Welcome to Shri Kalyan.", "ok");
      onSignedIn(r.value);
    } else {
      const r = attempt((d) => resetUserPassword(d, cleanMobile, newPassword));
      setIsVerifying(false);
      if (!r.ok) return toast(r.error, "bad");
      toast("Password reset successfully! Please login with your new password.", "ok");
      setIsOtpStep(false);
      setMode("login");
      setPassword("");
      setNewPassword("");
    }
  };

  const handleLoginSubmit = async () => {
    const clean = mobile.replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(clean)) return toast("Please enter a valid 10-digit mobile number", "bad");
    if (!password) return toast("Please enter your password", "bad");

    setIsSending(true);
    try {
      const fresh = await reloadFromCloud();
      const currentUsers = fresh?.users || state.users;
      const u = currentUsers.find((x) => x.mobile === clean);
      if (!u) {
        setIsSending(false);
        return toast("Mobile number is not registered", "bad");
      }
      if (u.password !== password) {
        setIsSending(false);
        return toast("Password is incorrect", "bad");
      }
      if (u.status !== "active") {
        setIsSending(false);
        return toast("Your account is blocked. Contact admin.", "bad");
      }

      const r = attempt((d) => loginUser(d, clean, password));
      setIsSending(false);
      if (!r.ok) return toast(r.error, "bad");
      onSignedIn(r.value);
    } catch (e: any) {
      setIsSending(false);
      toast(e?.message || "Login failed. Please check internet connection.", "bad");
    }
  };

  return (
    <div className="min-h-dvh px-6 pb-8 flex flex-col page-blue" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 24px)" }}>
      {/* Top Header */}
      <div className="flex items-center justify-between">
        {isOtpStep || mode === "forgot" ? (
          <button
            onClick={() => {
              if (isOtpStep) setIsOtpStep(false);
              else setMode("login");
            }}
            className="w-10 h-10 rounded-full bg-white/10 grid place-items-center text-white hover:bg-white/20 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>
        ) : (
          <div className="w-10" />
        )}
        <Logo size={40} boxed />
        <div className="w-10" />
      </div>

      {/* Screen Title */}
      <div className="text-center text-white text-xl font-semibold mt-7">
        {isOtpStep
          ? "Verify 4-Digit OTP"
          : mode === "login"
          ? "Login To Your Account"
          : mode === "register"
          ? "Create A New Account"
          : "Forgot Password"}
      </div>

      {/* OTP STEP VIEW */}
      {isOtpStep ? (
        <div className="mt-6 flex flex-col flex-1">
          <div className="text-center text-sm text-white/80">
            We sent a 4-digit verification code to
          </div>
          <div className="flex items-center justify-center gap-2 mt-1.5">
            <span className="text-[#f5c542] font-bold text-base tracking-wide">+91 {cleanMobile}</span>
            <button
              onClick={() => setIsOtpStep(false)}
              className="text-xs bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded text-white flex items-center gap-1"
            >
              <Pencil size={11} /> Edit
            </button>
          </div>

          {/* 4-Box Visual OTP Input */}
          <div className="relative flex justify-center gap-3 my-6">
            {[0, 1, 2, 3].map((i) => {
              const digit = otpValue[i] || "";
              const isActive = otpValue.length === i;
              return (
                <div
                  key={i}
                  className={`w-14 h-16 rounded-xl border-2 grid place-items-center text-2xl font-bold font-mono transition-all ${
                    digit
                      ? "border-[#f5c542] bg-white/15 text-[#ffe08a] shadow-[0_0_12px_rgba(245,197,66,0.3)]"
                      : isActive
                      ? "border-[#f5c542] bg-white/10 text-white ring-2 ring-[#f5c542]/40"
                      : "border-white/20 bg-white/5 text-white/40"
                  }`}
                >
                  {digit}
                </div>
              );
            })}
            <input
              ref={otpInputRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={otpValue}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                setOtpValue(val);
              }}
              className="absolute inset-0 opacity-0 cursor-pointer text-transparent w-full h-full"
              autoComplete="one-time-code"
            />
          </div>

          {/* New password input if resetting password */}
          {otpMode === "forgot" && (
            <div className="mb-4">
              <IconField
                icon={<Lock size={18} />}
                placeholder="Enter New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          )}

          {/* Fallback Notice if gateway is offline/test */}
          {isTestFallback && (
            <div className="mb-4 py-2 px-3 bg-amber-500/20 border border-amber-400/40 rounded-xl text-center text-xs text-amber-200">
              Gateway Test Mode • OTP: <strong className="text-white text-sm font-mono tracking-widest">{expectedOtp}</strong>
            </div>
          )}

          {/* Resend Cooldown */}
          <div className="text-center text-sm text-white/80 mb-5">
            {countdown > 0 ? (
              <span>Resend OTP in <strong className="text-[#f5c542]">{countdown}s</strong></span>
            ) : (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isSending}
                className="inline-flex items-center gap-1.5 text-[#f5c542] font-semibold hover:underline"
              >
                <RotateCcw size={14} /> Resend 4-Digit OTP
              </button>
            )}
          </div>

          {/* Submit Button */}
          <button
            onClick={handleVerifyOtpAndSubmit}
            disabled={isVerifying || otpValue.length !== 4}
            className="gbtn w-full py-3.5 rounded-xl text-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <ShieldCheck size={20} />
            {isVerifying ? "VERIFYING..." : otpMode === "register" ? "VERIFY & REGISTER" : "SET NEW PASSWORD"}
          </button>
        </div>
      ) : (
        /* STANDARD LOGIN / REGISTER / FORGOT FORM */
        <form
          className="space-y-4 mt-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (mode === "login") handleLoginSubmit();
            else if (mode === "register") handleSendOtp("register");
            else handleSendOtp("forgot");
          }}
        >
          {mode === "register" && (
            <IconField
              icon={<User size={18} />}
              placeholder="Enter Your Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}

          <IconField
            icon={<Smartphone size={18} />}
            placeholder="Enter Your Mobile Number"
            inputMode="numeric"
            maxLength={10}
            value={mobile}
            onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
          />

          {mode !== "forgot" && (
            <IconField
              icon={<Lock size={18} />}
              placeholder="Enter Your Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          )}

          {mode === "login" && (
            <div className="flex justify-end pr-1">
              <button
                type="button"
                onClick={() => {
                  setMode("forgot");
                  setPassword("");
                }}
                className="text-xs text-[#f5c542] hover:underline"
              >
                Forgot Password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={isSending}
            className="gbtn w-full py-3.5 rounded-xl text-lg font-bold flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isSending ? (
              "SENDING 4-DIGIT OTP..."
            ) : mode === "login" ? (
              "LOGIN"
            ) : mode === "register" ? (
              <>
                <KeyRound size={18} /> REGISTER WITH OTP
              </>
            ) : (
              "SEND 4-DIGIT OTP"
            )}
          </button>
        </form>
      )}

      {/* Footer Switching Links */}
      {!isOtpStep && (
        <div className="text-center text-white/80 mt-5 text-sm">
          {mode === "login" ? (
            <>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                className="text-[#f5c542] font-semibold hover:underline"
                onClick={() => setMode("register")}
              >
                Register
              </button>
            </>
          ) : mode === "register" ? (
            <>
              Already have an account?{" "}
              <button
                type="button"
                className="text-[#f5c542] font-semibold hover:underline"
                onClick={() => setMode("login")}
              >
                Login
              </button>
            </>
          ) : (
            <button
              type="button"
              className="text-[#f5c542] font-semibold hover:underline"
              onClick={() => setMode("login")}
            >
              Back to Login
            </button>
          )}
        </div>
      )}

      {/* Admin WhatsApp Button */}
      <a
        href={whatsappLink(state.settings.contact.whatsapp)}
        target="_blank"
        rel="noreferrer"
        className="mx-auto mt-7 flex items-center gap-2 bg-white rounded-full px-7 py-3 shadow-md font-bold text-[#13306f] hover:bg-slate-50 transition-colors"
      >
        <MessageCircle size={20} className="text-emerald-500" /> CONTACT ADMIN
      </a>
    </div>
  );
}
