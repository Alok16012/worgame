===========================================================
  SHRI KALYAN - ANDROID PRODUCTION BUILDS
===========================================================

1. FILES IN THIS FOLDER:
-----------------------------------------------------------
- ShriKalyan.apk (3.8 MB):
  Signed Release APK. Client ko WhatsApp, Google Drive, ya
  website download link ke through directly share karne ke liye.
  Kisi bhi Android phone par directly install (sideload) ho jayega.

- ShriKalyan.aab (3.6 MB):
  Signed Android App Bundle (AAB).
  Google Play Console par app publish/upload karne ke liye.
  (Google Play Store par new apps ke liye .aab format mandatory hai).

2. APP & SIGNING DETAILS:
-----------------------------------------------------------
- App Name: Shri Kalyan
- Package Name (App ID): com.shrikalyan.app
- Version: 1.0 (Version Code: 1)
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
