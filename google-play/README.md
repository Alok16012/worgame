# Shri Kalyan — Google Play listing assets

- `logo-512.png`: 512 × 512 RGBA PNG, existing app branding.
- `banner-1024x500.png`: 1024 × 500 RGB PNG, quiz theme.
- `screenshots/`: four 1080 × 1920 RGB screenshots of the actual quiz mode: home, questions, result, guidelines. Captured in an isolated browser with a fictional local quiz account; all external/cloud traffic blocked. No production account was created or changed.
- `banner-source.svg`: editable banner source.

## Policy links

Pages are implemented at `/privacy-policy` and `/delete-account`. Local preview:

- http://127.0.0.1:3000/privacy-policy
- http://127.0.0.1:3000/delete-account

There is no public website/domain or deployment configuration identifying a live site in this folder. Deploy the built `out/` directory to the app's existing web host, then use its HTTPS domain followed by these paths in Play Console. Localhost links cannot be submitted as public policy URLs.

The support email `support@shrikalyan.app` comes from the project's settings. Its inbox/deliverability has not been verified. The deletion page opens an email request; it does not silently claim to delete data or implement an automatic deletion service.

## Before submission

The policy describes the code's current behavior, including quiz and enabled financial features. The operator still needs to verify the support inbox, operating entity, actual retention/deletion timeframes and provider backup handling. Fixed timelines are not invented in the pages. Confirm these details and update the pages before treating them as final submission policies.

The current admin deletion function removes the user, bids and transactions, but does not remove all submitted ideas or audit identifiers. A support deletion request must also remove associated ideas, payment/withdrawal records and identifying audit entries, handle device caches/backups, and verify the remote deletion before confirming completion. A visible in-app deletion link is present, but this alone does not complete the deletion lifecycle.

The app also has real-money betting/payment functionality. Quiz-only screenshots do not change the distributed app's functionality or its eligibility. The listing and Data safety declaration must accurately describe the shipped app.

Official references:
- https://support.google.com/googleplay/android-developer/answer/9866151
- https://support.google.com/googleplay/android-developer/answer/13327111
- https://support.google.com/googleplay/android-developer/answer/9877032

## Regenerate

Run `node scripts/create-play-graphics.cjs` for logo/banner. Start `npm run dev`, install/provide Playwright, then run `node scripts/capture-play-listing.cjs`. If Playwright is installed outside this project, set `PLAYWRIGHT_MODULE` to its module path.
