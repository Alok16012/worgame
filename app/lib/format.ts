export const inr = (n: number) => (n < 0 ? "−₹" : "₹") + Math.abs(Number(n || 0)).toLocaleString("en-IN", { maximumFractionDigits: 2 });

const p2 = (n: number) => String(n).padStart(2, "0");

/** Local calendar date as yyyy-mm-dd. */
export function ymd(d = new Date()) {
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
}

export function addDays(n: number, from = new Date()) {
  const d = new Date(from);
  d.setDate(d.getDate() + n);
  return ymd(d);
}

export const hhmm = (d = new Date()) => `${p2(d.getHours())}:${p2(d.getMinutes())}`;

export const mins = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

/** "13:05" → "01:05 PM" */
export function fmtTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${p2(h % 12 || 12)}:${p2(m)} ${h >= 12 ? "PM" : "AM"}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "2026-09-30" → "30 Sep 2026" */
export function fmtDate(d: string) {
  const [y, m, dd] = d.split("-");
  return `${dd} ${MONTHS[Number(m) - 1]} ${y}`;
}

export const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const sum = <T,>(a: T[], f: (x: T) => number) => a.reduce((s, x) => s + f(x), 0);
