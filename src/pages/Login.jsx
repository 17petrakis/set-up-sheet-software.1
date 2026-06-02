import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useEmployeeAuth } from "@/lib/EmployeeAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Loader2, Building2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

export default function Login() {
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useEmployeeAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // Search for employee by employee number
      const employees = await base44.entities.Employee.filter({
        employee_number: employeeNumber.trim().toUpperCase(),
        is_active: true
      });

      if (employees.length === 0) {
        setError("Invalid employee number or account is inactive");
        setLoading(false);
        return;
      }

      const employee = employees[0];
      
      // Use employee auth context to login
      login(employee);
      
      // Redirect to home page
      window.location.href = "/";
    } catch (err) {
      setError("Login failed. Please try again.");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={Building2}
      title="Employee Login"
      subtitle="Enter your employee number"
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="employee_number">Employee Number</Label>
          <div className="relative">
            <LogIn className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="employee_number"
              type="text"
              autoFocus
              placeholder="e.g., ADMIN001 or EMP001"
              value={employeeNumber}
              onChange={(e) => setEmployeeNumber(e.target.value)}
              className="pl-10 h-12 uppercase"
              required
            />
          </div>
        </div>
        
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Logging in...
            </>
          ) : (
            "Login"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}