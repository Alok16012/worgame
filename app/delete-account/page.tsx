import type { Metadata } from "next";
import { LegalPage, supportEmail } from "../components/LegalPage";

export const metadata: Metadata = { title: "Delete Account and Data | Shri Kalyan" };
const subject = "Shri Kalyan account and data deletion request";
const body = "Please delete my Shri Kalyan account and associated data.\n\nRegistered mobile number (including country code):\nAccount name:\n\nPlease confirm any identity verification needed, the expected completion date, and any records that must be retained with their reason and retention period.";

export default function DeleteAccount() {
  return <LegalPage title="Delete account and data">
    <p>You can request deletion of your Shri Kalyan account and associated data without installing the app or signing in.</p>
    <section><h2>Send a deletion request</h2><ol className="list-decimal pl-5"><li>Email <a href={`mailto:${supportEmail}`}>{supportEmail}</a> with the subject “{subject}”.</li><li>Include your registered mobile number with country code and account name so support can locate your account.</li><li>Support may verify account ownership before removal. Never send your password, OTP or full bank account details.</li></ol>
      <a className="mt-5 inline-block rounded-xl bg-[#13306f] px-5 py-3 font-semibold text-white" href={`mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}>Email deletion request</a>
      <p className="mt-3 text-sm">This opens your email app. Send the email to submit your request. If no email app opens, use the address above in your preferred email service.</p>
    </section>
    <section><h2>Data covered by your request</h2><p>Request removal of your account profile, login information, submitted ideas, bank/payment details, bids, wallet transactions and withdrawal records associated with your account. Mention any specific information you want deleted if you wish to keep your account.</p></section>
    <section><h2>Processing and retained records</h2><p>Deletion is handled manually by support; this page does not immediately delete data. Ask support to confirm the completion date. If records must be retained for an unresolved transaction, security matter or applicable requirement, support should explain the records, reason and retention period in its response. Third-party payment and SMS providers manage their own records.</p></section>
    <section><h2>Remove data from your device</h2><p>After support confirms deletion, clear the app’s storage in Android Settings, or uninstall the app. For the website, clear site data in your browser. Clearing local data alone does not request deletion of server records.</p></section>
  </LegalPage>;
}
