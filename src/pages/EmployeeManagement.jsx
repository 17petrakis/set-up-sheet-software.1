import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BadgeCheck, Plus, Trash2, Search, ArrowLeft, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function EmployeeManagement() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState("");
  const [newEmployee, setNewEmployee] = useState({
    employee_number: "",
    full_name: "",
    email: "",
    active: true,
  });

  const loadEmployees = async () => {
    setLoading(true);
    const data = await base44.entities.Employee.list("-created_date", 200);
    setEmployees(data);
    setLoading(false);
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const handleAddEmployee = async () => {
    if (!newEmployee.employee_number.trim()) return;
    
    await base44.entities.Employee.create({
      ...newEmployee,
      employee_number: newEmployee.employee_number.toUpperCase().trim(),
    });
    
    setNewEmployee({ employee_number: "", full_name: "", email: "", active: true });
    setShowAddDialog(false);
    loadEmployees();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await base44.entities.Employee.delete(deleteTarget.id);
    setDeleteTarget(null);
    loadEmployees();
  };

  const handleToggleActive = async (employee) => {
    await base44.entities.Employee.update(employee.id, {
      active: !employee.active,
    });
    loadEmployees();
  };

  const filtered = employees.filter(
    (e) =>
      e.employee_number?.toLowerCase().includes(search.toLowerCase()) ||
      e.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      e.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">
            {employees.filter((e) => e.active).length} active employees
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Employee Management</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Add or remove employee access to the system
            </p>
          </div>
          <Button onClick={() => setShowAddDialog(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Employee
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by employee number, name, or email..."
            className="pl-9 h-10 text-sm bg-card border-border"
          />
        </div>

        {/* Employee List */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
            Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
              <BadgeCheck className="w-7 h-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">
                {search ? "No employees found" : "No employees yet"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {search
                  ? "Try adjusting your search terms"
                  : "Add your first employee to get started"}
              </p>
            </div>
            {!search && (
              <Button size="sm" onClick={() => setShowAddDialog(true)} className="gap-1.5">
                <UserPlus className="w-3.5 h-3.5" />
                Add Employee
              </Button>
            )}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Employee #
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Name
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Email
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((employee) => (
                  <tr
                    key={employee.id}
                    className="border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <span className="font-mono text-sm font-medium text-foreground">
                        {employee.employee_number}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-foreground">
                      {employee.full_name || "—"}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {employee.email || "—"}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleActive(employee)}
                        className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                          employee.active
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {employee.active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="text-right py-3 px-4">
                      <button
                        onClick={() => setDeleteTarget(employee)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1.5 hover:bg-destructive/10 rounded"
                        title="Delete employee"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Employee Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
            <DialogDescription>
              Create a new employee account with access to the system.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="employeeNumber">Employee Number *</Label>
              <Input
                id="employeeNumber"
                value={newEmployee.employee_number}
                onChange={(e) =>
                  setNewEmployee({ ...newEmployee, employee_number: e.target.value.toUpperCase() })
                }
                placeholder="e.g., EMP001"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={newEmployee.full_name}
                onChange={(e) =>
                  setNewEmployee({ ...newEmployee, full_name: e.target.value })
                }
                placeholder="John Doe"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newEmployee.email}
                onChange={(e) =>
                  setNewEmployee({ ...newEmployee, email: e.target.value })
                }
                placeholder="john@example.com"
                className="h-10"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddEmployee}>Add Employee</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>{deleteTarget?.employee_number || "this employee"}</strong>? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}