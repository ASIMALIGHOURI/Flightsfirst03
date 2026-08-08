/**
 * POST /api/submit-lead
 *
 * Runs on Cloudflare Pages (Functions). Sits between the site's lead forms
 * and FormSubmit.co so the Turnstile token gets REAL server-side
 * verification (the client-side widget alone cannot do this — it can only
 * prove a challenge was solved in the browser, not confirm that with
 * Cloudflare's servers).
 *
 * Required setup (do this in the Cloudflare Pages dashboard, never in code):
 *   Pages project → Settings → Environment variables → add a variable named
 *   TURNSTILE_SECRET_KEY with your Turnstile secret key, for both
 *   "Production" and "Preview" environments. Encrypt it if offered.
 *
 * This file deliberately never contains the secret key itself — it is read
 * from the environment at request time via `context.env.TURNSTILE_SECRET_KEY`.
 */

const LEAD_EMAIL = "info@flightsfirst.co.uk";
const FORMSUBMIT_ENDPOINT = `https://formsubmit.co/ajax/${LEAD_EMAIL}`;
const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status: status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let formData;
  try {
    formData = await request.formData();
  } catch (err) {
    return jsonResponse({ success: false, error: "Could not read form data." }, 400);
  }

  // Honeypot check (defense in depth — FormSubmit also checks this, but we
  // can reject earlier and avoid ever calling Turnstile/FormSubmit for
  // obvious bots).
  // Accept multiple common honeypot field names so backend matches frontend.
  const honey = (formData.get("_honey") || formData.get("user_website_url") || formData.get("website"));
  if (honey) {
    // Pretend success so bots don't learn the honeypot was detected.
    return jsonResponse({ success: true }, 200);
  }

  const token = formData.get("cf-turnstile-response");
  if (!token) {
    return jsonResponse({ success: false, error: "Missing Turnstile token." }, 400);
  }

  if (!env.TURNSTILE_SECRET_KEY) {
    // Misconfiguration on our side — fail closed, but with a distinct
    // message so it's easy to spot in logs during setup.
    return jsonResponse(
      { success: false, error: "Server is not configured with a Turnstile secret key." },
      500
    );
  }

  // ---- Verify the token with Cloudflare ----
  // Use application/x-www-form-urlencoded as recommended in Cloudflare docs.
  const verifyBody = new URLSearchParams();
  verifyBody.append("secret", env.TURNSTILE_SECRET_KEY);
  verifyBody.append("response", token);
  const ip = request.headers.get("CF-Connecting-IP");
  if (ip) verifyBody.append("remoteip", ip);

  let verifyJson;
  try {
    const verifyRes = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: verifyBody.toString(),
    });
    verifyJson = await verifyRes.json();
  } catch (err) {
    return jsonResponse({ success: false, error: "Could not reach Turnstile verification service." }, 502);
  }

  if (!verifyJson.success) {
    return jsonResponse(
      { success: false, error: "Turnstile verification failed.", codes: verifyJson["error-codes"] || [] },
      403
    );
  }

  // ---- Verified — relay the lead on to FormSubmit ----
  // Drop the token field before forwarding; FormSubmit doesn't need it and
  // it's already served its purpose.
  formData.delete("cf-turnstile-response");

  try {
    const forwardRes = await fetch(FORMSUBMIT_ENDPOINT, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: formData,
    });
    if (!forwardRes.ok) {
      return jsonResponse({ success: false, error: "Lead delivery failed." }, 502);
    }
  } catch (err) {
    return jsonResponse({ success: false, error: "Lead delivery failed." }, 502);
  }

  return jsonResponse({ success: true }, 200);
}

// Any method other than POST is not supported on this endpoint.
export async function onRequestGet() {
  return jsonResponse({ success: false, error: "Method not allowed." }, 405);
}
