// Brand logo as the client asked: "श्री" above "KALYAN", "श्री कल्याण" below, gold on royal blue.
// Pure CSS/text so it stays sharp (HD) at every size.
// In Quiz mode the app is branded "Triviaverse" and uses the /quiz-logo.png image instead.

import { QUIZ_APP_NAME, QUIZ_LOGO } from "../lib/brand";

const GOLD = "linear-gradient(180deg,#fff6d0 0%,#f7d774 30%,#e5ad3e 60%,#b9781a 85%,#f3cf6b 100%)";
const goldText: React.CSSProperties = { backgroundImage: GOLD, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", filter: "drop-shadow(0 2px 2px rgba(0,0,0,.45))" };

function Rule({ w }: { w: number }) {
  return (
    <span className="flex items-center" style={{ width: w }}>
      <span className="h-[2px] flex-1 rounded" style={{ background: GOLD }} />
      <span className="w-1.5 h-1.5 rotate-45 mx-1" style={{ background: GOLD }} />
      <span className="h-[2px] flex-1 rounded" style={{ background: GOLD }} />
    </span>
  );
}

/** Triviaverse square logo (image already contains the wordmark). `px` = rendered width/height. */
export function QuizLogo({ px, className = "" }: { px: number; className?: string }) {
  return (
    <img
      src={QUIZ_LOGO}
      alt={QUIZ_APP_NAME}
      width={px}
      height={px}
      className={`select-none object-cover shadow-2xl drop-shadow-[0_12px_24px_rgba(0,0,0,0.45)] ${className}`}
      style={{ width: px, height: px, borderRadius: "22%" }}
    />
  );
}

/** `size` is the height of the KALYAN word in px; everything scales from it. `quiz` swaps in the Triviaverse logo. */
export function Logo({ size = 44, boxed = false, quiz = false }: { size?: number; boxed?: boolean; quiz?: boolean }) {
  if (quiz) {
    const px = boxed ? Math.max(72, Math.round(size * 3.2)) : Math.max(64, Math.round(size * 3.4));
    return <QuizLogo px={px} />;
  }
  if (boxed) {
    const px = Math.max(72, Math.round(size * 3.2));
    return (
      <img
        src="/icon.png"
        alt="Shri Kalyan"
        width={px}
        height={px}
        className="rounded-3xl shadow-2xl select-none object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.45)]"
        style={{ width: px, height: px }}
      />
    );
  }
  return (
    <div className="flex flex-col items-center leading-none select-none" style={{ gap: size * 0.12 }}>
      <span style={{ ...goldText, fontFamily: "var(--font-yatra)", fontSize: size * 0.95, lineHeight: 1 }}>श्री</span>
      <Rule w={size * 4.2} />
      <span className="flex items-end" style={{ gap: size * 0.12 }}>
        <span style={{ ...goldText, fontFamily: "var(--font-cinzel)", fontWeight: 900, fontSize: size, letterSpacing: size * 0.04, lineHeight: 1 }}>KALYAN</span>
        <span style={{ fontSize: size * 0.42, lineHeight: 1 }} aria-hidden>🪔</span>
      </span>
      <Rule w={size * 4.2} />
      <span style={{ ...goldText, fontFamily: "var(--font-yatra)", fontSize: size * 0.62, lineHeight: 1.15 }}>श्री कल्याण</span>
    </div>
  );
}

/** One-line wordmark for headers: "श्री KALYAN" in gold, or the Triviaverse icon + "Triviaverse" in Quiz mode. */
export function Wordmark({ name, size = 20, quiz = false }: { name: string; size?: number; quiz?: boolean }) {
  if (quiz) {
    // Match the logo: white "Trivia" + sky-blue "verse" (falls back to plain name if admin renamed it).
    const m = /^(trivia)(verse)$/i.exec(name.trim());
    return (
      <span className="flex items-center gap-2 truncate" style={{ fontSize: size }}>
        <img src={QUIZ_LOGO} alt="" width={size * 1.6} height={size * 1.6} className="select-none object-cover shrink-0" style={{ width: size * 1.6, height: size * 1.6, borderRadius: "22%" }} />
        <span className="truncate font-extrabold tracking-tight" style={{ fontFamily: "var(--font-poppins)", textShadow: "0 1px 2px rgba(0,0,0,.4)" }}>
          {m ? <><span className="text-white">{m[1]}</span><span className="text-[#38bdf8]">{m[2]}</span></> : <span className="text-white">{name}</span>}
        </span>
      </span>
    );
  }
  const parts = name.trim().split(/\s+/);
  const isShri = /^shri$/i.test(parts[0]) && parts.length > 1;
  return (
    <span className="flex items-baseline gap-1 truncate" style={{ fontSize: size }}>
      {isShri && <span style={{ ...goldText, fontFamily: "var(--font-yatra)", fontSize: size * 1.05 }}>श्री</span>}
      <span className="truncate" style={{ ...goldText, fontFamily: "var(--font-cinzel)", fontWeight: 900, letterSpacing: 1 }}>{(isShri ? parts.slice(1) : parts).join(" ").toUpperCase()}</span>
    </span>
  );
}
