# Triviaverse — Google Play listing assets

- `logo-512.png`: 512 × 512 RGBA PNG, Triviaverse quiz-mode branding (from `public/quiz-logo.png`).
- `banner-1024x500.png`: 1024 × 500 RGB PNG, quiz theme.
- `screenshots/`: four 1080 × 1920 RGB screenshots of the actual quiz mode (Triviaverse branding): home, questions, result, guidelines. Captured in an isolated browser with a fictional local quiz account; all external/cloud traffic blocked. No production account was created or changed.
- `banner-source.svg`: editable banner source.

## App access (Play Console → App content → App access)

The app needs a login. Registration sends an SMS OTP, so give reviewers this ready-made quiz-mode test account instead (it exists in the live database, status active, quiz mode, no wallet):

- Mobile number: `9999999999`
- Password: `Review@2026`
- Steps: open the app → Login To Your Account → enter the mobile number and password → LOGIN. No OTP is asked at login.

Keep the account active while the app is under review. Change the password from the admin panel (Users) if it ever leaks.

## Policy links

Pages are implemented at `/privacy-policy` and `/delete-account`. Local preview:

- http://127.0.0.1:3000/privacy-policy
- http://127.0.0.1:3000/delete-account

There is no public website/domain or deployment configuration identifying a live site in this folder. Deploy the built `out/` directory to the app's existing web host, then use its HTTPS domain followed by these paths in Play Console. Localhost links cannot be submitted as public policy URLs.

The policy pages use `support@triviaverse.app` (set in `app/components/LegalPage.tsx`). Its inbox/deliverability has not been verified. The deletion page opens an email request; it does not silently claim to delete data or implement an automatic deletion service.

## Before submission

The policy describes the code's current behavior, including quiz and enabled financial features. The operator still needs to verify the support inbox, operating entity, actual retention/deletion timeframes and provider backup handling. Fixed timelines are not invented in the pages. Confirm these details and update the pages before treating them as final submission policies.

The current admin deletion function removes the user, bids and transactions, but does not remove all submitted ideas or audit identifiers. A support deletion request must also remove associated ideas, payment/withdrawal records and identifying audit entries, handle device caches/backups, and verify the remote deletion before confirming completion. A visible in-app deletion link is present, but this alone does not complete the deletion lifecycle.

The app also has real-money betting/payment functionality. Quiz-only screenshots do not change the distributed app's functionality or its eligibility. The listing and Data safety declaration must accurately describe the shipped app.

Official references:
- https://support.google.com/googleplay/android-developer/answer/9866151
- https://support.google.com/googleplay/android-developer/answer/13327111
- https://support.google.com/googleplay/android-developer/answer/9877032

## Regenerate

Run `node scripts/create-play-graphics.cjs` for logo/banner and `node scripts/create-android-branding.cjs` to regenerate the Triviaverse Android asset set in `android-branding/triviaverse/`. The Android project ships with Triviaverse launcher branding (one bundle); `npm run brand:shrikalyan` / `npm run brand:triviaverse` swap the launcher asset set if ever needed. Start `npm run dev`, install/provide Playwright, then run `node scripts/capture-play-listing.cjs`. If Playwright is installed outside this project, set `PLAYWRIGHT_MODULE` to its module path.
