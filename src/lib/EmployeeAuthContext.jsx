import React, { createContext, useContext, useState, useEffect } from 'react';

const EmployeeAuthContext = createContext(null);

export function EmployeeAuthProvider({ children }) {
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored employee session on mount
    const employeeNumber = localStorage.getItem("employee_number");
    const employeeName = localStorage.getItem("employee_name");
    const employeeRole = localStorage.getItem("employee_role");
    const employeeId = localStorage.getItem("employee_id");

    if (employeeNumber && employeeName) {
      setCurrentEmployee({
        employee_number: employeeNumber,
        full_name: employeeName,
        role: employeeRole || "employee",
        id: employeeId
      });
    }
    setIsLoading(false);
  }, []);

  const login = (employee) => {
    localStorage.setItem("employee_number", employee.employee_number);
    localStorage.setItem("employee_name", employee.full_name);
    localStorage.setItem("employee_role", employee.role);
    localStorage.setItem("employee_id", employee.id);
    setCurrentEmployee(employee);
  };

  const logout = () => {
    localStorage.removeItem("employee_number");
    localStorage.removeItem("employee_name");
    localStorage.removeItem("employee_role");
    localStorage.removeItem("employee_id");
    setCurrentEmployee(null);
  };

  const refreshSession = async () => {
    const employeeNumber = localStorage.getItem("employee_number");
    if (!employeeNumber) return;

    try {
      const { base44 } = await import('@/api/base44Client');
      const employees = await base44.entities.Employee.filter({ employee_number: employeeNumber, is_active: true });
      if (employees.length > 0) {
        const employee = employees[0];
        login(employee);
      }
    } catch (error) {
      console.error("Failed to refresh session:", error);
    }
  };

  const value = {
    currentEmployee,
    isLoading,
    isAuthenticated: !!currentEmployee,
    isAdmin: currentEmployee?.role === "admin",
    login,
    logout,
    refreshSession
  };

  return (
    <EmployeeAuthContext.Provider value={value}>
      {children}
    </EmployeeAuthContext.Provider>
  );
}

export function useEmployeeAuth() {
  const context = useContext(EmployeeAuthContext);
  if (!context) {
    throw new Error("useEmployeeAuth must be used within an EmployeeAuthProvider");
  }
  return context;
}