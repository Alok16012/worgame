# Shri Kalyan — Matka Market App + Admin Panel (demo)

A demo of the full product, built from the live Sara777 admin panel and player app (screen recordings) and the PRD. It uses the same game rules, menu tree and screens, and runs on demo data. The brand is **Shri Kalyan** (gold logo on royal blue); the app name can be changed in Admin → Main Setting.

| Route | App |
|---|---|
| `/` | Player app (mobile, max 430px, navy + gold): mobile + password login, register, markets, bets with review screen, add fund via UPI apps, withdraw to PhonePe / Google Pay / Paytm / UPI ID, history |
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

## Player bet flow

Market ▶ → Select Betting Type → Date + Choose Session (Open/Close) → amount on each number (Sangam: add rows) → **SUBMIT GAME** → review screen (Digit / Amount with delete, Total Bet, Wallet Balance Before / After Deduction, "Bets once placed cannot be cancelled") → **Submit Bet**. Not enough balance shows "Error! Something Went Wrong! Insufficient Balance".

**Add Fund** depends on Admin → Main Setting → **Auto UPI Payment**:
- **ON:** enter amount → tap PhonePe / Google Pay / Paytm / Other UPI → the app opens with the merchant UPI ID and amount prefilled. In the demo the player taps "I have paid"; the live app credits it from the payment gateway callback.
- **OFF:** the player taps **Send Add Fund Request**. It shows in Admin → Fund Management → Add Fund Request with a WhatsApp link. The admin collects the payment and taps **Approve** (wallet credited) or **Reject**.

**Withdraw Fund:** choose method (PhonePe, Google Pay, Paytm, UPI ID) → number / UPI ID → amount → Withdraw Now. Alerts: "Minimum Amount is 1000", "You don't have enough fund!". The amount is held from the wallet. In Admin → Withdraw Management (All tab) each request shows Approve / Reject while pending, and afterwards stays in the list as **Approved** or **Rejected · Refunded**. A reject puts the money back in the wallet and adds a "Withdraw rejected — refunded" entry to the player's statement and withdraw history.

**Market off days:** Admin → Game Name → edit → tick the days a market is closed (e.g. Mein Bazar Sat + Sun). On those days the card shows HOLIDAY TODAY and no bids are taken.

**Golden Ank** has a From / To date (e.g. two days). **Slider Image** accepts real photos (e.g. Lakshmi-Ganesh ji banner); uploads are resized to keep the demo storage small.

## Demo notes

- All data is sample data from `app/lib/seed.ts`, saved in the browser's localStorage. Player app and admin share it **live across tabs**: bid in one tab, declare in the other, and the wallet updates. Use **Reset** in the admin header to reseed.
- Player demo login: **9876543210 / 123456** (tap the hint on the login screen). Admin login accepts any password.
- Market OPEN/CLOSE timings always apply: bids close at a market's time even if the result is not declared yet. **Demo mode** (Admin → Main Setting) only skips the withdraw time window.
- Add Fund opens the real UPI app on a phone; set the real merchant UPI ID in Admin → Main Setting before demoing payments. The wallet is credited when the player taps "I have paid" (demo).

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
