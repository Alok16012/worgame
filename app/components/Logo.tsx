// Brand logo as the client asked: "श्री" above "KALYAN", "श्री कल्याण" below, gold on royal blue.
// Pure CSS/text so it stays sharp (HD) at every size.

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

/** `size` is the height of the KALYAN word in px; everything scales from it. */
export function Logo({ size = 44, boxed = false }: { size?: number; boxed?: boolean }) {
  const inner = (
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
  if (!boxed) return inner;
  return (
    <div className="relative rounded-3xl px-8 py-7 overflow-hidden" style={{ background: "radial-gradient(90% 70% at 50% 30%, #23489f 0%, #10296b 55%, #0a1a48 100%)", boxShadow: "inset 0 0 0 1px rgba(247,215,116,.35), 0 18px 40px rgba(0,0,0,.45)" }}>
      <div className="absolute left-1/2 top-2 -translate-x-1/2 w-40 h-40 rounded-full blur-3xl" style={{ background: "rgba(255,214,120,.25)", animation: "glow 3s ease-in-out infinite" }} />
      <div className="relative">{inner}</div>
    </div>
  );
}

/** One-line wordmark for headers: "श्री KALYAN" in gold. */
export function Wordmark({ name, size = 20 }: { name: string; size?: number }) {
  const parts = name.trim().split(/\s+/);
  const isShri = /^shri$/i.test(parts[0]) && parts.length > 1;
  return (
    <span className="flex items-baseline gap-1 truncate" style={{ fontSize: size }}>
      {isShri && <span style={{ ...goldText, fontFamily: "var(--font-yatra)", fontSize: size * 1.05 }}>श्री</span>}
      <span className="truncate" style={{ ...goldText, fontFamily: "var(--font-cinzel)", fontWeight: 900, letterSpacing: 1 }}>{(isShri ? parts.slice(1) : parts).join(" ").toUpperCase()}</span>
    </span>
  );
}
