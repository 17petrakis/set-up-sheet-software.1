import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, BadgeCheck } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

export default function Login() {
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmployeeVerify = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const employees = await base44.entities.Employee.filter({ 
        employee_number: employeeNumber.trim().toUpperCase()
      });

      if (employees.length === 0) {
        setError("Invalid employee number. Please contact your administrator.");
        setLoading(false);
        return;
      }

      const employee = employees[0];

      // Call backend function to handle employee-based login (no email required)
      const response = await base44.functions.invoke('loginEmployee', { 
        employeeNumber: employeeNumber.trim().toUpperCase()
      });
      
      if (response.data.access_token) {
        // Store employee session in localStorage
        localStorage.setItem('employee_session', JSON.stringify({
          token: response.data.access_token,
          employee_number: response.data.employee_number,
          employee_id: response.data.employee_id,
          role: response.data.role
        }));
        window.location.href = "/";
      } else {
        throw new Error('Login failed');
      }
    } catch (err) {
      setError("Login failed. Please contact your administrator.");
    } finally {
      setLoading(false);
    }
  };

  return (
      <AuthLayout
        icon={BadgeCheck}
        title="Employee Access"
        subtitle="Verify your employee number to continue"
      >
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleEmployeeVerify} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employeeNumber">Employee Number</Label>
            <Input
              id="employeeNumber"
              type="text"
              autoFocus
              placeholder="e.g., EMP001"
              value={employeeNumber}
              onChange={(e) => setEmployeeNumber(e.target.value.toUpperCase())}
              className="h-12"
              disabled={loading}
              required
            />
          </div>
          <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Don't have an employee number?{" "}
          <span className="text-foreground font-medium">Contact your administrator</span>
        </div>
      </AuthLayout>
    );
}