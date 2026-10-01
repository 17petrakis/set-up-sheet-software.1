import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { employeeLogin, getEmployeeSession } from "@/lib/employeeSession";

export default function EmployeeLogin() {
  const navigate = useNavigate();
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getEmployeeSession()) navigate("/");
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    const entered = employeeNumber.trim();
    if (!entered) return;

    setLoading(true);
    try {
      const { error: loginError } = await employeeLogin(entered);
      if (loginError) {
        setError(loginError);
        return;
      }
      navigate("/");
    } catch (err) {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-card border border-border rounded-2xl shadow-lg p-8">
          <div className="flex justify-center mb-6">
            <img
              src="https://media.base44.com/images/public/6a1e12b8c62750465a101e9a/815a07707_BlackwithSPILettering1.svg"
              alt="Logo"
              className="h-12 w-auto object-contain dark:invert"
            />
          </div>
          <h1 className="text-xl font-bold text-foreground text-center mb-1">Shop Floor Login</h1>
          <p className="text-sm text-muted-foreground text-center mb-6">Enter your employee number followed by the login code</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Employee Number, Code</label>
              <Input
                value={employeeNumber}
                onChange={(e) => setEmployeeNumber(e.target.value)}
                placeholder="e.g. EMP001XYZ"
                autoFocus
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading || !employeeNumber.trim()}>
              {loading ? "Checking..." : "Login"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}