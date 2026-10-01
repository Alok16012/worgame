import type { Cat, GameType, Result } from "./types";

// Number rules. A "pana" is 3 digits written in ascending order where 0 counts as the highest digit
// (so 1-5-0 is written "150", 1-0-0 is "100"). Its Ank (digit) is the last digit of the sum: 1+5+0 = 6.
//   Single Pana: 3 different digits (120)   Double Pana: exactly two alike (90)   Triple Pana: all alike (10)
// Main result "123-65-456": open pana 123 → open ank 6, close pana 456 → close ank 5, jodi 65.

const rank = (d: number) => (d === 0 ? 10 : d);

export const SINGLE_PANA: string[] = [];
export const DOUBLE_PANA: string[] = [];
export const TRIPLE_PANA: string[] = [];
for (let a = 1; a <= 10; a++)
  for (let b = a; b <= 10; b++)
    for (let c = b; c <= 10; c++) {
      const p = `${a % 10}${b % 10}${c % 10}`;
      if (a === b && b === c) TRIPLE_PANA.push(p);
      else if (a === b || b === c) DOUBLE_PANA.push(p);
      else SINGLE_PANA.push(p);
    }
TRIPLE_PANA.unshift(TRIPLE_PANA.pop()!); // the panel lists 000 first

export const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
export const JODIS = Array.from({ length: 100 }, (_, i) => String(i).padStart(2, "0"));

export const panaDigit = (p: string) => String([...p].reduce((s, c) => s + Number(c), 0) % 10);

/** Rewrites any 3 digits into canonical pana order ("051" → "150"). */
export const normalizePana = (p: string) => [...p].map(Number).sort((x, y) => rank(x) - rank(y)).join("");

export function panaType(p: string): "single_pana" | "double_pana" | "triple_pana" | null {
  if (!/^\d{3}$/.test(p) || normalizePana(p) !== p) return null;
  if (TRIPLE_PANA.includes(p)) return "triple_pana";
  if (DOUBLE_PANA.includes(p)) return "double_pana";
  return "single_pana";
}
export const isPana = (p: string) => panaType(p) !== null;

/** Numbers offered in the bet grid for a game type. */
export function numbersFor(t: GameType): string[] {
  switch (t) {
    case "single_ank": case "left_digit": case "right_digit": return DIGITS;
    case "jodi": return JODIS;
    case "single_pana": return SINGLE_PANA;
    case "double_pana": return DOUBLE_PANA;
    case "triple_pana": return TRIPLE_PANA;
    default: return [];
  }
}

/** Panas grouped under their Ank 0–9 (how the player app lists them). */
export function byAnk(list: string[]) {
  return DIGITS.map((d) => ({ ank: d, items: list.filter((p) => panaDigit(p) === d) })).filter((g) => g.items.length);
}

/** "123-65-456", "123-6*-***", "***-**-***" for main; "123-6" for starline; "45" for gali. */
export function resultText(cat: Cat, r?: Result) {
  if (cat === "gali") return r?.jodi ?? "**";
  const op = r?.openPana, cp = r?.closePana;
  if (cat === "starline") return op ? `${op}-${panaDigit(op)}` : "***-*";
  return `${op ?? "***"}-${op ? panaDigit(op) : "*"}${cp ? panaDigit(cp) : "*"}-${cp ?? "***"}`;
}
