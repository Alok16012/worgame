===========================================================
  TRIVIAVERSE - ANDROID PRODUCTION BUILDS
===========================================================

1. FILES IN THIS FOLDER:
-----------------------------------------------------------
- Triviaverse.apk:
  Signed Release APK. Client ko WhatsApp, Google Drive, ya
  website download link ke through directly share karne ke liye.
  Kisi bhi Android phone par directly install (sideload) ho jayega.

- Triviaverse.aab:
  Signed Android App Bundle (AAB).
  Google Play Console par app publish/upload karne ke liye.
  (Google Play Store par new apps ke liye .aab format mandatory hai).

2. APP & SIGNING DETAILS:
-----------------------------------------------------------
- App Name (Play Store / phone launcher): Triviaverse
  Ek hi bundle hai. Phone par naam/icon/splash hamesha Triviaverse.
  App ke andar admin ke Quiz Mode ON/OFF se content aur name/logo
  (Triviaverse <-> Shri Kalyan) khud badalta hai.
- Package Name (App ID): com.triviaverse.app
- Version: 1.0 (Version Code: 1) — naya Play Store app (naya package), isliye version reset
- Keystore File: android/app/shrikalyan.keystore
- Keystore Alias: shrikalyan
- Keystore Password: shrikalyan@123
- Key Password: shrikalyan@123
- Certificate Validity: 10,000 Days

3. REBUILD COMMANDS:
-----------------------------------------------------------
Future mein agar koi code change karke naya APK/AAB banana ho:
- Naya APK banane ke liye: npm run build:apk
- Naya Play Store AAB banane ke liye: npm run build:aab
