import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, Lock, Loader2, BadgeCheck } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";

export default function Login() {
  const [step, setStep] = useState("employee"); // "employee" | "credentials"
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      if (employee.email) {
        setEmail(employee.email);
      }
      setStep("credentials");
    } catch (err) {
      setError("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.href = "/";
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep("employee");
    setError("");
  };

  if (step === "employee") {
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

  return (
    <AuthLayout
      icon={LogIn}
      title="Welcome back"
      subtitle={`Logged in as ${employeeNumber}`}
      footer={
        <>
          Wrong employee number?{" "}
          <button onClick={handleBack} className="text-primary font-medium hover:underline">
            Go back
          </button>
        </>
      }
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12"
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
            "Log in"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}