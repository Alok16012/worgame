import { fmtDate, hhmm, inr, mins, sum, ymd } from "./format";
import type { Bid, Game, MarketStatus, State, Txn, TxnType } from "./types";

// All game rules live here as plain functions over State. The store clones state before calling
// them, so a thrown GameError leaves the saved data untouched. In production these would run on the server.

export class GameError extends Error {}
const fail = (msg: string): never => { throw new GameError(msg); };

export const nid = (s: State) => ++s.seq;
export const findUser = (s: State, id: number) => s.users.find((u) => u.id === id);
export const findGame = (s: State, id: number) => s.games.find((g) => g.id === id);
export const resultOf = (s: State, gameId: number, date: string) => s.results.find((r) => r.gameId === gameId && r.date === date);

export function log(s: State, action: string, detail: string, by = "admin") {
  s.audit.push({ id: nid(s), at: `${ymd()} ${hhmm()}`, by, action, detail });
}

function addTxn(s: State, userId: number, type: TxnType, dir: "cr" | "dr", amount: number, extra: Partial<Txn> = {}) {
  const t: Txn = { id: nid(s), userId, type, dir, amount, date: ymd(), time: hhmm(), status: "success", ...extra };
  s.txns.push(t);
  return t;
}

export function marketStatus(s: State, g: Game, date = ymd(), now = new Date()): MarketStatus {
  if (!g.active) return "inactive";
  if (resultOf(s, g.id, date)) return "declared";
  if (s.settings.demoMode) return "open";
  if (date < ymd(now)) return "closed";
  if (date > ymd(now)) return "upcoming";
  const c = now.getHours() * 60 + now.getMinutes();
  if (c >= mins(g.open) && c < mins(g.close)) return "open";
  return c < mins(g.open) ? "upcoming" : "closed";
}

export function withdrawOpen(s: State, now = new Date()) {
  const w = s.settings.withdraw;
  const c = now.getHours() * 60 + now.getMinutes();
  return w.days.includes(now.getDay()) && (s.settings.demoMode || (c >= mins(w.from) && c <= mins(w.to)));
}

/* ---------------- player actions ---------------- */

export function placeBids(s: State, userId: number, gameId: number, anks: number[], amount: number) {
  const u = findUser(s, userId) ?? fail("User not found");
  const g = findGame(s, gameId) ?? fail("Game not found");
  if (u.status !== "active") fail("Your account is blocked");
  if (marketStatus(s, g) !== "open") fail("Market is not open for bidding");
  if (!anks.length) fail("Select at least one Ank");
  if (anks.some((a) => !g.numbers.includes(a))) fail("One of the selected Anks is disabled");
  if (!(amount >= s.settings.minBid)) fail(`Minimum bid is ${inr(s.settings.minBid)}`);
  if (amount > s.settings.maxBid) fail(`Maximum bid is ${inr(s.settings.maxBid)}`);
  const total = amount * anks.length;
  if (u.balance < total) fail("Insufficient balance — add money first");
  u.balance -= total;
  for (const ank of anks) {
    s.bids.push({ id: nid(s), userId, gameId, ank, amount, rate: g.rate, date: ymd(), time: hhmm(), status: "pending" });
    addTxn(s, userId, "bet", "dr", amount, { note: `${g.name} • Ank ${ank}` });
  }
  return total;
}

export function deposit(s: State, userId: number, amount: number) {
  const u = findUser(s, userId) ?? fail("User not found");
  if (!(amount >= s.settings.minDeposit)) fail(`Minimum deposit is ${inr(s.settings.minDeposit)}`);
  u.balance += amount;
  addTxn(s, userId, "deposit", "cr", amount, { mode: "UPI", utr: "UTR" + Math.floor(1e8 + Math.random() * 9e8) });
}

export function requestWithdraw(s: State, userId: number, amount: number, upi: string) {
  const u = findUser(s, userId) ?? fail("User not found");
  if (!withdrawOpen(s)) fail("Withdrawals are not allowed right now");
  if (!(amount >= s.settings.minWithdraw)) fail(`Minimum withdrawal is ${inr(s.settings.minWithdraw)}`);
  if (amount > u.balance) fail("Insufficient balance");
  if (!/^[\w.\-]+@[\w]+$/.test(upi.trim())) fail("Enter a valid UPI ID");
  u.balance -= amount; // held until admin approves or rejects
  addTxn(s, userId, "withdraw", "dr", amount, { mode: "UPI", upi: upi.trim(), status: "pending" });
}

export function registerUser(s: State, name: string, mobile: string) {
  if (!name.trim()) fail("Enter your name");
  if (!/^[6-9]\d{9}$/.test(mobile)) fail("Enter a valid 10-digit mobile number");
  if (s.users.some((u) => u.mobile === mobile)) fail("Mobile already registered — please login");
  const u = { id: nid(s), name: name.trim(), mobile, balance: s.settings.welcomeBonus || 0, status: "active" as const, joined: ymd(), kyc: false, upi: `${mobile}@upi` };
  s.users.push(u);
  if (u.balance) addTxn(s, u.id, "manual", "cr", u.balance, { note: "Welcome bonus" });
  return u.id;
}

/* ---------------- admin actions ---------------- */

