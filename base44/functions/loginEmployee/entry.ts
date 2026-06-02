import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const { employeeNumber, employeeEmail } = await req.json();

    if (!employeeNumber || !employeeEmail) {
      return Response.json({ error: 'Missing employee details' }, { status: 400 });
    }

    // Verify employee exists in database
    const base44 = createClientFromRequest(req);
    const employees = await base44.asServiceRole.entities.Employee.filter({
      employee_number: employeeNumber,
      email: employeeEmail
    });

    if (employees.length === 0) {
      return Response.json({ error: 'Invalid employee' }, { status: 401 });
    }

    const employee = employees[0];

    // Create a login token for the employee using their email
    // This uses the base44 auth system to generate a valid token
    const loginResult = await base44.asServiceRole.auth.createTokenForUser(employeeEmail);
    
    return Response.json({ access_token: loginResult.token });
  } catch (error) {
    console.error('Employee login error:', error);
    return Response.json({ error: error.message || 'Login failed' }, { status: 500 });
  }
});