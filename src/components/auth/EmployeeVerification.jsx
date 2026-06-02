import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BadgeCheck, Loader2 } from "lucide-react";

export default function EmployeeVerification({ onVerified }) {
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const employees = await base44.entities.Employee.filter({ 
        employee_number: employeeNumber.trim(),
        active: true 
      });

      if (employees.length === 0) {
        setError("Invalid or inactive employee number");
        setLoading(false);
        return;
      }

      const employee = employees[0];
      onVerified(employee);
    } catch (err) {
      setError("Verification failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <BadgeCheck className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Employee Verification</h2>
        <p className="text-sm text-muted-foreground mt-1">Enter your employee number to continue</p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="employeeNumber">Employee Number</Label>
          <Input
            id="employeeNumber"
            type="text"
            autoFocus
            placeholder="e.g., EMP001"
            value={employeeNumber}
            onChange={(e) => setEmployeeNumber(e.target.value)}
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
    </div>
  );
}