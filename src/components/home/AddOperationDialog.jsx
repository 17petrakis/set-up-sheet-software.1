import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

export default function AddOperationDialog({ onClose, onAdd, nextOpNumber }) {
  const [machineType, setMachineType] = useState("milling");
  const [opName, setOpName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    setSaving(true);
    await onAdd(machineType, opName.trim());
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-sm text-foreground">Add Operation {nextOpNumber}</h2>
          <Button size="icon" variant="ghost" onClick={onClose} className="h-7 w-7">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Operation Name
            </Label>
            <Input
              autoFocus
              value={opName}
              onChange={e => setOpName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleAdd(); }}
              placeholder="e.g. Op 10, Face & Drill…"
              className="h-9 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Machine Type
            </Label>
            <div className="flex gap-2">
              {["milling", "turning"].map((type) => (
                <button
                  key={type}
                  onClick={() => setMachineType(type)}
                  className={`flex-1 text-sm py-2 rounded-lg border font-medium transition-colors capitalize ${
                    machineType === type
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:text-foreground bg-background"
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-border">
          <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs">Cancel</Button>
          <Button size="sm" onClick={handleAdd} disabled={saving} className="h-8 text-xs">
            {saving ? "Creating…" : `Add Operation ${nextOpNumber}`}
          </Button>
        </div>
      </div>
    </div>
  );
}