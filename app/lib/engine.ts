import { addDays, fmtDate, hhmm, inr, mins, sum, ymd } from "./format";
import { isPana, panaDigit, panaType, resultText } from "./matka";
import { CAT_TYPES, TYPE_LABEL, type Bid, type Cat, type Game, type GameType, type Result, type Session, type PayMethod, type State, type Txn, type TxnType, type User } from "./types";

// All game rules as plain functions over State. The store runs them on a cloned draft, so a thrown
// GameError leaves saved data untouched. In production each exported action becomes a server endpoint
// wrapped in a DB transaction.

export class GameError extends Error {}
const fail = (msg: string): never => { throw new GameError(msg); };

export const nid = (s: State) => ++s.seq;
export const findUser = (s: State, id: number) => s.users.find((u) => u.id === id);
export const findGame = (s: State, id: number) => s.games.find((g) => g.id === id);
export const resultOf = (s: State, gameId: number, date: string) => s.results.find((r) => r.gameId === gameId && r.date === date);
const round2 = (n: number) => Math.round(n * 100) / 100;

export function log(s: State, action: string, detail: string, by = "admin") {
  s.audit.push({ id: nid(s), at: `${ymd()} ${hhmm()}`, by, action, detail });
}

type At = { date: string; time: string };
const nowAt = (): At => ({ date: ymd(), time: hhmm() });

function addTxn(s: State, userId: number, type: TxnType, dir: "cr" | "dr", amount: number, remark: string, extra: Partial<Txn> = {}, at: At = nowAt()) {
  const t: Txn = { id: nid(s), userId, type, dir, amount, remark, status: "success", ...at, ...extra };
  s.txns.push(t);
  return t;
}

export const rateOf = (s: State, cat: Cat, type: GameType) => {
  const r = s.settings.rates[cat][type];
  return r && r.bet > 0 ? r.win / r.bet : 0;
};

/* ---------------- market timing ---------------- */

export interface MarketState { openOk: boolean; closeOk: boolean; anyOk: boolean; types: GameType[] }
const CLOSED: MarketState = { openOk: false, closeOk: false, anyOk: false, types: [] };
const CLOSE_TYPES: GameType[] = ["single_ank", "single_pana", "double_pana", "triple_pana"];

/** Market holiday (e.g. Mein Bazar on Saturday and Sunday). */
export const isOffDay = (g: Game, now = new Date()) => (g.offDays ?? []).includes(now.getDay());

/**
 * Which sessions accept bids right now. Main: open session until the open time (or open result),
 * close session until the close time (or close result); after the open session only close-session
 * Single Ank / Pana bids are possible. Timings always apply, also in demo mode.
 */
export function marketState(s: State, g: Game, now = new Date()): MarketState {
  if (!g.active || isOffDay(g, now)) return CLOSED;
  const r = resultOf(s, g.id, ymd(now));
  const t = now.getHours() * 60 + now.getMinutes();
  if (g.cat === "main") {
    const openOk = !r?.openPana && t < mins(g.open);
    const closeOk = !r?.closePana && t < mins(g.close);
    return { openOk, closeOk, anyOk: openOk || closeOk, types: openOk ? CAT_TYPES.main : closeOk ? CLOSE_TYPES : [] };
  }
  const done = g.cat === "starline" ? !!r?.openPana : !!r?.jodi;
  const ok = !done && t < mins(g.close);
  return ok ? { openOk: true, closeOk: true, anyOk: true, types: CAT_TYPES[g.cat] } : CLOSED;
}

/** Results stay on the home screen until this hour of the next morning. */
export const RESULT_HOLD_HOUR = 8;

/** The result "day" the app is on: before 8 AM it is still yesterday (night markets finish after midnight). */
export const gameDay = (now = new Date()) => (now.getHours() < RESULT_HOLD_HOUR ? addDays(-1, now) : ymd(now));

/** Result to show on a market card: today's if declared, else (before 8 AM) yesterday's. */
export function displayResult(s: State, g: Game, now = new Date()) {
  const today = resultOf(s, g.id, ymd(now));
  return today || now.getHours() >= RESULT_HOLD_HOUR ? today : resultOf(s, g.id, addDays(-1, now));
}

