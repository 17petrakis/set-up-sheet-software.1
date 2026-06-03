import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

export default function AddCustomerDialog({ onClose, onAdded }) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await base44.entities.Customer.create({ name: name.trim() });
    setSaving(false);
    onAdded(name.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-sm text-foreground">Add New Customer</h2>
          <Button size="icon" variant="ghost" onClick={onClose} className="h-7 w-7">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="px-5 py-4">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Customer Name <span className="text-destructive">*</span>
          </Label>
          <Input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAdd()}
            placeholder="e.g. Acme Corp"
            className="h-9 text-sm"
          />
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-border">
          <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs">Cancel</Button>
          <Button size="sm" onClick={handleAdd} disabled={saving || !name.trim()} className="h-8 text-xs">
            {saving ? "Adding…" : "Add Customer"}
          </Button>
        </div>
      </div>
    </div>
  );
}