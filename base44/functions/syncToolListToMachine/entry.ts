import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { machineId, tools } = body;

    if (!machineId) {
      return Response.json({ error: 'machineId is required' }, { status: 400 });
    }

    const syncKey = Deno.env.get("SETUP_SHEET_SYNC_KEY");
    const procedureAppUrl = Deno.env.get("PROCEDURE_APP_URL");

    if (!syncKey || !procedureAppUrl) {
      return Response.json({ error: 'Missing required secrets (SETUP_SHEET_SYNC_KEY or PROCEDURE_APP_URL)' }, { status: 500 });
    }

    const response = await fetch(`${procedureAppUrl}/functions/updateMachineToolList`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        syncKey,
        machineId,
        tools: tools || [],
      }),
    });

    let result;
    try {
      result = await response.json();
    } catch {
      result = { raw: await response.text() };
    }

    if (!response.ok) {
      return Response.json({ error: 'Procedure app request failed', details: result }, { status: response.status });
    }

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});