export function declarePreview(s: State, gameId: number, date: string, ank: number | null) {
  const pending = s.bids.filter((b) => b.gameId === gameId && b.date === date && b.status === "pending");
  const total = sum(pending, (b) => b.amount);
  const winners = ank === null ? [] : pending.filter((b) => b.ank === ank);
  const payout = sum(winners, (b) => b.amount * b.rate);
  return { pending, total, winners, payout, profit: total - payout };
}

export function declareResult(s: State, gameId: number, date: string, ank: number) {
  const g = findGame(s, gameId) ?? fail("Game not found");
  if (resultOf(s, gameId, date)) fail("Result already declared for this market and date");
  if (date > ymd()) fail("Cannot declare a result for a future date");
  if (!Number.isInteger(ank) || ank < 0 || ank > 9) fail("Ank must be 0–9");
  s.results.push({ id: nid(s), gameId, date, ank, at: `${ymd()} ${hhmm()}`, by: "admin" });
  let winners = 0, payout = 0;
  for (const b of s.bids.filter((b) => b.gameId === gameId && b.date === date && b.status === "pending")) {
    if (b.ank === ank) {
      b.status = "won";
      b.win = b.amount * b.rate;
      findUser(s, b.userId)!.balance += b.win;
      addTxn(s, b.userId, "win", "cr", b.win, { note: `${g.name} • Ank ${ank}` });
      winners++;
      payout += b.win;
    } else b.status = "lost";
  }
  s.notices.push({ id: nid(s), title: `Result: ${g.name}`, msg: `${g.name} result for ${fmtDate(date)} is Ank ${ank}.`, target: "All Users", date: ymd(), time: hhmm(), auto: true });
  log(s, "Declare Result", `${g.name} (${fmtDate(date)}) → Ank ${ank} · ${winners} winners · payout ${inr(payout)}`);
  return { winners, payout };
}

export function revertBids(s: State, gameId: number, date: string, onlyId?: number) {
  const g = findGame(s, gameId) ?? fail("Game not found");
  const list = s.bids.filter((b) => b.gameId === gameId && b.date === date && b.status === "pending" && (!onlyId || b.id === onlyId));
  if (!list.length) fail("No pending bids to revert");
  for (const b of list) {
    b.status = "reverted";
    findUser(s, b.userId)!.balance += b.amount;
    addTxn(s, b.userId, "refund", "cr", b.amount, { note: `Bid revert • ${g.name}` });
  }
  const total = sum(list, (b) => b.amount);
  log(s, "Bid Revert", `${g.name} ${fmtDate(date)} · ${list.length} bids · ${inr(total)}`);
  return { count: list.length, total };
}

export function manualFund(s: State, userId: number, dir: "cr" | "dr", amount: number, note: string) {
  const u = findUser(s, userId) ?? fail("Select a user");
  if (!(amount > 0)) fail("Enter a valid amount");
  if (dir === "dr" && u.balance < amount) fail(`User balance is only ${inr(u.balance)}`);
  u.balance += dir === "cr" ? amount : -amount;
  addTxn(s, userId, "manual", dir, amount, { note: note || "Manual" });
  log(s, "Manual Fund", `${dir === "cr" ? "+" : "-"}${inr(amount)} ${u.name} (${note || "Manual"})`);
}

export function decideWithdraw(s: State, txnId: number, status: "approved" | "rejected") {
  const t = s.txns.find((x) => x.id === txnId && x.type === "withdraw") ?? fail("Request not found");
  if (t.status !== "pending") fail("Request already processed");
  const u = findUser(s, t.userId)!;
  t.status = status;
  if (status === "rejected") u.balance += t.amount;
  log(s, `Withdraw ${status}`, `${u.name} ${inr(t.amount)} → ${t.upi ?? u.upi}`);
}

export function setUserStatus(s: State, userId: number, status: "active" | "inactive") {
  const u = findUser(s, userId) ?? fail("User not found");
  u.status = status;
  log(s, "User Status", `${u.name} → ${status}`);
}

/* ---------------- reporting ---------------- */

export const liveBids = (s: State, pred: (b: Bid) => boolean) => s.bids.filter((b) => b.status !== "reverted" && pred(b));

export function gameReport(s: State, date: string, gameId?: number) {
  const bids = liveBids(s, (b) => b.date === date && (!gameId || b.gameId === gameId));
  const tx = s.txns.filter((x) => x.date === date);
  const bidAmt = sum(bids, (b) => b.amount);
  const winAmt = sum(bids, (b) => b.win ?? 0);
  return {
    bids, bidAmt,
    wins: bids.filter((b) => b.status === "won"), winAmt,
    profit: bidAmt - winAmt,
    withdrawals: tx.filter((x) => x.type === "withdraw" && x.status !== "rejected"),
    deposits: tx.filter((x) => x.type === "deposit"),
    manual: tx.filter((x) => x.type === "manual" && x.dir === "cr"),
  };
}

/** Payout the platform would owe for each Ank if it were declared the result. */
export function exposure(s: State, gameId: number, date: string) {
  const bids = liveBids(s, (b) => b.gameId === gameId && b.date === date);
  const total = sum(bids, (b) => b.amount);
  return {
    total,
    count: bids.length,
    rows: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((ank) => {
      const x = bids.filter((b) => b.ank === ank);
      const payout = sum(x, (b) => b.amount * b.rate);
      return { ank, count: x.length, amount: sum(x, (b) => b.amount), payout, pl: total - payout };
    }),
  };
}
