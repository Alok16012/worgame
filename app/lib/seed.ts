import { addDays, hhmm, mins, ymd } from "./format";
import { DOUBLE_PANA, JODIS, SINGLE_PANA, TRIPLE_PANA } from "./matka";
import { nid, settle } from "./engine";
import { MODULES, type Cat, type GameType, type Session, type State, type User } from "./types";

// Demo data modelled on the live panel: the same market names and timings, 30 players and
// 7 days of bids, results, deposits and withdrawals. Seeded RNG, dates relative to today.

export const STATE_VERSION = 4;

function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// [name, open result time, close result time]
const MARKETS: [string, string, string][] = [
  ["RADHA MORNING", "09:15", "10:05"], ["SITA MORNING", "09:45", "10:40"], ["SRIDEVI MORNING", "10:00", "11:00"],
  ["KARNATAKA DAY", "10:05", "10:55"], ["MILAN MORNING", "10:30", "11:30"], ["LATA MORNING", "11:00", "12:00"],
  ["KALYAN MORNING", "11:00", "12:00"], ["MADHUR MORNING", "11:20", "12:20"], ["SRIDEVI", "11:35", "12:35"],
  ["TIME BAZAR", "13:00", "14:00"], ["MADHUR DAY", "13:20", "14:20"], ["SITA DAY", "13:44", "14:45"],
  ["RADHA DAY", "14:00", "15:00"], ["RAJDHANI DAY", "15:05", "16:55"], ["MILAN DAY", "15:05", "17:05"],
  ["LATA DAY", "15:25", "17:25"], ["SUPREME DAY", "15:40", "17:40"], ["KALYAN", "15:40", "17:40"],
  ["LATA NIGHT", "18:25", "19:25"], ["KARNATAKA NIGHT", "18:35", "19:35"], ["SITA NIGHT", "18:43", "19:43"],
  ["SRIDEVI NIGHT", "19:15", "20:15"], ["MADHUR NIGHT", "20:25", "22:25"], ["SUPREME NIGHT", "20:45", "22:44"],
  ["MILAN NIGHT", "21:05", "23:05"], ["KALYAN NIGHT", "21:20", "23:20"], ["RAJDHANI NIGHT", "21:20", "23:30"],
  ["MEIN BAZAR", "21:50", "23:55"],
];
const STARLINE = ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"];
const GALI: [string, string][] = [["DESAWAR", "05:00"], ["FARIDABAD", "18:10"], ["GHAZIABAD", "21:00"], ["GALI", "23:30"]];

const NAMES = [
  "Rohit Kumar", "Priya Singh", "Amit Yadav", "Neha Gupta", "Sandeep Verma", "Rahul Sharma", "Pooja Patel", "Vikas Mishra",
  "Anjali Rao", "Suresh Reddy", "Kiran Joshi", "Manoj Tiwari", "Deepak Chauhan", "Sneha Nair", "Arjun Mehta", "Ravi Pandey",
  "Kavita Das", "Ajay Thakur", "Meena Kumari", "Sunil Jain", "Nitin Saxena", "Rekha Bhatt", "Gaurav Malhotra", "Payal Kapoor",
  "Imran Khan", "Harpreet Kaur", "Vivek Dubey", "Shalini Roy", "Tarun Bansal", "Lokesh Soni",
];

export const DEMO_LOGIN = { mobile: "9876543210", password: "123456" };

