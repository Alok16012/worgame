// Native UPI intent payment (Android APK only) via the UpiPay Capacitor plugin.
import { Capacitor, registerPlugin } from "@capacitor/core";

interface UpiPayPlugin {
  pay(opts: { uri: string; package?: string }): Promise<{ response: string; resultCode: number }>;
}

const UpiPay = registerPlugin<UpiPayPlugin>("UpiPay");

export const canUseUpiIntent = () => Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";

export type UpiResult =
  | { status: "success"; txnId: string; txnRef: string }
  | { status: "failed" | "cancelled"; message: string };

/** Parses "txnId=..&responseCode=00&Status=SUCCESS&txnRef=.." (key case varies by app). */
function parseResponse(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of raw.split("&")) {
    const i = part.indexOf("=");
    if (i <= 0) continue;
    out[part.slice(0, i).trim().toLowerCase()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

export async function payWithUpiIntent(opts: { vpa: string; payeeName: string; amount: number; txnRef: string; pkg?: string }): Promise<UpiResult> {
  const q = new URLSearchParams({
    pa: opts.vpa,
    pn: opts.payeeName,
    am: opts.amount.toFixed(2),
    cu: "INR",
    tn: "Add Fund",
    tr: opts.txnRef,
  });
  let res: { response: string; resultCode: number };
  try {
    res = await UpiPay.pay({ uri: `upi://pay?${q.toString()}`, package: opts.pkg });
  } catch (e: any) {
    return { status: "failed", message: e?.code === "NO_APP" ? "Ye UPI app aapke phone mein installed nahi hai." : e?.message || "UPI app open nahi hua." };
  }

  const r = parseResponse(res.response || "");
  const status = (r.status || "").toUpperCase();
  if (!res.response) return { status: "cancelled", message: "Payment cancel ho gaya ya UPI app ne result nahi bheja." };
  if (status === "SUCCESS") {
    const txnId = r.txnid || r.approvalrefno || r.txnref || "";
    if (!txnId) return { status: "failed", message: "Payment ka transaction ID nahi mila." };
    if (r.txnref && r.txnref !== opts.txnRef) return { status: "failed", message: "Payment reference match nahi hua." };
    return { status: "success", txnId, txnRef: opts.txnRef };
  }
  if (status === "SUBMITTED") return { status: "failed", message: "Payment pending hai. Paise kate hon to WhatsApp par support se contact karein." };
  return { status: "failed", message: "Payment fail ho gaya. Paise kate hon to WhatsApp par support se contact karein." };
}