export function withdrawOpen(s: State, now = new Date()) {
  const w = s.settings.withdraw;
  const c = now.getHours() * 60 + now.getMinutes();
  return w.days.includes(now.getDay()) && (s.settings.demoMode || (c >= mins(w.from) && c <= mins(w.to)));
}

/* ---------------- bids ---------------- */

export function validValue(type: GameType, value: string, session: Session | null) {
  switch (type) {
    case "single_ank": case "left_digit": case "right_digit": return /^\d$/.test(value);
    case "jodi": return /^\d{2}$/.test(value);
    case "single_pana": case "double_pana": case "triple_pana": return panaType(value) === type;
    case "half_sangam": {
      const [p, d] = value.split("-");
      return !!session && isPana(p ?? "") && /^\d$/.test(d ?? "");
    }
    case "full_sangam": {
      const [p, q] = value.split("-");
      return isPana(p ?? "") && isPana(q ?? "");
    }
  }
}

export interface BidInput { type: GameType; session: Session | null; value: string; amount: number }

export function placeBids(s: State, userId: number, gameId: number, items: BidInput[]) {
  const u = findUser(s, userId) ?? fail("User not found");
  const g = findGame(s, gameId) ?? fail("Game not found");
  if (u.status !== "active") fail("Your account is blocked. Contact admin.");
  if (!u.betting) fail("Betting is disabled for your account. Contact admin.");
  if (!items.length) fail("Please enter at least one bid");
  const st = marketState(s, g);
  for (const it of items) {
    if (!st.types.includes(it.type)) fail(`${TYPE_LABEL[it.type]} is closed for ${g.name}`);
    if (g.cat === "main") {
      const needsOpen = it.type === "jodi" || it.type === "half_sangam" || it.type === "full_sangam" || it.session === "open";
      if (needsOpen && !st.openOk) fail("Open session is closed for this market");
      if (it.session === "close" && !st.closeOk) fail("Close session is closed for this market");
    }
    if (!validValue(it.type, it.value, it.session)) fail(`Invalid number ${it.value} for ${TYPE_LABEL[it.type]}`);
    if (!Number.isInteger(it.amount) || it.amount < s.settings.minBid) fail(`Minimum bid amount is ${inr(s.settings.minBid)}`);
    if (it.amount > s.settings.maxBid) fail(`Maximum bid amount is ${inr(s.settings.maxBid)}`);
  }
  const total = sum(items, (i) => i.amount);
  if (u.balance < total) fail(`Insufficient wallet balance. Your balance is: ${u.balance}`);
  u.balance -= total;
  const at = nowAt();
  for (const it of items) {
    s.bids.push({ id: nid(s), userId, gameId, type: it.type, session: g.cat === "main" ? it.session : null, value: it.value, amount: it.amount, rate: rateOf(s, g.cat, it.type), ...at, status: "pending" });
    addTxn(s, userId, "bet", "dr", it.amount, `Bid placed successfully for the game: ${g.name}`, {}, at);
  }
  return total;
}

/** true/false once the result decides the bid; null while it is still undecided. */
export function judge(b: Bid, cat: Cat, r: Partial<Result> | undefined): boolean | null {
  if (!r) return null;
  if (cat === "gali") {
    const j = r.jodi;
    if (!j) return null;
    return b.type === "left_digit" ? b.value === j[0] : b.type === "right_digit" ? b.value === j[1] : b.value === j;
  }
  const P = r.openPana, Q = r.closePana;
  if (cat === "starline") return P ? (b.type === "single_ank" ? b.value === panaDigit(P) : b.value === P) : null;
  switch (b.type) {
    case "single_ank": { const p = b.session === "open" ? P : Q; return p ? b.value === panaDigit(p) : null; }
    case "single_pana": case "double_pana": case "triple_pana": { const p = b.session === "open" ? P : Q; return p ? b.value === p : null; }
    case "jodi": return P && Q ? b.value === panaDigit(P) + panaDigit(Q) : null;
    case "half_sangam": if (!P || !Q) return null; return b.session === "open" ? b.value === `${P}-${panaDigit(Q)}` : b.value === `${Q}-${panaDigit(P)}`;
    case "full_sangam": return P && Q ? b.value === `${P}-${Q}` : null;
    default: return null;
  }
}

