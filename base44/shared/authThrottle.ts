// Brute-force protection for the shop-floor sign-in and the admin unlock.
//
// Counters are kept in the Setting store (written with the service role, which
// bypasses the entity rules for these internal rows), so a lockout survives a
// cold start or a second function instance instead of living in memory only.
//
// Every failed guess is counted against up to three independent buckets:
//   ip     — the caller's network address, when the platform exposes one
//   login  — the employee-number prefix that was submitted (or "nodigits")
//   global — a flood guard shared by all callers
// Hitting the limit on any bucket blocks that caller until the window clears.

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 8;
const LOCKOUT_MS = 10 * 60 * 1000;
const MAX_LOCKOUT_MS = 60 * 60 * 1000;
const GLOBAL_MAX_FAILURES = 40;
const GLOBAL_LOCKOUT_MS = 10 * 60 * 1000;
const PREFIX = "auth_throttle_";

// Non-reversible bucket id, so raw addresses and employee numbers are never
// written to the database.
function fingerprint(value) {
  let hash = 0x811c9dc5;
  const text = String(value);
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(36);
}

// The caller's address as seen by the platform proxy, or "" when unavailable.
export function callerAddress(req) {
  const headers = req?.headers;
  if (!headers || typeof headers.get !== "function") return "";
  const raw =
    headers.get("x-forwarded-for") ||
    headers.get("cf-connecting-ip") ||
    headers.get("x-real-ip") ||
    "";
  return String(raw).split(",")[0].trim();
}

export function loginThrottleKeys(req, entered) {
  const keys = [];
  const address = callerAddress(req);
  if (address) keys.push(`ip_${fingerprint(address)}`);
  const digits = String(entered || "").trim().match(/^[0-9]+/);
  keys.push(`login_${digits ? fingerprint(digits[0]) : "nodigits"}`);
  keys.push("global");
  return keys;
}

export function unlockThrottleKeys(req, employeeNumber) {
  const keys = [];
  const address = callerAddress(req);
  if (address) keys.push(`ip_${fingerprint(address)}`);
  const who = String(employeeNumber || "unknown").trim().toUpperCase();
  keys.push(`unlock_${fingerprint(who)}`);
  keys.push("global");
  return keys;
}

// Bucket kinds only — safe to log, never the values.
export function throttleScopes(keys) {
  return keys.map((key) => String(key).split("_")[0]).join(",");
}

function limitFor(key) {
  return key === "global"
    ? { failures: GLOBAL_MAX_FAILURES, lockout: GLOBAL_LOCKOUT_MS }
    : { failures: MAX_FAILURES, lockout: LOCKOUT_MS };
}

export function lockoutMessage(retryAfterMs) {
  const minutes = Math.max(1, Math.ceil(retryAfterMs / 60000));
  return `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}

async function readState(base44, key) {
  try {
    const rows = await base44.asServiceRole.entities.Setting.filter({ key: PREFIX + key });
    if (!rows || rows.length === 0) return null;
    let state = {};
    try {
      state = JSON.parse(String(rows[0].value || "")) || {};
    } catch {
      state = {};
    }
    return { id: rows[0].id, state };
  } catch (error) {
    // Never block a sign-in because the counter could not be read.
    console.warn("[employeeAuth] throttle read failed", error?.message || "");
    return null;
  }
}

// Milliseconds the caller must wait, or 0 when they may try again.
export async function blockedFor(base44, keys) {
  const now = Date.now();
  const waits = await Promise.all(
    keys.map(async (key) => {
      const row = await readState(base44, key);
      const until = Number(row?.state?.lockedUntil || 0);
      return until > now ? until - now : 0;
    }),
  );
  return waits.reduce((max, value) => (value > max ? value : max), 0);
}

export async function recordFailure(base44, keys) {
  const now = Date.now();
  await Promise.all(
    keys.map(async (key) => {
      const limits = limitFor(key);
      const row = await readState(base44, key);
      const state = row?.state && typeof row.state === "object" ? row.state : {};
      let fails = Number(state.fails || 0);
      let windowStart = Number(state.windowStart || 0);
      let lockedUntil = Number(state.lockedUntil || 0);

      if (lockedUntil > now) {
        // Still guessing while locked out — extend the lockout, capped.
        lockedUntil = Math.min(now + (lockedUntil - now) * 2, now + MAX_LOCKOUT_MS);
      } else if (!windowStart || now - windowStart > WINDOW_MS) {
        fails = 1;
        windowStart = now;
        lockedUntil = 0;
      } else {
        fails += 1;
        if (fails >= limits.failures) {
          lockedUntil = now + limits.lockout;
          fails = 0;
          windowStart = now;
        }
      }

      const value = JSON.stringify({ fails, windowStart, lockedUntil });
      try {
        if (row?.id) {
          await base44.asServiceRole.entities.Setting.update(row.id, { value });
        } else {
          await base44.asServiceRole.entities.Setting.create({ key: PREFIX + key, value });
        }
      } catch (error) {
        console.warn("[employeeAuth] throttle write failed", error?.message || "");
      }
    }),
  );
}