# Word Game — Matka Market App + Admin Panel (demo)

A demo of the full product, built from the live Sara777 admin panel and player app (screen recordings) and the PRD. It uses the same game rules, menu tree and screens, runs on demo data, and is named **Word Game**.

| Route | App |
|---|---|
| `/` | Player app (mobile, max 430px): mobile + password login, register, markets, bets, deposit, withdraw, bank details, history |
| `/admin` | Admin panel (responsive): dashboard, declare result, prediction, users, wallet, reports, notices, game settings |

Built with Next.js 16, React 19, Tailwind 4 and lucide icons.

## How the game works (Matka)

- **Pana** = 3 digits in ascending order, where 0 counts as the highest digit (`150`, `100`). Its **Ank** is the last digit of the sum (1+5+0 = **6**).
  Single Pana = 3 different digits (120), Double Pana = two alike (90), Triple Pana = all alike (10).
- **Main markets** (Radha Morning … Mein Bazar, 28 markets) each have an **OPEN** time and a **CLOSE** time.
  Result `123-65-456` means Open Pana 123 → Open Ank 6, Close Pana 456 → Close Ank 5, **Jodi 65**.
- **Game types:** Single Ank, Jodi, Single Pana, Double Pana, Triple Pana, Half Sangam (Open Pana + Close Ank, or Close Pana + Open Ank), Full Sangam (Open Pana + Close Pana).
  After the open session closes, only close-session Single Ank and Pana can be played.
- **Starline:** hourly slots (10 AM – 9 PM), one result like `123-6`; Single Ank and Pana only.
- **Galidesawar:** Desawar, Faridabad, Ghaziabad, Gali; result is a jodi like `45`; Left Digit, Right Digit, Jodi.
- **Rates** (Admin → Game Rates, "Value 1 → Value 2"): Single Ank 10 → 100, Jodi 10 → 950, Single Pana 10 → 1500, Double Pana 10 → 3000, Triple Pana 10 → 10000, Half Sangam 10 → 11000, Full Sangam 10 → 100000.
  The rate is locked on each bid when it is placed.

### Declaring results (admin)

Declare Result → Date + Game + Session → **Go** → type the Pana (the Ank fills automatically) → **Show Winner** lists every winning bid and its payout → **Declare** (type the pana again to confirm).
- Open settles open-session Single Ank and Pana.
- Close settles close-session bids plus Jodi, Half Sangam and Full Sangam.
- Winnings go to wallets instantly.
- **Today Result History → Delete** undoes a declaration: winnings are taken back and the bids return to pending.

## Demo notes

- All data is sample data from `app/lib/seed.ts`, saved in the browser's localStorage. Player app and admin share it **live across tabs**: bid in one tab, declare in the other, and the wallet updates. Use **Reset** in the admin header to reseed.
- Player demo login: **9876543210 / 123456** (tap the hint on the login screen). Admin login accepts any password.
- **Demo mode** (Admin → Main Setting) keeps a session open until its result is declared, so you can play at any hour. Turn it off to enforce the real OPEN/CLOSE times.
- UPI deposits are simulated: choose a UPI app, Pay, and the wallet is credited automatically.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 (phone-width window) and http://localhost:3000/admin in a second tab.

## Where things live

- `app/lib/matka.ts`: pana lists, Ank calculation, result text
- `app/lib/engine.ts`: all game rules (bids, settlement, declare, delete result, revert, deposit, withdraw, accounts, reports). Each action maps to a future API endpoint.
- `app/lib/store.tsx`: shared state with localStorage and cross-tab sync
- `app/lib/seed.ts`: demo data
- `app/lib/types.ts`: data model
- `app/components/`: player app: `WordGameApp.tsx` (shell and drawer menu) and `screens/` (Auth, Home, Play, Funds, Account)
- `app/admin/`: admin panel: `AdminApp.tsx` (menu and hash routes), `sections/` (one file per module) and `ui.tsx` (DataTable, dialogs)

## Going to production

- Replace `store.tsx` with API calls to a database, and run `engine.ts` on the server inside DB transactions.
- Add real SMS/OTP or password auth, a UPI payment gateway webhook for auto deposits, FCM push, and admin role checks on the server.