export function settle(s: State, g: Game, date: string, by: "open" | "close", at: At) {
  const r = resultOf(s, g.id, date);
  let winners = 0, payout = 0;
  for (const b of s.bids) {
    if (b.gameId !== g.id || b.date !== date || b.status !== "pending") continue;
    const w = judge(b, g.cat, r);
    if (w === null) continue;
    b.settledBy = by;
    if (w) {
      b.status = "won";
      b.win = round2(b.amount * b.rate);
      findUser(s, b.userId)!.balance += b.win;
      addTxn(s, b.userId, "win", "cr", b.win, `Win amount for the game: ${g.name} (${TYPE_LABEL[b.type]} ${b.value})`, {}, at);
      winners++;
      payout += b.win;
    } else b.status = "lost";
  }
  return { winners, payout };
}

function proposed(s: State, g: Game, date: string, session: Session, value: string): Partial<Result> {
  const cur: Partial<Result> = { ...(resultOf(s, g.id, date) ?? {}) };
  if (g.cat === "gali") cur.jodi = value;
  else if (session === "open" || g.cat === "starline") cur.openPana = value;
  else cur.closePana = value;
  return cur;
}

function checkDeclare(s: State, g: Game, date: string, session: Session, value: string) {
  if (date > ymd()) fail("Cannot declare a result for a future date");
  const r = resultOf(s, g.id, date);
  if (g.cat === "gali") {
    if (!/^\d{2}$/.test(value)) fail("Enter a 2-digit jodi");
    if (r?.jodi) fail("Result already declared");
    return;
  }
  if (!isPana(value)) fail(`${value || "Pana"} is not a valid pana`);
  if (g.cat === "starline" || session === "open") { if (r?.openPana) fail("Open result already declared"); }
  else {
    if (!r?.openPana) fail("Declare the open result first");
    if (r?.closePana) fail("Close result already declared");
  }
}

/** "Show Winner": bids that would win if this result were declared. */
export function previewWinners(s: State, gameId: number, date: string, session: Session, value: string) {
  const g = findGame(s, gameId) ?? fail("Select a game");
  checkDeclare(s, g, date, session, value);
  const r = proposed(s, g, date, session, value);
  const pending = s.bids.filter((b) => b.gameId === gameId && b.date === date && b.status === "pending");
  const winners = pending.filter((b) => judge(b, g.cat, r) === true).map((b) => ({ ...b, win: round2(b.amount * b.rate) }));
  const settled = pending.filter((b) => judge(b, g.cat, r) !== null);
  return { winners, payout: sum(winners, (b) => b.win), settledAmount: sum(settled, (b) => b.amount) };
}

export function declareResult(s: State, gameId: number, date: string, session: Session, value: string) {
  const g = findGame(s, gameId) ?? fail("Select a game");
  checkDeclare(s, g, date, session, value);
  const at = nowAt();
  let r = resultOf(s, gameId, date);
  if (!r) { r = { id: nid(s), gameId, date }; s.results.push(r); }
  Object.assign(r, proposed(s, g, date, session, value));
  const stamp = `${at.date} ${at.time}`;
  const by: "open" | "close" = g.cat === "main" && session === "close" ? "close" : "open";
  if (by === "open") r.openAt = stamp; else r.closeAt = stamp;
  const out = settle(s, g, date, by, at);
  s.notices.push({ id: nid(s), title: `${g.name} result`, msg: `${g.name} (${fmtDate(date)}): ${resultText(g.cat, r)}`, target: "All Users", date: at.date, time: at.time });
  log(s, "Declare Result", `${g.name} ${fmtDate(date)} ${g.cat === "main" ? session : ""} → ${value} · ${out.winners} winners · ${inr(out.payout)}`);
  return out;
}

