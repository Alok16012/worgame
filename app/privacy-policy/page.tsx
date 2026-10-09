import type { Metadata } from "next";
import { LegalPage, supportEmail } from "../components/LegalPage";

export const metadata: Metadata = { title: "Privacy Policy | Shri Kalyan" };

export default function PrivacyPolicy() {
  return <LegalPage title="Privacy policy">
    <p>This policy describes the information used by the Shri Kalyan Android app and website, including its educational quiz mode. Contact the Shri Kalyan support team at <a href={`mailto:${supportEmail}`}>{supportEmail}</a> with privacy questions.</p>
    <section><h2>Information the app handles</h2><ul className="list-disc pl-5">
      <li>Account information: name, mobile number, password, optional email, account status and login activity.</li>
      <li>Quiz answers and scores are calculated in the current quiz session. Suggestions you submit include your account name, mobile number, category, message and submission time.</li>
      <li>For accounts with wallet or payment features enabled: balances, transaction and bid history, withdrawal requests, bank details, UPI IDs and payment references you provide.</li>
      <li>The app stores account/session and application state locally on your device and synchronizes application data with its configured Supabase database.</li>
    </ul></section>
    <section><h2>How information is used</h2><p>Information supports account access, mobile verification, quizzes, suggestions, customer support, administration and any enabled payment or wallet features. Administrators can access application records to operate these services.</p></section>
    <section><h2>Services and sharing</h2><p>The app uses Supabase for database storage and synchronization and AquaSMS for verification messages. Payment actions can open your selected UPI app with payment details. WhatsApp, Telegram and other external links open third-party services subject to their own privacy policies. Your mobile number and verification message are sent to the SMS service when verification is requested.</p></section>
    <section><h2>Device access</h2><p>The Android app requests internet and network-state access and can detect apps that handle UPI payment links. The current Android manifest does not request contacts, precise location, camera or microphone permissions.</p></section>
    <section><h2>Retention and deletion</h2><p>Account and submitted application records remain in local storage and the configured database until removed through account administration. You can request deletion of your account and associated data through the <a href="/delete-account">account deletion page</a>, without signing in. Uninstalling the app does not delete database records. Records held independently by payment or SMS providers are subject to their retention practices.</p></section>
    <section><h2>Your choices and security</h2><p>Contact support to request access, correction or deletion of your information. Do not include passwords, OTPs or full bank details in support messages. Use a password unique to this app. No system can guarantee absolute security.</p></section>
    <section><h2>Changes</h2><p>Changes to this policy will be published on this page with an updated date.</p></section>
  </LegalPage>;
}
