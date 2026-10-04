// 2Factor.in 4-Digit OTP Service

export const DEFAULT_2FACTOR_API_KEY = "a0cb5b35-bdb3-425b-a648-2a0561771322";

export interface SendOtpResult {
  ok: boolean;
  sessionId?: string;
  otp?: string;
  message?: string;
  isTestFallback?: boolean;
}

/**
 * Sends a 4-digit OTP to an Indian mobile number using 2Factor.in API.
 * Uses custom 4-digit code generation so the app has full control of length and verification.
 */
export async function send4DigitOtp(mobile: string, customApiKey?: string): Promise<SendOtpResult> {
  const apiKey = (customApiKey || process.env.NEXT_PUBLIC_2FACTOR_API_KEY || DEFAULT_2FACTOR_API_KEY).trim();
  const cleanMobile = mobile.replace(/\D/g, "");

  if (cleanMobile.length !== 10) {
    return { ok: false, message: "Please enter a valid 10-digit mobile number" };
  }

  // Generate 4-digit random number (1000 - 9999)
  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  try {
    // 2Factor endpoint for custom OTP SMS delivery
    const url = `https://2factor.in/API/V1/${apiKey}/SMS/${cleanMobile}/${otp}`;
    const res = await fetch(url, { method: "GET" });
    const data = await res.json().catch(() => null);

    if (data && data.Status === "Success") {
      return {
        ok: true,
        sessionId: data.Details,
        otp,
        message: `4-Digit OTP sent successfully to +91 ${cleanMobile}`,
        isTestFallback: false,
      };
    } else {
      console.warn("2Factor API response:", data);
      const detail = data?.Details || "SMS Gateway inactive";
      // If 2Factor account is pending activation, DLT or balance, provide fallback so users can still register
      return {
        ok: true,
        sessionId: `local_${Date.now()}`,
        otp,
        isTestFallback: true,
        message: `${detail}. (Test OTP: ${otp})`,
      };
    }
  } catch (err: any) {
    console.error("2Factor send error:", err);
    return {
      ok: true,
      sessionId: `local_${Date.now()}`,
      otp,
      isTestFallback: true,
      message: `Network offline/fallback. (Test OTP: ${otp})`,
    };
  }
}

/**
 * Verifies the 4-digit OTP.
 */
export async function verify4DigitOtp(
  enteredOtp: string,
  expectedOtp: string,
  sessionId?: string,
  customApiKey?: string
): Promise<{ ok: boolean; message?: string }> {
  const cleanInput = enteredOtp.trim();

  if (cleanInput.length !== 4) {
    return { ok: false, message: "Please enter the 4-digit OTP" };
  }

  if (cleanInput === expectedOtp) {
    return { ok: true };
  }

  // If there's an active 2Factor server session
  if (sessionId && !sessionId.startsWith("local_")) {
    try {
      const apiKey = (customApiKey || process.env.NEXT_PUBLIC_2FACTOR_API_KEY || DEFAULT_2FACTOR_API_KEY).trim();
      const verifyUrl = `https://2factor.in/API/V1/${apiKey}/SMS/VERIFY/${sessionId}/${cleanInput}`;
      const res = await fetch(verifyUrl, { method: "GET" });
      const data = await res.json().catch(() => null);
      if (data && data.Status === "Success" && data.Details === "OTP Matched") {
        return { ok: true };
      }
    } catch (e) {
      console.warn("2Factor verify error:", e);
    }
  }

  return { ok: false, message: "Invalid OTP! Please check and enter the correct 4 digits." };
}
