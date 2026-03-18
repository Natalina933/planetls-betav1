type CaptchaVerificationResult = {
  ok: boolean;
  error?: string;
};

type VerifyCaptchaOptions = {
  token?: string | null;
  ip?: string | null;
};

const CAPTCHA_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyCaptcha({
  token,
  ip,
}: VerifyCaptchaOptions): Promise<CaptchaVerificationResult> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY?.trim();

  // Keep captcha integration opt-in until the frontend widget is wired.
  if (!secretKey) {
    return { ok: true };
  }

  if (!token) {
    return { ok: false, error: "Captcha manquant." };
  }

  const body = new URLSearchParams();
  body.set("secret", secretKey);
  body.set("response", token);

  if (ip) {
    body.set("remoteip", ip);
  }

  try {
    const response = await fetch(CAPTCHA_VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
      cache: "no-store",
    });

    if (!response.ok) {
      return { ok: false, error: "Verification captcha indisponible." };
    }

    const payload = (await response.json()) as {
      success?: boolean;
      "error-codes"?: string[];
    };

    if (!payload.success) {
      return {
        ok: false,
        error:
          payload["error-codes"]?.join(", ") || "Echec de verification captcha.",
      };
    }

    return { ok: true };
  } catch (error) {
    console.error("[CAPTCHA] verification error:", error);
    return { ok: false, error: "Erreur de verification captcha." };
  }
}