export function seedState(): State {
  const r = mulberry32(777);
  const rnd = (a: number, b: number) => a + Math.floor(r() * (b - a + 1));
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  const t2 = (lo = 8, hi = 21) => `${String(rnd(lo, hi)).padStart(2, "0")}:${String(rnd(0, 59)).padStart(2, "0")}`;
  const today = ymd();
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();

  const s: State = {
    v: STATE_VERSION, seq: 1000, users: [], games: [], bids: [], results: [], txns: [], notices: [], pushes: [], roles: [], admins: [], audit: [],
    settings: {
      appName: "Shri Kalyan",
      marquee: "WELCOME TO SHRI KALYAN • फ्रॉड ऐप से सावधान • Play only on the official app",
      website: "",
      minDeposit: 1, maxDeposit: 100000, minWithdraw: 1000, maxWithdraw: 200000, minBid: 5, maxBid: 10000, welcomeBonus: 10,
      upiId: "shrikalyan@upi", autoUpi: true, demoMode: true, maintenance: false, version: "1.0.0",
      contact: { whatsapp: "+91 98765 43210", phone: "+91 98765 43210", email: "support@shrikalyan.app", telegram: "@shrikalyan_official" },
      howToPlay:
        "1. Deposit money in your wallet from Deposit Fund.\n2. Tap Play on any market that is open.\n3. Choose a game type: Single Ank, Jodi, Single/Double/Triple Pana, Half or Full Sangam.\n4. Choose OPEN or CLOSE session, type your amount on the numbers you want and tap Submit Bids.\n5. Results are declared at the market's OPEN and CLOSE time, e.g. 123-65-456.\n6. Winning amount (bid × rate) is added to your wallet automatically. Withdraw to your bank in withdraw time.",
      video: "https://youtube.com/",
      sliders: [],
      withdraw: { days: [0, 1, 2, 3, 4, 5, 6], from: "00:00", to: "23:59" },
      golden: { from: today, to: addDays(1), anks: [3, 7] },
      rates: {
        main: {
          single_ank: { bet: 10, win: 100 }, jodi: { bet: 10, win: 950 }, single_pana: { bet: 10, win: 1500 }, double_pana: { bet: 10, win: 3000 },
          triple_pana: { bet: 10, win: 10000 }, half_sangam: { bet: 10, win: 11000 }, full_sangam: { bet: 10, win: 100000 },
        },
        starline: { single_ank: { bet: 10, win: 100 }, single_pana: { bet: 10, win: 1600 }, double_pana: { bet: 10, win: 3200 }, triple_pana: { bet: 10, win: 10000 } },
        gali: { left_digit: { bet: 10, win: 95 }, right_digit: { bet: 10, win: 95 }, jodi: { bet: 10, win: 950 } },
      },
    },
  };
  const rate = (c: Cat, t: GameType) => { const x = s.settings.rates[c][t]!; return x.win / x.bet; };

  NAMES.forEach((name, i) => {
    const first = name.split(" ")[0].toLowerCase();
    const u: User = {
      id: nid(s), name, mobile: i === 0 ? DEMO_LOGIN.mobile : "9" + rnd(100000000, 999999999), password: i === 0 ? DEMO_LOGIN.password : String(rnd(100000, 999999)),
      email: `${first}${rnd(10, 99)}@gmail.com`, balance: rnd(10, 150) * 100, status: i >= 26 ? "inactive" : "active", betting: i % 9 !== 4,
      joined: `${i < 2 ? today : addDays(-rnd(2, 200))} ${t2()}`, lastLogin: i % 3 ? `${addDays(-rnd(0, 3))} ${t2()}` : null, loggedIn: i % 3 !== 0,
      bank: i % 2 ? { holder: name, bank: pick(["SBI", "HDFC Bank", "ICICI Bank", "Bank of Baroda"]), account: String(rnd(1e9, 9e9)) + rnd(10, 99), ifsc: `SBIN000${rnd(1000, 9999)}`, address: "Main Branch" } : { holder: "", bank: "", account: "", ifsc: "", address: "" },
      paytm: "", phonepe: i % 3 === 0 ? "9" + rnd(100000000, 999999999) : "", gpay: "", upi: "",
    };
    s.users.push(u);
    s.txns.push({ id: nid(s), userId: u.id, type: "bonus", dir: "cr", amount: 10, date: u.joined.slice(0, 10), time: u.joined.slice(11), status: "success", remark: "Welcome Bonus" });
  });

  // Weekly holidays, like the live markets: Mein Bazar / Milan Night shut Sat + Sun, Kalyan shuts Sunday.
  const OFF: Record<string, number[]> = { "MEIN BAZAR": [0, 6], "MILAN NIGHT": [0, 6], "MILAN DAY": [0], KALYAN: [0], "KALYAN NIGHT": [0, 6], "RAJDHANI NIGHT": [0, 6], "RAJDHANI DAY": [0] };
  for (const [name, open, close] of MARKETS) s.games.push({ id: nid(s), cat: "main", name, open, close, active: true, offDays: OFF[name] ?? [] });
  for (const t of STARLINE) {
    const h = Number(t.slice(0, 2));
    s.games.push({ id: nid(s), cat: "starline", name: `${h % 12 || 12}:00 ${h >= 12 ? "PM" : "AM"}`, open: t, close: t, active: true, offDays: [] });
  }
  for (const [name, close] of GALI) s.games.push({ id: nid(s), cat: "gali", name, open: close, close, active: true, offDays: [] });

  const players = s.users.filter((u) => u.status === "active" && u.betting);
  const anyPana = () => pick([...SINGLE_PANA, ...SINGLE_PANA, ...DOUBLE_PANA, ...TRIPLE_PANA]);
  const bidFor = (cat: Cat): { type: GameType; session: Session | null; value: string } => {
    if (cat === "gali") {
      const type = pick<GameType>(["left_digit", "right_digit", "jodi", "jodi"]);
      return { type, session: null, value: type === "jodi" ? pick(JODIS) : String(rnd(0, 9)) };
    }
    const type = cat === "starline" ? pick<GameType>(["single_ank", "single_ank", "single_pana", "double_pana"]) : pick<GameType>(["single_ank", "single_ank", "jodi", "jodi", "single_pana", "double_pana", "triple_pana", "half_sangam", "full_sangam"]);
    const session: Session | null = cat === "starline" || type === "jodi" || type === "full_sangam" ? null : pick<Session>(["open", "close"]);
    const pool = type === "single_pana" ? SINGLE_PANA : type === "double_pana" ? DOUBLE_PANA : TRIPLE_PANA;
    const value = type === "single_ank" ? String(rnd(0, 9)) : type === "jodi" ? pick(JODIS) : type === "half_sangam" ? `${anyPana()}-${rnd(0, 9)}` : type === "full_sangam" ? `${anyPana()}-${anyPana()}` : pick(pool);
    return { type, session, value };
  };

  for (let d = -6; d <= 0; d++) {
    const date = addDays(d);
    const weekday = new Date(`${date}T12:00:00`).getDay();
    for (const g of s.games) {
      if (g.offDays.includes(weekday)) continue; // market holiday: no bids, no result
      const n = g.cat === "main" ? rnd(3, 9) : rnd(2, 5);
      for (let i = 0; i < n; i++) {
        const u = pick(players);
        const b = bidFor(g.cat);
        const amount = pick([10, 10, 20, 50, 50, 100, 200]);
        const time = t2(7, Math.max(7, Math.min(22, Number(g.close.slice(0, 2)) - 1)));
        u.balance -= amount;
        s.bids.push({ id: nid(s), userId: u.id, gameId: g.id, ...b, amount, rate: rate(g.cat, b.type), date, time, status: "pending" });
        s.txns.push({ id: nid(s), userId: u.id, type: "bet", dir: "dr", amount, date, time, status: "success", remark: `Bid placed successfully for the game: ${g.name}` });
      }
      // Past days are fully declared; today only markets whose time has already passed.
      const declareOpen = d < 0 || mins(g.open) < nowMin - 5;
      const declareClose = d < 0 || mins(g.close) < nowMin - 5;
      if (!declareOpen) continue;
      const res = { id: nid(s), gameId: g.id, date } as State["results"][number];
      s.results.push(res);
      if (g.cat === "gali") { res.jodi = pick(JODIS); res.openAt = `${date} ${g.close}`; settle(s, g, date, "open", { date, time: g.close }); continue; }
      res.openPana = anyPana();
      res.openAt = `${date} ${g.open}`;
      settle(s, g, date, "open", { date, time: g.open });
      if (g.cat === "main" && declareClose) {
        res.closePana = anyPana();
        res.closeAt = `${date} ${g.close}`;
        settle(s, g, date, "close", { date, time: g.close });
      }
    }
    for (let i = rnd(3, 7); i > 0; i--) {
      s.txns.push({ id: nid(s), userId: pick(players).id, type: "deposit", dir: "cr", mode: pick(["Google Pay", "PhonePe", "Paytm"]), amount: pick([500, 1000, 1000, 2000, 5000]), date, time: t2(), status: "approved", remark: "Deposit Fund", utr: "UTR" + rnd(100000000, 999999999) });
    }
  }
  for (let i = 0; i < 9; i++) {
    const u = pick(s.users.filter((x) => x.status === "active"));
    s.txns.push({
      id: nid(s), userId: u.id, type: "withdraw", dir: "dr", amount: pick([1000, 1500, 2000, 5000]), date: addDays(i < 4 ? 0 : -rnd(1, 6)), time: t2(8, 11),
      status: i < 4 ? "pending" : i === 8 ? "rejected" : "approved", remark: i < 4 ? "Withdraw request" : i === 8 ? "Withdraw request rejected — amount refunded" : "Withdraw request approved",
      mode: "PhonePe", payTo: `PhonePe ${u.mobile}`,
    });
  }
  for (let i = 0; i < 3; i++) {
    const u = pick(players.slice(1));
    s.txns.push({ id: nid(s), userId: u.id, type: "deposit", dir: "cr", amount: pick([500, 1000, 2000]), date: today, time: t2(9, 12), status: "pending", remark: "Add fund request", mode: "Manual" });
  }
  for (let i = 0; i < 3; i++) {
    const u = pick(players);
    s.txns.push({ id: nid(s), userId: u.id, type: "manual", dir: "cr", amount: pick([500, 1000]), date: addDays(-rnd(0, 4)), time: "12:30", status: "success", remark: "Amount added by admin", mode: "Admin" });
  }
  for (const u of s.users) u.balance = Math.max(0, Math.round(u.balance));
  s.users[0].balance = 1010; // demo login starts with a realistic balance
  s.txns.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  s.bids.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  s.roles = [
    { id: nid(s), name: "Super Admin", perms: [...MODULES] },
    { id: nid(s), name: "Result Manager", perms: ["Dashboard", "Declare Result", "Prediction", "Games", "Starline", "Galidesawar", "Reports"] },
    { id: nid(s), name: "Accountant", perms: ["Dashboard", "Wallet", "Withdraw", "Reports"] },
  ];
  s.admins = [
    { id: nid(s), name: "Admin", username: "admin", role: "Super Admin", active: true },
    { id: nid(s), name: "Result Team", username: "result.team", role: "Result Manager", active: true },
  ];
  s.notices = [{ id: nid(s), title: "Welcome to Shri Kalyan", msg: "Play only on the official app. Withdrawals are processed within 12-24 hours.", target: "All Users", date: addDays(-3), time: "10:00" }];
  s.pushes = [];
  s.settings.sliders = [
    { id: nid(s), title: "शुभ लाभ", sub: "Shri Kalyan • Fast results • Instant withdrawal", c1: "#7a1212", c2: "#c2410c" },
    { id: nid(s), title: "Shri Kalyan Matka", sub: "Fast results • Instant withdrawal", c1: "#1f45a8", c2: "#7a1d3a" },
    { id: nid(s), title: "Starline every hour", sub: "12 results daily from 10 AM", c1: "#0e1433", c2: "#5b3df5" },
  ];
  s.audit = [{ id: nid(s), at: `${today} ${hhmm()}`, by: "system", action: "Seed", detail: "Demo data created" }];
  return s;
}
