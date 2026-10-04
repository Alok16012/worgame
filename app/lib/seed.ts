import { addDays, hhmm, ymd } from "./format";
import { nid } from "./engine";
import { MODULES, type State } from "./types";

// Production state: real markets and timings, clean empty users/bids/results/transactions.
// Bump version to 5 so any browser local cache resets to real clean production state.

export const STATE_VERSION = 5;

// [name, open result time, close result time]
const MARKETS: [string, string, string][] = [
  ["RADHA MORNING", "09:15", "10:05"],
  ["SITA MORNING", "09:45", "10:40"],
  ["SRIDEVI MORNING", "10:00", "11:00"],
  ["KARNATAKA DAY", "10:05", "10:55"],
  ["MILAN MORNING", "10:30", "11:30"],
  ["LATA MORNING", "11:00", "12:00"],
  ["KALYAN MORNING", "11:00", "12:00"],
  ["MADHUR MORNING", "11:20", "12:20"],
  ["SRIDEVI", "11:35", "12:35"],
  ["TIME BAZAR", "13:00", "14:00"],
  ["MADHUR DAY", "13:20", "14:20"],
  ["SITA DAY", "13:44", "14:45"],
  ["RADHA DAY", "14:00", "15:00"],
  ["RAJDHANI DAY", "15:05", "16:55"],
  ["MILAN DAY", "15:05", "17:05"],
  ["LATA DAY", "15:25", "17:25"],
  ["SUPREME DAY", "15:40", "17:40"],
  ["KALYAN", "15:40", "17:40"],
  ["LATA NIGHT", "18:25", "19:25"],
  ["KARNATAKA NIGHT", "18:35", "19:35"],
  ["SITA NIGHT", "18:43", "19:43"],
  ["SRIDEVI NIGHT", "19:15", "20:15"],
  ["MADHUR NIGHT", "20:25", "22:25"],
  ["SUPREME NIGHT", "20:45", "22:44"],
  ["MILAN NIGHT", "21:05", "23:05"],
  ["KALYAN NIGHT", "21:20", "23:20"],
  ["RAJDHANI NIGHT", "21:20", "23:30"],
  ["MEIN BAZAR", "21:50", "23:55"],
];

const STARLINE = [
  "10:00", "11:00", "12:00", "13:00", "14:00", "15:00",
  "16:00", "17:00", "18:00", "19:00", "20:00", "21:00",
];

const GALI: [string, string][] = [
  ["DESAWAR", "05:00"],
  ["FARIDABAD", "18:10"],
  ["GHAZIABAD", "21:00"],
  ["GALI", "23:30"],
];

