import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function EmployeeLogin() {
  const navigate = useNavigate();
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const session = localStorage.getItem("employeeSession");
    if (session) navigate("/");
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    const num = employeeNumber.trim();
    if (!num) return;

    // Admin special case
    if (num === "ADMIN001") {
      localStorage.setItem("employeeSession", JSON.stringify({ employeeNumber: "ADMIN001", isAdmin: true }));
      navigate("/");
      return;
    }

    setLoading(true);
    try {
      const results = await base44.entities.Employee.filter({ employeeNumber: num, isActive: true });
      if (results && results.length > 0) {
        const emp = results[0];
        localStorage.setItem("employeeSession", JSON.stringify({ employeeNumber: emp.employeeNumber, name: emp.name }));
        navigate("/");
      } else {
        setError("Employee number not found or inactive.");
      }
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
              className="h-12 w-auto object-contain"
            />
          </div>
          <h1 className="text-xl font-bold text-foreground text-center mb-1">Shop Floor Login</h1>
          <p className="text-sm text-muted-foreground text-center mb-6">Enter your employee number to continue</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Employee Number</label>
              <Input
                value={employeeNumber}
                onChange={(e) => setEmployeeNumber(e.target.value)}
                placeholder="e.g. EMP001"
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