import { addDays, fmtTime, ymd } from "./format";
import { MODULES, type Cat, type Game, type State } from "./types";

// Demo data: 30 users, 13 markets across 3 categories, and 7 days of bids, results,
// deposits and withdrawals. Seeded RNG so every fresh load looks the same (dates are relative to today).

export const STATE_VERSION = 1;

function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NAMES = [
  "Rohan Sharma", "Priya Singh", "Amit Kumar", "Neha Gupta", "Sandeep Yadav", "Rahul Verma", "Pooja Patel", "Vikas Mishra",
  "Anjali Rao", "Suresh Reddy", "Kiran Joshi", "Manoj Tiwari", "Deepak Chauhan", "Sneha Nair", "Arjun Mehta", "Ravi Pandey",
  "Kavita Das", "Ajay Thakur", "Meena Kumari", "Sunil Jain", "Nitin Saxena", "Rekha Bhatt", "Gaurav Malhotra", "Payal Kapoor",
  "Imran Khan", "Harpreet Kaur", "Vivek Dubey", "Shalini Roy", "Tarun Bansal", "Lokesh Soni",
];

export function seedState(): State {
  const r = mulberry32(777);
  const rnd = (a: number, b: number) => a + Math.floor(r() * (b - a + 1));
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  const t2 = () => `${String(rnd(8, 21)).padStart(2, "0")}:${String(rnd(0, 59)).padStart(2, "0")}`;
  let seq = 1000;
  const nid = () => ++seq;
  const today = ymd();

  const s: State = {
    v: STATE_VERSION, seq: 0, users: [], games: [], bids: [], results: [], txns: [], notices: [], pushes: [], roles: [], admins: [], audit: [],
    settings: {
      appName: "Word Game",
      tagline: "Play Smart • Win Big",
      minDeposit: 100,
      minWithdraw: 500,
      minBid: 10,
      maxBid: 10000,
      upiId: "wordgame@upi",
      demoMode: true,
      maintenance: false,
      welcomeBonus: 0,
      version: "1.0.0",
      contact: { whatsapp: "+91 98765 43210", phone: "+91 98765 43210", email: "support@wordgame.app", telegram: "@wordgame_support" },
      howToPlay:
        "1. Add money to your wallet using UPI.\n2. Open any market (game) while it is OPEN.\n3. Pick one or more Anks (single digits 0–9) and enter your bid amount.\n4. When the market closes, the result Ank is declared.\n5. If your Ank matches the result you win Bid × Rate (e.g. ₹10 × 9.5 = ₹95), credited instantly to your wallet.\n6. Withdraw winnings to your UPI ID on allowed withdraw days.",
      video: "https://youtube.com/",
      sliders: [],
      withdraw: { days: [1, 2, 3, 4, 5, 6], from: "10:00", to: "18:00" },
      golden: { date: today, anks: [3, 7, 9] },
    },
  };

  NAMES.forEach((name, i) => {
    s.users.push({
      id: nid(), name, mobile: "9" + rnd(100000000, 999999999), balance: rnd(2, 80) * 100,
      status: i >= 25 ? "inactive" : "active", joined: i < 3 ? today : addDays(-rnd(2, 150)), kyc: r() > 0.3,
      upi: name.split(" ")[0].toLowerCase() + "@okaxis",
    });
  });

  const G = (cat: Cat, name: string, open: string, close: string, rate: number) =>
    s.games.push({ id: nid(), cat, name, open, close, rate, active: true, numbers: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] } satisfies Game);
  G("main", "Morning Star", "09:00", "10:30", 9.5);
  G("main", "Day Special", "11:00", "13:00", 9.5);
  G("main", "Evening Gold", "15:00", "17:00", 9.5);
  G("main", "Night Royal", "20:00", "22:00", 9.5);
  [10, 12, 14, 16, 18, 20].forEach((h) => {
    const hh = String(h).padStart(2, "0");
    G("starline", "Starline " + fmtTime(`${hh}:00`).replace(":00", ""), `${String(h - 1).padStart(2, "0")}:00`, `${hh}:00`, 9);
  });
  G("gali", "Gali", "12:00", "23:00", 9.5);
  G("gali", "Desawar", "06:00", "23:59", 9.5);
  G("gali", "Word Special", "14:00", "19:00", 9.5);

  const active = s.users.filter((u) => u.status === "active");
  for (let d = -6; d <= 0; d++) {
    const date = addDays(d);
    for (const g of s.games) {
      const n = d === 0 ? rnd(6, 18) : rnd(4, 12);
      for (let i = 0; i < n; i++) {
        const u = pick(active);
        const amount = pick([10, 20, 50, 50, 100, 100, 200, 500]);
        const time = t2();
        const ank = rnd(0, 9);
        s.bids.push({ id: nid(), userId: u.id, gameId: g.id, ank, amount, rate: g.rate, date, time, status: "pending" });
        s.txns.push({ id: nid(), userId: u.id, type: "bet", dir: "dr", amount, date, time, status: "success", note: `${g.name} • Ank ${ank}` });
      }
      if (d < 0 || g.name === "Starline 10 AM") {
        const ank = rnd(0, 9);
        s.results.push({ id: nid(), gameId: g.id, date, ank, at: `${date} ${g.close}`, by: "admin" });
        for (const b of s.bids.filter((b) => b.gameId === g.id && b.date === date)) {
          if (b.ank === ank) {
            b.status = "won";
            b.win = b.amount * b.rate;
            s.txns.push({ id: nid(), userId: b.userId, type: "win", dir: "cr", amount: b.win, date, time: g.close, status: "success", note: `${g.name} • Ank ${ank}` });
          } else b.status = "lost";
        }
      }
    }
    for (let i = rnd(3, 6); i > 0; i--) {
      s.txns.push({ id: nid(), userId: pick(active).id, type: "deposit", dir: "cr", mode: "UPI", amount: pick([100, 200, 500, 1000, 2000]), date, time: t2(), status: "success", utr: "UTR" + rnd(100000000, 999999999) });
    }
  }
  for (let i = 0; i < 4; i++) {
    s.txns.push({ id: nid(), userId: pick(active).id, type: "manual", dir: "cr", amount: pick([500, 1000, 2000]), date: addDays(-rnd(0, 5)), time: "12:30", status: "success", note: "Cash received at office" });
  }
  for (let i = 0; i < 9; i++) {
    const u = pick(active);
    s.txns.push({
      id: nid(), userId: u.id, type: "withdraw", dir: "dr", mode: "UPI", upi: u.upi, amount: pick([500, 1000, 1500, 2000]),
      date: addDays(i < 5 ? -rnd(0, 1) : -rnd(2, 6)), time: t2(), status: i < 5 ? "pending" : i === 8 ? "rejected" : "approved",
    });
  }
  s.txns.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  s.roles = [
    { id: nid(), name: "Super Admin", perms: [...MODULES] },
    { id: nid(), name: "Game Manager", perms: ["Dashboard", "Declare Result", "Prediction", "Games", "Starline", "Galidesawar", "Reports"] },
    { id: nid(), name: "Accountant", perms: ["Dashboard", "Wallet", "Withdraw", "Reports"] },
    { id: nid(), name: "Support", perms: ["Dashboard", "Users", "Notices"] },
  ];
  s.admins = [
    { id: nid(), name: "Alok Kumar", username: "admin", role: "Super Admin", active: true },
    { id: nid(), name: "Ramesh Ops", username: "ramesh.ops", role: "Game Manager", active: true },
    { id: nid(), name: "Sita Accounts", username: "sita.acc", role: "Accountant", active: true },
  ];
  s.notices = [
    { id: nid(), title: "Welcome to Word Game", msg: "Play smart, win big! Check How To Play in your profile.", target: "All Users", date: addDays(-5), time: "10:00" },
    { id: nid(), title: "New market: Word Special", msg: "Word Special market is now live from 2 PM to 7 PM daily.", target: "All Users", date: addDays(-1), time: "09:15" },
  ];
  s.pushes = [{ id: nid(), title: "Results are out!", msg: "Morning Star result declared. Check now.", target: "All Users", sent: 25, date: addDays(-1), time: "10:31" }];
  s.settings.sliders = [
    { id: nid(), title: "Play Smart • Win Big", sub: "Get 9.5x on every correct Ank", c1: "#5b3df5", c2: "#1a2152" },
    { id: nid(), title: "Big Wins Faster", sub: "Starline results every 2 hours", c1: "#f59e0b", c2: "#7c2d12" },
  ];
  const y = s.results.find((x) => x.date === addDays(-1));
  s.audit = [{ id: nid(), at: `${addDays(-1)} 10:31`, by: "admin", action: "Declare Result", detail: `Morning Star → Ank ${y?.ank ?? 0}` }];
  s.seq = seq;
  return s;
}
