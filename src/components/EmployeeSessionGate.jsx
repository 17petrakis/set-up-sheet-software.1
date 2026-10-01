import React, { useEffect, useState } from "react";
import { initEmployeeSession } from "@/lib/employeeSession";

// Verifies the stored shop-floor session with the server before any page
// renders, so no part of the app ever acts on an unverified session.
export default function EmployeeSessionGate({ children }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    initEmployeeSession().finally(() => {
      if (active) setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  if (!ready) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return children;
}