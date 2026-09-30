// Core domain model for Word Game (see README → "How the game works").

export type Cat = "main" | "starline" | "gali";
export const CATS: Cat[] = ["main", "starline", "gali"];
export const CAT_LABEL: Record<Cat, string> = { main: "Main Game", starline: "Starline", gali: "Galidesawar" };
export const CAT_ICON: Record<Cat, string> = { main: "🎲", starline: "⭐", gali: "🌙" };
export const ANKS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

export interface User {
  id: number;
  name: string;
  mobile: string;
  balance: number;
  status: "active" | "inactive";
  joined: string; // yyyy-mm-dd
  kyc: boolean;
  upi: string;
}

/** A market: bidding is allowed between open and close, then one result Ank is declared per day. */
export interface Game {
  id: number;
  cat: Cat;
  name: string;
  open: string; // HH:MM
  close: string; // HH:MM
  rate: number; // payout multiplier, e.g. 9.5 → ₹10 bid wins ₹95
  active: boolean;
  numbers: number[]; // Anks users may bid on
}

export type BidStatus = "pending" | "won" | "lost" | "reverted";
export interface Bid {
  id: number;
  userId: number;
  gameId: number;
  ank: number;
  amount: number;
  rate: number; // locked when the bid is placed
  date: string;
  time: string;
  status: BidStatus;
  win?: number;
}

export interface Result {
  id: number;
  gameId: number;
  date: string;
  ank: number;
  at: string;
  by: string;
}

export type TxnType = "deposit" | "withdraw" | "bet" | "win" | "refund" | "manual";
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
  mode?: string;
  utr?: string;
  upi?: string;
  note?: string;
}

export interface Notice {
  id: number;
  title: string;
  msg: string;
  target: string;
  userId?: number | null;
  date: string;
  time: string;
  auto?: boolean;
}

export interface Push {
  id: number;
  title: string;
  msg: string;
  target: string;
  sent: number;
  date: string;
  time: string;
}

export const MODULES = [
  "Dashboard", "Declare Result", "Prediction", "Users", "Roles", "Wallet", "Withdraw",
  "Games", "Starline", "Galidesawar", "Reports", "Notices", "Settings",
] as const;

export interface Role { id: number; name: string; perms: string[] }
export interface AdminUser { id: number; name: string; username: string; role: string; active: boolean }
export interface Audit { id: number; at: string; by: string; action: string; detail: string }
export interface Slider { id: number; title: string; sub: string; c1: string; c2: string }

export interface Settings {
  appName: string;
  tagline: string;
  minDeposit: number;
  minWithdraw: number;
  minBid: number;
  maxBid: number;
  upiId: string;
  demoMode: boolean; // keep every market open regardless of timings
  maintenance: boolean;
  welcomeBonus: number;
  version: string;
  contact: { whatsapp: string; phone: string; email: string; telegram: string };
  howToPlay: string;
  video: string;
  sliders: Slider[];
  withdraw: { days: number[]; from: string; to: string };
  golden: { date: string; anks: number[] };
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

export type MarketStatus = "open" | "closed" | "upcoming" | "declared" | "inactive";
