import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const { employeeNumber } = await req.json();

    if (!employeeNumber) {
      return Response.json({ error: 'Missing employee number' }, { status: 400 });
    }

    // Verify employee exists in database
    const base44 = createClientFromRequest(req);
    const employees = await base44.asServiceRole.entities.Employee.filter({
      employee_number: employeeNumber
    });

    if (employees.length === 0) {
      return Response.json({ error: 'Invalid employee' }, { status: 401 });
    }

    const employee = employees[0];

    // Determine role based on employee number
    const role = employeeNumber === 'ADMIN001' ? 'admin' : 'user';

    // Create a login token using employee number as identifier
    const loginResult = await base44.asServiceRole.auth.createTokenForUser(`${employeeNumber}@internal`);
    
    // Update the user's role in the User entity
    await base44.asServiceRole.entities.User.update(loginResult.user_id, { role });
    
    return Response.json({ access_token: loginResult.token, role });
  } catch (error) {
    console.error('Employee login error:', error);
    return Response.json({ error: error.message || 'Login failed' }, { status: 500 });
  }
});