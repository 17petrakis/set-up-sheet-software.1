import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { verifyEmployeeToken, getSyncSecret } from '../../shared/employeeToken.ts';

export default async function (req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { machineId, tools, employeeToken } = body || {};

    const syncKey = getSyncSecret();
    const procedureAppUrl = Deno.env.get("PROCEDURE_APP_URL");

    if (!syncKey || !procedureAppUrl) {
      return Response.json({ error: 'Server not configured' }, { status: 500 });
    }

    // An authenticated app user is required — this endpoint is not an open proxy.
    const base44 = createClientFromRequest(req);
    let user = null;
    try {
      user = await base44.auth.me();
    } catch {
      user = null;
    }
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only an admin shop-floor session may push tool lists to a machine.
    const session = await verifyEmployeeToken(String(employeeToken || ''), syncKey);
    if (!session || !session.isAdmin) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!machineId || typeof machineId !== 'string' || machineId.length > 120) {
      return Response.json({ error: 'machineId is required' }, { status: 400 });
    }
    if (!Array.isArray(tools) || tools.length > 200) {
      return Response.json({ error: 'tools must be an array of at most 200 tools' }, { status: 400 });
    }

    // Only a machine that actually exists in this app may be synced.
    const machines = await base44.asServiceRole.entities.MachineTool.list('machine_name', 500);
    const target = (machines || []).find((m) => m.id === machineId || m.machine_name === machineId);
    if (!target) {
      return Response.json({ error: 'Unknown machine' }, { status: 403 });
    }

    const response = await fetch(`${procedureAppUrl}/functions/updateMachineToolList`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        syncKey,
        machineId,
        tools,
      }),
    });

    if (!response.ok) {
      console.error('Procedure app request failed', response.status, await response.text());
      return Response.json({ error: 'Procedure app request failed' }, { status: 502 });
    }

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}