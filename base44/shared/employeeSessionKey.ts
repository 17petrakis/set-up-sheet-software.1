// Key used to sign shop-floor session tokens.
//
// It must never be the same value that is handed to the external procedure app
// (SETUP_SHEET_SYNC_KEY): a leak on that side would otherwise let someone mint
// an admin session here.
//
// Optional override: EMPLOYEE_SESSION_SECRET. When that secret is not set, a
// random per-app key is generated once and kept in the Setting entity, which is
// readable only by admins through the client — backend functions read it with
// the service role.

import { getSessionSecret } from './employeeToken.ts';

const SETTING_KEY = 'employee_session_key';

async function readStoredKey(base44) {
  const rows = await base44.asServiceRole.entities.Setting.filter({ key: SETTING_KEY });
  return rows && rows.length > 0 ? String(rows[0].value || '') : '';
}

export async function getEmployeeSessionKey(base44) {
  const envKey = getSessionSecret();
  if (envKey) return envKey;

  const existing = await readStoredKey(base44);
  if (existing) return existing;

  // First use: create the key. If two requests race here, the second one reads
  // back whichever value landed first, so both sign with the same key.
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const generated = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  try {
    await base44.asServiceRole.entities.Setting.create({ key: SETTING_KEY, value: generated });
  } catch {
    // handled by the read-back below
  }
  const stored = await readStoredKey(base44);
  return stored || generated;
}