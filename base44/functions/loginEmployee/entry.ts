import { createClient } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const { employeeNumber } = await req.json();

    if (!employeeNumber) {
      return Response.json({ error: 'Missing employee number' }, { status: 400 });
    }

    // Use service role directly (no user auth needed for login)
    const base44 = createClient({
      baseURL: Deno.env.get('BASE44_API_URL') || 'https://api.base44.com',
      serviceRoleKey: Deno.env.get('BASE44_SERVICE_ROLE_KEY')
    });
    
    const employees = await base44.asServiceRole.entities.Employee.filter({
      employee_number: employeeNumber
    });

    if (employees.length === 0) {
      return Response.json({ error: 'Invalid employee' }, { status: 401 });
    }

    const employee = employees[0];

    if (!employee.active) {
      return Response.json({ error: 'Employee account is inactive' }, { status: 403 });
    }

    // Determine role based on employee number
    const role = employeeNumber === 'ADMIN001' ? 'admin' : 'user';

    // Generate a session token
    const token = crypto.getRandomValues(new Uint8Array(32));
    const tokenHex = Array.from(token).map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Create session record
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 day expiry
    
    await base44.asServiceRole.entities.Session.create({
      employee_id: employee.id,
      token: tokenHex,
      role: role,
      expires_at: expiresAt.toISOString()
    });
    
    return Response.json({ 
      access_token: tokenHex, 
      role, 
      employee_number: employeeNumber,
      employee_id: employee.id 
    });
  } catch (error) {
    console.error('Employee login error:', error);
    return Response.json({ error: error.message || 'Login failed' }, { status: 500 });
  }
});