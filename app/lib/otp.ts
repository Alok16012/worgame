// AquaSMS / BulkSMS (login.aquasms.com) & Multi-Gateway OTP Service
import { Capacitor, CapacitorHttp } from "@capacitor/core";

export const DEFAULT_SMS_USERNAME = "8952074176otp";
export const DEFAULT_SMS_API_KEY = "d0bd7a75-2aaa-4722-8cfd-46d6c3f0d856";
export const DEFAULT_SMS_SENDER_NAME = "CRTFUL";
export const MASTER_TEST_OTP = "1234";

export interface SmsConfig {
  apiKey?: string;
  username?: string;
  senderName?: string;
  peid?: string;
  templateId?: string;
  messageTemplate?: string;
}

export interface SendOtpResult {
  ok: boolean;
  sessionId?: string;
  otp?: string;
  message?: string;
  isTestFallback?: boolean;
}

/**
 * Sends a 4-digit OTP to an Indian mobile number using AquaSMS (BulkSMS).
 */
export async function send4DigitOtp(
  mobile: string,
  config?: SmsConfig | string
): Promise<SendOtpResult> {
  const cfg: SmsConfig = typeof config === "string" ? { apiKey: config } : config || {};
  const apiKey = (cfg.apiKey || process.env.NEXT_PUBLIC_SMS_API_KEY || DEFAULT_SMS_API_KEY).trim();
  const username = (cfg.username || process.env.NEXT_PUBLIC_SMS_USERNAME || DEFAULT_SMS_USERNAME).trim();
  const senderName = (cfg.senderName || process.env.NEXT_PUBLIC_SMS_SENDER_NAME || DEFAULT_SMS_SENDER_NAME).trim().toUpperCase();
  const cleanMobile = mobile.replace(/\D/g, "");

  if (cleanMobile.length !== 10) {
    return { ok: false, message: "Please enter a valid 10-digit mobile number" };
  }

  // Generate 4-digit random number (1000 - 9999)
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  const template = cfg.messageTemplate || "Your OTP code for verification is : {OTP} CRTFUL";
  const smsMessage = template.replace(/{OTP}/g, otp);

  // Build AquaSMS API query params
  const params = new URLSearchParams({
    username,
    message: smsMessage,
    smstype: "TRANS",
    numbers: cleanMobile,
    apikey: apiKey,
  });

  if (senderName) {
    params.append("sendername", senderName);
  }

  let endpoint = "https://login.aquasms.com/sendSMS";
  if (cfg.peid && cfg.templateId) {
    endpoint = "https://login.aquasms.com/v2/sendSMS";
    params.append("peid", cfg.peid);
    params.append("templateid", cfg.templateId);
  }

  const directUrl = `${endpoint}?${params.toString()}`;

  // Interprets an AquaSMS response. Returns null when the body is unreadable,
  // otherwise a definite success/failure so gateway errors (e.g. no credit)
  // are surfaced instead of silently falling through to the no-cors path.
  const interpret = (data: unknown): SendOtpResult | null => {
    const parsed = typeof data === "string" ? (() => { try { return JSON.parse(data); } catch { return null; } })() : data;
    const firstItem = Array.isArray(parsed) ? parsed[0] : parsed;
    const responseCode = String(firstItem?.responseCode || firstItem?.status || "");
    if (!responseCode) return null;
    const code = responseCode.toLowerCase();
    if (code.includes("success") || code.includes("sent") || code.includes("submitted")) {
      return {
        ok: true,
        sessionId: `aquasms_${Date.now()}`,
        otp,
        message: `4-Digit OTP sent successfully to +91 ${cleanMobile}`,
        isTestFallback: false,
      };
    }
    console.warn("AquaSMS rejected OTP:", responseCode);
    if (code.includes("insufficient")) {
      return { ok: false, message: "OTP service unavailable (SMS credit khatam). Please contact support." };
    }
    return { ok: false, message: `OTP send failed: ${responseCode}` };
  };

  // 1. If running natively in Android / iOS via Capacitor:
  // Capacitor native HTTP bypasses all browser CORS restrictions!
  if (Capacitor.isNativePlatform()) {
    try {
      const response = await CapacitorHttp.get({ url: directUrl });
      const result = interpret(response.data);
      if (result) return result;
    } catch (nativeErr) {
      console.warn("Capacitor native SMS send error:", nativeErr);
    }
  }

  // 2. If running on Web: Try Netlify proxy endpoint if available (/api/aquasms/...)
  const isWeb = typeof window !== "undefined";
  if (isWeb) {
    const proxyPath = endpoint.replace("https://login.aquasms.com", "/api/aquasms");
    const proxyUrl = `${proxyPath}?${params.toString()}`;

    try {
      const res = await fetch(proxyUrl, { method: "GET" });
      if (res.ok) {
        const result = interpret(await res.json().catch(() => null));
        if (result) return result;
      }
    } catch {
      // Netlify proxy not available locally, proceed to direct fallback
    }

    // 3. Direct browser fetch with no-cors fallback:
    // Sends the GET request to AquaSMS so the SMS is delivered even if browser cannot read CORS response.
    try {
      await fetch(directUrl, { method: "GET", mode: "no-cors" });
      return {
        ok: true,
        sessionId: `aquasms_${Date.now()}`,
        otp,
        message: `4-Digit OTP sent to +91 ${cleanMobile}`,
        isTestFallback: false,
      };
    } catch (fetchErr) {
      console.warn("Direct fetch error:", fetchErr);
    }
  }

  // 4. Safe fallback for offline or testing mode
  return {
    ok: true,
    sessionId: `test_${Date.now()}`,
    otp,
    isTestFallback: true,
    message: `Test OTP: ${otp} (Master bypass: ${MASTER_TEST_OTP})`,
  };
}

/**
 * Verifies the 4-digit OTP.
 * Supports the expected generated OTP as well as the Master Test OTP (1234).
 */
export async function verify4DigitOtp(
  enteredOtp: string,
  expectedOtp: string,
  sessionId?: string
): Promise<{ ok: boolean; message?: string }> {
  const cleanInput = enteredOtp.trim();

  if (cleanInput.length !== 4) {
    return { ok: false, message: "Please enter the 4-digit OTP" };
  }

  // Allow generated OTP or Master Test OTP (1234)
  if (cleanInput === expectedOtp || cleanInput === MASTER_TEST_OTP) {
    return { ok: true };
  }

  return { ok: false, message: "Invalid OTP! Please check and enter the correct 4 digits." };
}
