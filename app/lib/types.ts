// Data model for Word Game — a Matka-style market game (modelled on the Sara777 panel).

/** main = Matka markets (open + close session), starline = hourly single-result slots, gali = Gali/Desawar jodi markets */
export type Cat = "main" | "starline" | "gali";
export const CATS: Cat[] = ["main", "starline", "gali"];
export const CAT_LABEL: Record<Cat, string> = { main: "Main Market", starline: "Starline", gali: "Galidesawar" };

export type GameType =
  | "single_ank" | "jodi" | "single_pana" | "double_pana" | "triple_pana" | "half_sangam" | "full_sangam"
  | "left_digit" | "right_digit";

export const TYPE_LABEL: Record<GameType, string> = {
  single_ank: "Single Ank", jodi: "Jodi", single_pana: "Single Pana", double_pana: "Double Pana", triple_pana: "Triple Pana",
  half_sangam: "Half Sangam", full_sangam: "Full Sangam", left_digit: "Left Digit", right_digit: "Right Digit",
};

/** Game types playable in each category, in display order. */
export const CAT_TYPES: Record<Cat, GameType[]> = {
  main: ["single_ank", "jodi", "single_pana", "double_pana", "triple_pana", "half_sangam", "full_sangam"],
  starline: ["single_ank", "single_pana", "double_pana", "triple_pana"],
  gali: ["left_digit", "right_digit", "jodi"],
};

/** Main-market session. Starline/Gali bids have no session. */
export type Session = "open" | "close";

export interface Bank { holder: string; bank: string; account: string; ifsc: string; address: string }

export interface User {
  id: number;
  name: string;
  mobile: string;
  password: string;
  email: string;
  balance: number;
  status: "active" | "inactive";
  betting: boolean; // admin can stop a user from placing bids
  joined: string; // yyyy-mm-dd hh:mm
  lastLogin: string | null;
  loggedIn: boolean;
  bank: Bank;
  paytm: string;
  phonepe: string;
  gpay: string;
}

/** A market. Main: `open` = open-result time, `close` = close-result time. Starline/Gali: only `close` (result time) is used. */
export interface Game {
  id: number;
  cat: Cat;
  name: string;
  open: string; // HH:MM
  close: string; // HH:MM
  active: boolean;
}

export type BidStatus = "pending" | "won" | "lost" | "reverted";
export interface Bid {
  id: number;
  userId: number;
  gameId: number;
  type: GameType;
  session: Session | null;
  /** Ank "6", jodi "65", pana "123", half sangam "123-6" (open) / "456-6" (close), full sangam "123-456" */
  value: string;
  amount: number;
  rate: number; // win per ₹1, locked at bid time
  date: string;
  time: string;
  status: BidStatus;
  win?: number;
  /** Which declaration settled this bid, so deleting a result can undo exactly those bids. */
  settledBy?: "open" | "close";
}

/** One row per market per date. Main uses openPana/closePana; Starline uses openPana; Gali uses jodi. */
export interface Result {
  id: number;
  gameId: number;
  date: string;
  openPana?: string;
  openAt?: string;
  closePana?: string;
  closeAt?: string;
  jodi?: string;
}

export type TxnType = "deposit" | "withdraw" | "bet" | "win" | "refund" | "manual" | "bonus";
export type TxnStatus = "success" | "pending" | "approved" | "rejected";
export interface Txn {
  id: number;
  userId: number;
  type: TxnType;
  dir: "cr" | "dr";
  amount: number;
  date: string;
  time: string;
  status: TxnStatus;
  remark: string;
  mode?: string; // UPI app / Bank
  utr?: string;
  payTo?: string;
}

export interface Notice { id: number; title: string; msg: string; target: string; userId?: number | null; date: string; time: string }
export interface Push { id: number; title: string; msg: string; target: string; sent: number; date: string; time: string }
export interface Role { id: number; name: string; perms: string[] }
export interface AdminUser { id: number; name: string; username: string; role: string; active: boolean }
export interface Audit { id: number; at: string; by: string; action: string; detail: string }
export interface Slider { id: number; title: string; sub: string; c1: string; c2: string }

/** Payout written the way the panel shows it: bet `bet` → win `win`. */
export interface Rate { bet: number; win: number }

export const MODULES = [
  "Dashboard", "Declare Result", "Prediction", "Users", "Roles", "Wallet", "Withdraw",
  "Games", "Starline", "Galidesawar", "Reports", "Notices", "Settings",
] as const;

export interface Settings {
  appName: string;
  marquee: string;
  website: string;
  minDeposit: number;
  maxDeposit: number;
  minWithdraw: number;
  maxWithdraw: number;
  minBid: number;
  maxBid: number;
  welcomeBonus: number;
  upiId: string;
  demoMode: boolean; // ignore market timings: a session stays open until its result is declared
  maintenance: boolean;
  version: string;
  contact: { whatsapp: string; phone: string; email: string; telegram: string };
  howToPlay: string;
  video: string;
  sliders: Slider[];
  withdraw: { days: number[]; from: string; to: string };
  golden: { date: string; anks: number[] };
  rates: Record<Cat, Partial<Record<GameType, Rate>>>;
}

export interface State {
  v: number;
  seq: number;
  users: User[];
  games: Game[];
  bids: Bid[];
  results: Result[];
  txns: Txn[];
  notices: Notice[];
  pushes: Push[];
  roles: Role[];
  admins: AdminUser[];
  audit: Audit[];
  settings: Settings;
}