/** Delete a declared session: winnings are taken back and the bids return to pending. */
export function deleteResult(s: State, gameId: number, date: string, session: Session) {
  const g = findGame(s, gameId) ?? fail("Game not found");
  const r = resultOf(s, gameId, date) ?? fail("No result to delete");
  const by: "open" | "close" = g.cat === "main" && session === "close" ? "close" : "open";
  if (g.cat === "main" && by === "open" && r.closePana) fail("Delete the close result first");
  for (const b of s.bids) {
    if (b.gameId !== gameId || b.date !== date || b.settledBy !== by) continue;
    if (b.status === "won" && b.win) {
      findUser(s, b.userId)!.balance -= b.win;
      addTxn(s, b.userId, "win", "dr", b.win, `Result deleted — win reversed for the game: ${g.name}`);
    }
    b.status = "pending";
    delete b.win;
    delete b.settledBy;
  }
  if (g.cat === "gali") delete r.jodi;
  else if (by === "open") { delete r.openPana; delete r.openAt; }
  else { delete r.closePana; delete r.closeAt; }
  if (!r.openPana && !r.closePana && !r.jodi) s.results = s.results.filter((x) => x.id !== r.id);
  log(s, "Delete Result", `${g.name} ${fmtDate(date)} ${by}`);
}

export interface BidEdit { gameId: number; type: GameType; session: Session | null; value: string; amount: number }

/**
 * Admin correction of a placed bid (customer picked the wrong number / market). Only before its result
 * is declared. The rate is re-locked for the new game type; an amount change is settled with the wallet.
 */
export function editBid(s: State, bidId: number, e: BidEdit) {
  const b = s.bids.find((x) => x.id === bidId) ?? fail("Bid not found");
  if (b.status !== "pending") fail("Only bids without a result can be edited");
  const from = findGame(s, b.gameId)!;
  const g = findGame(s, e.gameId) ?? fail("Select a game");
  if (g.cat !== from.cat) fail(`Choose a ${from.cat === "main" ? "main market" : from.cat} game`);
  if (!CAT_TYPES[g.cat].includes(e.type)) fail(`${TYPE_LABEL[e.type]} is not played in ${g.name}`);
  const session = g.cat === "main" && e.type !== "jodi" && e.type !== "full_sangam" ? e.session : null;
  if (g.cat === "main" && e.type !== "jodi" && e.type !== "full_sangam" && !session) fail("Select a session");
  if (!validValue(e.type, e.value, session)) fail(`Invalid number ${e.value} for ${TYPE_LABEL[e.type]}`);
  if (!Number.isInteger(e.amount) || e.amount < s.settings.minBid) fail(`Minimum bid amount is ${inr(s.settings.minBid)}`);
  const next = { ...b, gameId: g.id, type: e.type, session, value: e.value, amount: e.amount };
  if (judge(next, g.cat, resultOf(s, g.id, b.date)) !== null) fail("Result for this session is already declared — cannot move the bid there");
  const u = findUser(s, b.userId)!;
  const diff = e.amount - b.amount;
  if (diff > u.balance) fail(`User balance is only ${inr(u.balance)}`);
  if (diff) {
    u.balance -= diff;
    addTxn(s, u.id, diff > 0 ? "bet" : "refund", diff > 0 ? "dr" : "cr", Math.abs(diff), `Bid amount corrected by admin for the game: ${g.name}`);
  }
  const before = `${from.name} ${TYPE_LABEL[b.type]} ${b.value} ₹${b.amount}`;
  Object.assign(b, { gameId: g.id, type: e.type, session, value: e.value, amount: e.amount, rate: rateOf(s, g.cat, e.type) });
  log(s, "Edit Bid", `${u.name}: ${before} → ${g.name} ${TYPE_LABEL[e.type]} ${e.value} ₹${e.amount}`);
}

/** Refund pending bids of a market/date (cancelled market), or one bid by id. */
export function revertBids(s: State, gameId: number, date: string, onlyId?: number) {
  const g = findGame(s, gameId) ?? fail("Game not found");
  const list = s.bids.filter((b) => b.gameId === gameId && b.date === date && b.status === "pending" && (!onlyId || b.id === onlyId));
  if (!list.length) fail("No pending bids to revert");
  for (const b of list) {
    b.status = "reverted";
    findUser(s, b.userId)!.balance += b.amount;
    addTxn(s, b.userId, "refund", "cr", b.amount, `Bid reverted for the game: ${g.name}`);
  }
  const total = sum(list, (b) => b.amount);
  log(s, "Bid Revert", `${g.name} ${fmtDate(date)} · ${list.length} bids · ${inr(total)}`);
  return { count: list.length, total };
}

/* ---------------- wallet ---------------- */

