===========================================================
  SHRI KALYAN / TRIVIAVERSE - ANDROID PRODUCTION BUILDS
===========================================================

1. FILES IN THIS FOLDER:
-----------------------------------------------------------
- ShriKalyan.apk / Triviaverse.apk:
  Signed Release APK. Client ko WhatsApp, Google Drive, ya
  website download link ke through directly share karne ke liye.
  Kisi bhi Android phone par directly install (sideload) ho jayega.

- ShriKalyan.aab / Triviaverse.aab:
  Signed Android App Bundle (AAB).
  Google Play Console par app publish/upload karne ke liye.
  (Google Play Store par new apps ke liye .aab format mandatory hai).

2. APP & SIGNING DETAILS:
-----------------------------------------------------------
- App Name: Shri Kalyan (ShriKalyan.*) ya Triviaverse (Triviaverse.*)
  Phone ka launcher name/icon/splash build ke time fix hota hai,
  isliye dono brand ke alag builds hain. App ke andar ka name/logo
  admin ke Quiz Mode ON/OFF se khud badalta hai.
- Package Name (App ID): com.shrikalyan.app
- Version: 1.1 (Version Code: 2)
- Keystore File: android/app/shrikalyan.keystore
- Keystore Alias: shrikalyan
- Keystore Password: shrikalyan@123
- Key Password: shrikalyan@123
- Certificate Validity: 10,000 Days

3. REBUILD COMMANDS:
-----------------------------------------------------------
Future mein agar koi code change karke naya APK/AAB banana ho:
- Shri Kalyan APK: npm run build:apk
- Shri Kalyan Play Store AAB: npm run build:aab
- Triviaverse (quiz) APK: npm run build:apk:quiz
- Triviaverse (quiz) Play Store AAB: npm run build:aab:quiz
