# Word Game — Number Prediction Platform (demo)

Client demo built from the *Sara777 Prediction Platform PRD*: a player app plus a full admin panel, running on demo data.

| Route | App |
|---|---|
| `/` | Player app (mobile, capped at 430px): splash → OTP login / register → home, markets, place bid, wallet, bets, results, profile |
| `/admin` | Admin panel (responsive): dashboard, declare result, prediction, users & roles, wallet, reports, notices, game config, settings |

Built with Next.js 16, React 19, Tailwind 4, Poppins and lucide icons (same stack as GameHub).

## How the game works

1. Every **market** (game) has an open and close time and a **rate** (e.g. 9.5x).
2. The player picks one or more **Anks** (single digits 0–9) and an amount. The wallet is debited immediately.
3. After close, the admin **declares the result Ank**. Winning bids are paid `amount × rate` (₹10 × 9.5 = ₹95); the rest are lost.
4. **Profit** = total bid amount − total winnings.
5. **Bid Revert** refunds pending bids of a cancelled market. **Withdrawals** are held at request time; the admin approves (paid) or rejects (refunded).

Categories: **Main Game** (4 markets), **Starline** (6 hourly slots, 9x) and **Galidesawar** (3 markets).

> **Demo build.** All data is sample data seeded in `app/lib/seed.ts` and stored in the browser's localStorage. The player app and admin panel share it **live across tabs**: place a bid in one tab, declare the result in another, and the wallet updates instantly. The OTP is `123456`, the admin login accepts any password, and UPI payments are simulated. **Demo mode** (Admin → Setting → Main Setting) keeps every market open regardless of timings. Turn it off to enforce real open/close times. Use **Reset data** in the admin header to reseed.

## Admin modules

- **Dashboard**: KPI cards (active users, today's registrations, games, inactive users), today's totals, Ank 0–9 bid monitoring filtered by game and market time, today's markets with quick Declare, Game Report (bid, winning, profit, withdraw, UPI deposit, manual add, each with View), Auto Fund Deposit table.
- **Declare Result**: per category. Previews winners, payout and profit, and requires re-typing the Ank to confirm. Includes result history.
- **Prediction**: payout exposure and platform P/L for every Ank of a market.
- **Management**: roles with module permissions and admin users; user list with search, block/unblock, detail (wallet, bids, ledger) and quick fund.
- **Wallet Management**: manual add/deduct, withdraw approve/reject, UPI auto deposit history, Bid Revert.
- **Setting**: main settings (limits, UPI ID, demo and maintenance mode), contacts, How To Play, slider banners, withdraw days and time window, Golden Ank, and an Activity Log of every sensitive action.
- **Notice Management**: notices to all users or one user, and push notifications.
- **Reports**: Bid History (filters + CSV export), Customer Sell Report (per-user P/L + CSV).
- **Game / Starline / Galidesawar Management**: markets (add, edit, delete, on/off), rates, allowed numbers, bid history, declare, revert.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 (use a phone-width window) and http://localhost:3000/admin in a second tab.

## Where things live

- `app/lib/engine.ts`: all game rules (place bids, declare, revert, deposit, withdraw, manual fund, reports). In production these become API endpoints on the server.
- `app/lib/store.tsx`: shared state (localStorage + cross-tab sync); `app/lib/seed.ts`: demo data; `app/lib/types.ts`: data model
- `app/components/WordGameApp.tsx`: player app shell, navigation stack, bottom nav; `app/components/screens/`: Auth, Main (home/games/bid/results), WalletScreens, Account
- `app/admin/AdminApp.tsx`: admin shell (hash routes like `#declare/starline`); `app/admin/sections/`: one file per module group; `app/admin/ui.tsx`: admin UI kit (tables, dialogs, confirm)

## Going to production

Replace `store.tsx` with API calls backed by a database, and run `engine.ts` on the server inside DB transactions (wallet debit + bid insert, result + payouts). Add a real SMS OTP, a UPI gateway webhook for auto deposits, and FCM for push notifications. Also add server-side market close enforcement and admin auth with role checks.
