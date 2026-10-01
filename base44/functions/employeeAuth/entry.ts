import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { signEmployeeToken, verifyEmployeeToken, getSyncSecret } from '../../shared/employeeToken.ts';
import {
  loginThrottleKeys,
  unlockThrottleKeys,
  throttleScopes,
  blockedFor,
  recordFailure,
  lockoutMessage,
} from '../../shared/authThrottle.ts';

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

async function readSetting(base44, key, fallback) {
  const rows = await base44.asServiceRole.entities.Setting.filter({ key });
  const value = rows && rows.length > 0 ? rows[0].value : null;
  return value ? String(value) : fallback;
}

export default async function (req) {
  try {
    const secret = getSyncSecret();
    if (!secret) return Response.json({ error: 'Server not configured' }, { status: 500 });

    const body = await req.json().catch(() => ({}));
    const action = body?.action;
    const base44 = createClientFromRequest(req);

    const sessionFromToken = async () => {
      const payload = await verifyEmployeeToken(body?.token, secret);
      return payload;
    };

    const requireAdmin = async () => {
      const payload = await sessionFromToken();
      if (!payload || !payload.isAdmin) return null;
      return payload;
    };

    // --- Shop-floor login: validated here, never in the browser ---------------
    if (action === 'login') {
      const raw = String(body?.entered || '').trim();
      if (!raw) return Response.json({ error: 'Enter your employee number and code.' });

      // Brute-force guard: repeated failed guesses from the same caller block
      // the attempt before any credential is compared.
      const loginKeys = loginThrottleKeys(req, raw);
      const loginBlockedMs = await blockedFor(base44, loginKeys);
      if (loginBlockedMs > 0) {
        console.log('[employeeAuth] login blocked; scopes:', throttleScopes(loginKeys));
        return Response.json({ error: lockoutMessage(loginBlockedMs) });
      }

      const loginCode = await readSetting(base44, 'login_code', 'SUS');
      const adminCode = await readSetting(base44, 'admin_code', 'ADMIN001SUS');
      const upper = raw.toUpperCase();

      if (upper === adminCode.trim().toUpperCase()) {
        const session = { employeeNumber: 'ADMIN001', name: '', isAdmin: true };
        const token = await signEmployeeToken({ ...session, exp: Date.now() + SESSION_TTL_MS }, secret);
        return Response.json({ ...session, token });
      }

      const suffix = loginCode.trim().toUpperCase();
      const suffixMatches =
        Boolean(suffix) && upper.length > suffix.length && upper.slice(-suffix.length) === suffix;
      const employeeNumber = suffixMatches ? raw.slice(0, raw.length - suffix.length) : '';
      const rows = suffixMatches
        ? await base44.asServiceRole.entities.Employee.filter({ employeeNumber, isActive: true })
        : [];

      if (!rows || rows.length === 0) {
        await recordFailure(base44, loginKeys);
        console.log('[employeeAuth] login failed; scopes:', throttleScopes(loginKeys));
        // One answer for both a wrong code and an unknown employee number, so
        // the reply cannot be used to confirm a guessed login code.
        return Response.json({ error: 'Invalid employee number or code.' });
      }

      const emp = rows[0];
      const session = { employeeNumber: emp.employeeNumber, name: emp.name || '', isAdmin: false };
      const token = await signEmployeeToken({ ...session, exp: Date.now() + SESSION_TTL_MS }, secret);
      return Response.json({ ...session, token });
    }

    // --- Session verification (used on every app load) -----------------------
    if (action === 'verify') {
      const payload = await sessionFromToken();
      if (!payload) return Response.json({ valid: false });

      if (payload.isAdmin) {
        return Response.json({
          valid: true,
          employeeNumber: payload.employeeNumber,
          name: payload.name || '',
          isAdmin: true,
        });
      }

      // A deactivated employee loses access immediately.
      const rows = await base44.asServiceRole.entities.Employee.filter({
        employeeNumber: payload.employeeNumber,
        isActive: true,
      });
      if (!rows || rows.length === 0) return Response.json({ valid: false });
      return Response.json({
        valid: true,
        employeeNumber: rows[0].employeeNumber,
        name: rows[0].name || '',
        isAdmin: false,
      });
    }

    // --- Admin unlock password: compared on the server ----------------------
    if (action === 'adminUnlock') {
      const payload = await sessionFromToken();
      if (!payload) return Response.json({ ok: false }, { status: 401 });

      const unlockKeys = unlockThrottleKeys(req, payload.employeeNumber);
      const unlockBlockedMs = await blockedFor(base44, unlockKeys);
      if (unlockBlockedMs > 0) {
        console.log('[employeeAuth] adminUnlock blocked; scopes:', throttleScopes(unlockKeys));
        return Response.json({ ok: false, retryAfterMs: unlockBlockedMs });
      }

      const adminCode = await readSetting(base44, 'admin_code', 'ADMIN001SUS');
      const ok = String(body?.password || '').trim().toUpperCase() === adminCode.trim().toUpperCase();
      if (!ok) {
        await recordFailure(base44, unlockKeys);
        console.log('[employeeAuth] adminUnlock failed; scopes:', throttleScopes(unlockKeys));
      }
      return Response.json({ ok });
    }

    // --- Admin-only back office --------------------------------------------
    const admin = await requireAdmin();
    if (!admin) return Response.json({ error: 'Forbidden' }, { status: 403 });

    if (action === 'getLoginCode') {
      const code = await readSetting(base44, 'login_code', 'SUS');
      return Response.json({ code });
    }

    if (action === 'setLoginCode') {
      const code = String(body?.code || '').trim().toUpperCase();
      if (!/^[A-Z]{3}$/.test(code)) {
        return Response.json({ error: 'The login code must be 3 letters.' }, { status: 400 });
      }
      const rows = await base44.asServiceRole.entities.Setting.filter({ key: 'login_code' });
      if (rows && rows.length > 0) {
        await base44.asServiceRole.entities.Setting.update(rows[0].id, { value: code });
      } else {
        await base44.asServiceRole.entities.Setting.create({ key: 'login_code', value: code });
      }
      return Response.json({ code });
    }

    if (action === 'listEmployees') {
      const employees = await base44.asServiceRole.entities.Employee.list('-created_date');
      return Response.json({ employees });
    }

    if (action === 'createEmployee') {
      const data = body?.data || {};
      const employee = await base44.asServiceRole.entities.Employee.create({
        employeeNumber: String(data.employeeNumber || '').trim(),
        name: String(data.name || '').trim(),
        isActive: data.isActive !== false,
      });
      return Response.json({ employee });
    }

    if (action === 'updateEmployee') {
      const id = String(body?.id || '');
      if (!id) return Response.json({ error: 'id is required' }, { status: 400 });
      const data = body?.data || {};
      const patch = {};
      if (data.employeeNumber !== undefined) patch.employeeNumber = String(data.employeeNumber).trim();
      if (data.name !== undefined) patch.name = String(data.name).trim();
      if (data.isActive !== undefined) patch.isActive = data.isActive === true;
      const employee = await base44.asServiceRole.entities.Employee.update(id, patch);
      return Response.json({ employee });
    }

    if (action === 'deleteEmployee') {
      const id = String(body?.id || '');
      if (!id) return Response.json({ error: 'id is required' }, { status: 400 });
      await base44.asServiceRole.entities.Employee.delete(id);
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}