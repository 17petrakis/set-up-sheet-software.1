import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Trash2, UserCheck, UserX, Plus, Save, KeyRound, Bell, Check, X, Pencil } from "lucide-react";
import { format } from "date-fns";
import EditEmployeeDialog from "@/components/employees/EditEmployeeDialog";

export default function EmployeeManagement() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ employeeNumber: "", name: "" });
  const [authorized, setAuthorized] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [codeSaved, setCodeSaved] = useState("");
  const [editingEmp, setEditingEmp] = useState(null);

  // All hooks before any conditional return
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: () => base44.entities.Employee.list("-created_date"),
    enabled: authorized,
  });

  const { data: accessRequests = [] } = useQuery({
    queryKey: ["access_requests"],
    queryFn: () => base44.entities.AccessRequest.filter({ status: "pending" }),
    enabled: authorized,
  });

  const approveRequestMutation = useMutation({
    mutationFn: async (request) => {
      if (request.folder_id) {
        const sheets = await base44.entities.SetupSheet.filter({ folder_id: request.folder_id }, null, 500);
        if (sheets.length > 0) {
          await base44.entities.SetupSheet.bulkUpdate(sheets.map(s => ({ id: s.id, published: false })));
        }
      }
      return base44.entities.AccessRequest.update(request.id, { status: "approved" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["access_requests"] }),
  });

  const ignoreRequestMutation = useMutation({
    mutationFn: (id) => base44.entities.AccessRequest.update(id, { status: "ignored" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["access_requests"] }),
  });

  const { data: loginSetting } = useQuery({
    queryKey: ["login_code"],
    queryFn: async () => {
      const rows = await base44.entities.Setting.filter({ key: "login_code" });
      return rows && rows.length > 0 ? rows[0] : null;
    },
  });

  useEffect(() => {
    if (loginSetting) {
      setCodeInput(loginSetting.value || "");
      setCodeSaved(loginSetting.value || "");
    }
  }, [loginSetting]);

  const updateCodeMutation = useMutation({
    mutationFn: async (newCode) => {
      if (loginSetting) {
        return base44.entities.Setting.update(loginSetting.id, { value: newCode });
      } else {
        return base44.entities.Setting.create({ key: "login_code", value: newCode });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["login_code"] });
      setCodeSaved(codeInput);
    },
  });

  const addMutation = useMutation({
    mutationFn: (data) => base44.entities.Employee.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      setForm({ employeeNumber: "", name: "" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }) => base44.entities.Employee.update(id, { isActive: !isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["employees"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Employee.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["employees"] }),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Employee.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      setEditingEmp(null);
    },
  });

  useEffect(() => {
    const session = JSON.parse(localStorage.getItem("employeeSession") || "null");
    if (!session?.isAdmin) {
      navigate("/");
    } else {
      setAuthorized(true);
    }
  }, [navigate]);

  if (!authorized) return null;

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.employeeNumber.trim() || !form.name.trim()) return;
    addMutation.mutate({ employeeNumber: form.employeeNumber.trim(), name: form.name.trim(), isActive: true });
  };

  const handleSaveCode = (e) => {
    e.preventDefault();
    const trimmed = codeInput.trim().toUpperCase();
    if (!trimmed || trimmed.length !== 3) return;
    updateCodeMutation.mutate(trimmed);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </button>

        <h1 className="text-2xl font-bold text-foreground mb-6">Employee Management</h1>

        {/* Access Requests Section */}
        {accessRequests.length > 0 && (
          <div className="bg-card border border-amber-200 rounded-xl p-5 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-semibold text-foreground">Access Requests ({accessRequests.length})</h2>
            </div>
            <ul className="divide-y divide-border">
              {accessRequests.map((req) => (
                <li key={req.id} className="flex items-center gap-3 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      <span className="text-muted-foreground">Employee</span> {req.employee_name || req.employee_number} <span className="text-muted-foreground">requested to edit</span> {req.part_number}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {req.requested_at ? format(new Date(req.requested_at), "MMM d, yyyy 'at' h:mm a") : ""}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => approveRequestMutation.mutate(req)} disabled={approveRequestMutation.isPending} className="gap-1.5 bg-green-600 hover:bg-green-700">
                    <Check className="w-3.5 h-3.5" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => ignoreRequestMutation.mutate(req.id)} disabled={ignoreRequestMutation.isPending} className="gap-1.5">
                    <X className="w-3.5 h-3.5" /> Ignore
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Login Code Section */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <KeyRound className="w-4 h-4" style={{ color: "#2b3990" }} />
            <h2 className="text-base font-semibold text-foreground" style={{ color: "#2b3990" }}>Login Code</h2>
          </div>
          <p className="text-sm mb-5" style={{ color: "#666666" }}>
            Employees append this 3-letter code to their employee number when logging in (e.g. 0001<span className="font-semibold" style={{ color: "#666666" }}>{codeSaved || "SUS"}</span>). Current code: <span className="font-semibold" style={{ color: "#666666" }}>{codeSaved || "SUS"}</span>
          </p>
          <form onSubmit={handleSaveCode} className="flex gap-3 items-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCodeInput("")}
              className="border-gray-300 text-gray-500 hover:bg-gray-50"
              style={{ borderColor: "#cccccc", color: "#666666" }}
            >
              NEW 3-LETTER CODE
            </Button>
            <Button
              type="submit"
              disabled={updateCodeMutation.isPending || codeInput.trim().length !== 3 || codeInput.trim().toUpperCase() === codeSaved}
              style={{ backgroundColor: "#8c92c5", borderColor: "#8c92c5", color: "#ffffff" }}
              className="hover:opacity-90"
            >
              Update Code
            </Button>
          </form>
        </div>

        {/* Add Employee Form */}
        <div className="bg-card border border-border rounded-2xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">Add New Employee</h2>
          <form onSubmit={handleAdd} className="flex gap-3 flex-wrap">
            <Input
              placeholder="Employee Number"
              value={form.employeeNumber}
              onChange={(e) => setForm({ ...form, employeeNumber: e.target.value })}
              className="flex-1 min-w-[140px]"
            />
            <Input
              placeholder="Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="flex-1 min-w-[140px]"
            />
            <Button type="submit" disabled={addMutation.isPending || !form.employeeNumber.trim() || !form.name.trim()} className="gap-1.5">
              <Plus className="w-4 h-4" /> Add Employee
            </Button>
          </form>
        </div>

        {/* Employee List */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Employees ({employees.length})</h2>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">Loading…</div>
          ) : employees.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">No employees yet.</div>
          ) : (
            <ul className="divide-y divide-border">
              {employees.map((emp) => (
                <li key={emp.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground">{emp.name}</p>
                    <p className="text-xs text-muted-foreground">{emp.employeeNumber}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${emp.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {emp.isActive ? "Active" : "Inactive"}
                  </span>
                  <button
                    onClick={() => setEditingEmp(emp)}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => toggleMutation.mutate({ id: emp.id, isActive: emp.isActive })}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                    title={emp.isActive ? "Deactivate" : "Activate"}
                  >
                    {emp.isActive ? <UserX className="w-4 h-4 text-amber-500" /> : <UserCheck className="w-4 h-4 text-green-500" />}
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(emp.id)}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <EditEmployeeDialog
        employee={editingEmp}
        open={!!editingEmp}
        onClose={() => setEditingEmp(null)}
        onSave={(data) => editMutation.mutate({ id: editingEmp.id, data })}
      />
    </div>
  );
}