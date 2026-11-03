// Signed shop-floor session tokens.
// The token is issued by the employeeAuth function after the server itself has
// validated an employee number + shared login code (or the admin code), and it
// is verified here before any privileged action is allowed. The signing key is a
// server-only secret, so a browser cannot mint or alter a session.

const encoder = new TextEncoder();

function bytesToBase64Url(bytes) {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(value) {
  const padded = String(value).replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hmacKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function signEmployeeToken(payload, secret) {
  const body = bytesToBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign("HMAC", await hmacKey(secret), encoder.encode(body));
  return `${body}.${bytesToBase64Url(new Uint8Array(signature))}`;
}

// Returns the payload when the signature and expiry are valid, otherwise null.
export async function verifyEmployeeToken(token, secret) {
  if (typeof token !== "string" || !token.includes(".")) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  try {
    const valid = await crypto.subtle.verify(
      "HMAC",
      await hmacKey(secret),
      base64UrlToBytes(signature),
      encoder.encode(body),
    );
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(body)));
    if (!payload || typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

// Key for the procedure-app sync handshake. It is handed to an external system,
// so it is never used to sign anything this app trusts.
export function getSyncSecret() {
  return Deno.env.get("SETUP_SHEET_SYNC_KEY") || "";
}

// Key that signs shop-floor session tokens. This secret stays inside this app's
// environment — it is never sent to another system — so a leak on the procedure
// app side cannot be turned into an employee or admin session here.
export function getSessionSecret() {
  return Deno.env.get("EMPLOYEE_SESSION_SECRET") || "";
}