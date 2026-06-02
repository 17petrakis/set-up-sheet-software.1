import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useEmployeeAuth } from "@/lib/EmployeeAuthContext";

const DefaultFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

export default function ProtectedRoute({ fallback = <DefaultFallback /> }) {
  const { isAuthenticated, isLoading } = useEmployeeAuth();

  if (isLoading) {
    return fallback;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}