function checkDeposit(s: State, amount: number) {
  const { minDeposit: lo, maxDeposit: hi } = s.settings;
  if (!Number.isInteger(amount) || amount < lo || amount > hi) fail(`Deposit range is ${inr(lo)} - ${inr(hi)}`);
}

/** Auto UPI (setting ON): the payment is confirmed, credit straight away. */
export function deposit(s: State, userId: number, amount: number, app: string) {
  const u = findUser(s, userId) ?? fail("User not found");
  checkDeposit(s, amount);
  u.balance += amount;
  // Credited straight away but "success" = not yet checked by admin (Auto Deposit History → Approve / Reject).
  addTxn(s, userId, "deposit", "cr", amount, "Deposit Fund", { mode: app, utr: "UTR" + Math.floor(1e11 + Math.random() * 9e11), status: "success" });
}

/** Deposit money that is really in the user's wallet: auto UPI (checked or not) or an approved request. */
export const isCredited = (t: Txn) => t.type === "deposit" && (t.status === "approved" || t.status === "success");

/** Admin check of an auto UPI deposit. Reject takes the credited amount back out of the wallet. */
export function decideAutoDeposit(s: State, txnId: number, status: "approved" | "rejected") {
  const t = s.txns.find((x) => x.id === txnId && x.type === "deposit") ?? fail("Deposit not found");
  if (t.status !== "success") fail("Deposit already checked");
  const u = findUser(s, t.userId)!;
  t.status = status;
  if (status === "rejected") {
    u.balance -= t.amount;
    t.remark = "Deposit rejected by admin — amount reversed";
  }
  log(s, `Auto Deposit ${status}`, `${u.name} ${inr(t.amount)} ${t.mode ?? ""} ${t.utr ?? ""}${status === "rejected" && u.balance < 0 ? ` (wallet now ${inr(u.balance)})` : ""}`);
}

/** Manual mode (setting OFF): the player raises an Add Fund request; nothing is credited until the admin approves. */
export function requestFund(s: State, userId: number, amount: number) {
  findUser(s, userId) ?? fail("User not found");
  checkDeposit(s, amount);
  if (s.txns.some((x) => x.userId === userId && x.type === "deposit" && x.status === "pending")) fail("You already have a pending Add Fund request");
  addTxn(s, userId, "deposit", "cr", amount, "Add fund request", { mode: "Manual", status: "pending" });
}

export function decideFund(s: State, txnId: number, status: "approved" | "rejected") {
  const t = s.txns.find((x) => x.id === txnId && x.type === "deposit") ?? fail("Request not found");
  if (t.status !== "pending") fail("Request already processed");
  const u = findUser(s, t.userId)!;
  t.status = status;
  if (status === "approved") {
    u.balance += t.amount;
    t.remark = "Add fund request approved";
  } else t.remark = "Add fund request rejected";
  const now = nowAt();
  t.date = now.date;
  t.time = now.time;
  log(s, `Add Fund ${status}`, `${u.name} ${inr(t.amount)}`);
}

const METHOD_FIELD = { PhonePe: "phonepe", "Google Pay": "gpay", Paytm: "paytm", "UPI ID": "upi" } as const;

/** Withdraw to a UPI method (PhonePe / Google Pay / Paytm number, or a UPI ID). The number is saved on the profile. */
export function requestWithdraw(s: State, userId: number, amount: number, method: PayMethod, account: string) {
  const u = findUser(s, userId) ?? fail("User not found");
  const w = s.settings.withdraw;
  if (!withdrawOpen(s)) fail(`Withdraw time is ${w.from} to ${w.to}`);
  const acc = account.trim();
  if (method === "UPI ID" ? !/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(acc) : !/^[6-9]\d{9}$/.test(acc)) fail(method === "UPI ID" ? "Enter a valid UPI ID" : `Enter a valid ${method} number`);
  const { minWithdraw: lo, maxWithdraw: hi } = s.settings;
  if (!Number.isInteger(amount) || amount < lo) fail(`Minimum Amount is ${lo}`);
  if (amount > hi) fail(`Maximum Amount is ${hi}`);
  if (amount > u.balance) fail("You don't have enough fund!");
  u[METHOD_FIELD[method]] = acc;
  u.balance -= amount; // held until the admin approves or rejects
  addTxn(s, userId, "withdraw", "dr", amount, "Withdraw request", { status: "pending", mode: method, payTo: `${method} ${acc}` });
}

