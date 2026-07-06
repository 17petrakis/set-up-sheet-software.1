Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { machineId, turrets } = body;

    if (!machineId) {
      return Response.json({ error: 'machineId is required' }, { status: 400 });
    }

    const syncKey = Deno.env.get("SETUP_SHEET_SYNC_KEY");
    const procedureAppUrl = Deno.env.get("PROCEDURE_APP_URL");

    if (!syncKey || !procedureAppUrl) {
      return Response.json({ error: 'Missing required secrets (SETUP_SHEET_SYNC_KEY or PROCEDURE_APP_URL)' }, { status: 500 });
    }

    const response = await fetch(`${procedureAppUrl}/functions/updateMachineTurretList`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        syncKey,
        machineId,
        turrets: turrets || [],
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