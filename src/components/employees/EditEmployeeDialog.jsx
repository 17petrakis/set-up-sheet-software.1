import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Save } from "lucide-react";

export default function EditEmployeeDialog({ employee, open, onClose, onSave }) {
  const [name, setName] = useState("");
  const [employeeNumber, setEmployeeNumber] = useState("");

  useEffect(() => {
    if (employee) {
      setName(employee.name || "");
      setEmployeeNumber(employee.employeeNumber || "");
    }
  }, [employee]);

  if (!open || !employee) return null;

  const handleSave = (e) => {
    e.preventDefault();
    if (!name.trim() || !employeeNumber.trim()) return;
    onSave({ name: name.trim(), employeeNumber: employeeNumber.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-foreground">Edit Employee</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Employee Number</label>
            <Input
              value={employeeNumber}
              onChange={(e) => setEmployeeNumber(e.target.value)}
              placeholder="Employee Number"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Full Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full Name"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={!name.trim() || !employeeNumber.trim()} className="gap-1.5">
              <Save className="w-4 h-4" /> Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}