export function seedState(): State {
  const today = ymd();

  const s: State = {
    v: STATE_VERSION,
    seq: 1000,
    users: [],
    games: [],
    bids: [],
    results: [],
    txns: [],
    notices: [],
    pushes: [],
    roles: [],
    admins: [],
    audit: [],
    settings: {
      appName: "Shri Kalyan",
      marquee: "WELCOME TO SHRI KALYAN • Fast Results • 24x7 Instant Deposit & Withdrawal",
      website: "",
      minDeposit: 100,
      maxDeposit: 100000,
      minWithdraw: 1000,
      maxWithdraw: 200000,
      minBid: 10,
      maxBid: 10000,
      welcomeBonus: 0,
      upiId: "shrikalyan@upi",
      autoUpi: true,
      demoMode: false, // Real live mode
      maintenance: false,
      version: "1.0.0",
      contact: {
        whatsapp: "+91 98765 43210",
        phone: "+91 98765 43210",
        email: "support@shrikalyan.app",
        telegram: "@shrikalyan_official",
      },
      howToPlay:
        "1. Deposit money in your wallet from Deposit Fund.\n2. Tap Play on any market that is open.\n3. Choose a game type: Single Ank, Jodi, Single/Double/Triple Pana, Half or Full Sangam.\n4. Choose OPEN or CLOSE session, type your amount on the numbers you want and tap Submit Bids.\n5. Results are declared at the market's OPEN and CLOSE time, e.g. 123-65-456.\n6. Winning amount (bid × rate) is added to your wallet automatically. Withdraw to your bank in withdraw time.",
      video: "https://youtube.com/",
      sliders: [
        { id: 1, title: "शुभ लाभ", sub: "Shri Kalyan • Fast results • Instant withdrawal", c1: "#7a1212", c2: "#c2410c" },
        { id: 2, title: "Shri Kalyan Matka", sub: "Fast results • Instant withdrawal", c1: "#1f45a8", c2: "#7a1d3a" },
        { id: 3, title: "Starline every hour", sub: "12 results daily from 10 AM", c1: "#0e1433", c2: "#5b3df5" },
      ],
      withdraw: { days: [0, 1, 2, 3, 4, 5, 6], from: "00:00", to: "23:59" },
      golden: { from: today, to: addDays(1), anks: [3, 7] },
      rates: {
        main: {
          single_ank: { bet: 10, win: 100 },
          jodi: { bet: 10, win: 950 },
          single_pana: { bet: 10, win: 1500 },
          double_pana: { bet: 10, win: 3000 },
          triple_pana: { bet: 10, win: 10000 },
          half_sangam: { bet: 10, win: 11000 },
          full_sangam: { bet: 10, win: 100000 },
        },
        starline: {
          single_ank: { bet: 10, win: 100 },
          single_pana: { bet: 10, win: 1600 },
          double_pana: { bet: 10, win: 3200 },
          triple_pana: { bet: 10, win: 10000 },
        },
        gali: {
          left_digit: { bet: 10, win: 95 },
          right_digit: { bet: 10, win: 95 },
          jodi: { bet: 10, win: 950 },
        },
      },
    },
  };

  // Weekly holidays
  const OFF: Record<string, number[]> = {
    "MEIN BAZAR": [0, 6],
    "MILAN NIGHT": [0, 6],
    "MILAN DAY": [0],
    KALYAN: [0],
    "KALYAN NIGHT": [0, 6],
    "RAJDHANI NIGHT": [0, 6],
    "RAJDHANI DAY": [0],
  };

  for (const [name, open, close] of MARKETS) {
    s.games.push({ id: nid(s), cat: "main", name, open, close, active: true, offDays: OFF[name] ?? [] });
  }

  for (const t of STARLINE) {
    const h = Number(t.slice(0, 2));
    s.games.push({
      id: nid(s),
      cat: "starline",
      name: `${h % 12 || 12}:00 ${h >= 12 ? "PM" : "AM"}`,
      open: t,
      close: t,
      active: true,
      offDays: [],
    });
  }

  for (const [name, close] of GALI) {
    s.games.push({ id: nid(s), cat: "gali", name, open: close, close, active: true, offDays: [] });
  }

  // Real Roles
  s.roles = [
    { id: nid(s), name: "Super Admin", perms: [...MODULES] },
    { id: nid(s), name: "Result Manager", perms: ["Dashboard", "Declare Result", "Prediction", "Games", "Starline", "Galidesawar", "Reports"] },
    { id: nid(s), name: "Accountant", perms: ["Dashboard", "Wallet", "Withdraw", "Reports"] },
  ];

  // Real Default Master Admin Account
  s.admins = [
    {
      id: nid(s),
      name: "Master Admin",
      username: "admin",
      password: "admin@777",
      role: "Super Admin",
      active: true,
    },
  ];

  s.notices = [
    {
      id: nid(s),
      title: "Welcome to Shri Kalyan",
      msg: "Welcome to Shri Kalyan Official App. 24x7 Fast Results, Deposits & Instant Withdrawals.",
      target: "All Users",
      date: today,
      time: "10:00",
    },
  ];

  s.pushes = [];
  s.audit = [
    {
      id: nid(s),
      at: `${today} ${hhmm()}`,
      by: "system",
      action: "System Initialized",
      detail: "Clean real production database initialized",
    },
  ];

  return s;
}