export function decideWithdraw(s: State, txnId: number, status: "approved" | "rejected") {
  const t = s.txns.find((x) => x.id === txnId && x.type === "withdraw") ?? fail("Request not found");
  if (t.status !== "pending") fail("Request already processed");
  const u = findUser(s, t.userId)!;
  t.status = status;
  if (status === "rejected") {
    u.balance += t.amount;
    t.remark = "Withdraw request rejected";
    addTxn(s, t.userId, "refund", "cr", t.amount, `Withdraw rejected — ₹${t.amount} refunded to wallet`);
  } else t.remark = "Withdraw request approved";
  log(s, `Withdraw ${status}`, `${u.name} ${inr(t.amount)} → ${t.payTo}`);
}

/** Admin "Add Money" / "Withdraw" on a user. */
export function manualFund(s: State, userId: number, dir: "cr" | "dr", amount: number, remark = "") {
  const u = findUser(s, userId) ?? fail("Select a user");
  if (!(amount > 0)) fail("Enter a valid amount");
  if (dir === "dr" && u.balance < amount) fail(`User balance is only ${inr(u.balance)}`);
  u.balance += dir === "cr" ? amount : -amount;
  addTxn(s, userId, "manual", dir, amount, remark || (dir === "cr" ? "Amount added by admin" : "Amount withdrawn by admin"), { mode: "Admin" });
  log(s, dir === "cr" ? "Add Money" : "Withdraw Money", `${u.name} ${inr(amount)}`);
}

/* ---------------- accounts ---------------- */

export function registerUser(s: State, name: string, mobile: string, password: string) {
  if (!name.trim()) fail("Please enter your full name");
  if (!/^[6-9]\d{9}$/.test(mobile)) fail("Please enter a valid 10-digit mobile number");
  if (password.length < 4) fail("Password must be at least 4 characters");
  if (s.users.some((u) => u.mobile === mobile)) fail("Mobile number already registered. Please login.");
  const now = `${ymd()} ${hhmm()}`;
  const u: User = {
    id: nid(s), name: name.trim(), mobile, password, email: "", balance: 0, status: "active", betting: true, joined: now, lastLogin: now, loggedIn: true,
    bank: { holder: "", bank: "", account: "", ifsc: "", address: "" }, paytm: "", phonepe: "", gpay: "", upi: "",
  };
  s.users.push(u);
  if (s.settings.welcomeBonus > 0) {
    u.balance += s.settings.welcomeBonus;
    addTxn(s, u.id, "bonus", "cr", s.settings.welcomeBonus, "Welcome Bonus");
  }
  return u.id;
}

export function loginUser(s: State, mobile: string, password: string) {
  const u = s.users.find((x) => x.mobile === mobile) ?? fail("Mobile number is not registered");
  if (u.password !== password) fail("Password is incorrect");
  if (u.status !== "active") fail("Your account is blocked. Contact admin.");
  u.lastLogin = `${ymd()} ${hhmm()}`;
  u.loggedIn = true;
  return u.id;
}

export function updateUser(s: State, userId: number, patch: Partial<User>, action?: string) {
  const u = findUser(s, userId) ?? fail("User not found");
  Object.assign(u, patch);
  if (action) log(s, action, u.name);
}

/* ---------------- reporting ---------------- */

export const liveBids = (s: State, pred: (b: Bid) => boolean) => s.bids.filter((b) => b.status !== "reverted" && pred(b));

export function gameReport(s: State, date: string, gameId?: number) {
  const bids = liveBids(s, (b) => b.date === date && (!gameId || b.gameId === gameId));
  const tx = s.txns.filter((x) => x.date === date);
  const bidAmt = sum(bids, (b) => b.amount);
  const winAmt = sum(bids, (b) => b.win ?? 0);
  return {
    bids, bidAmt, wins: bids.filter((b) => b.status === "won"), winAmt, profit: bidAmt - winAmt,
    withdrawals: tx.filter((x) => x.type === "withdraw" && x.status !== "rejected"),
    deposits: tx.filter(isCredited),
    manual: tx.filter((x) => x.type === "manual" && x.dir === "cr"),
  };
}
