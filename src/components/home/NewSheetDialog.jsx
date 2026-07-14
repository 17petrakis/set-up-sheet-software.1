import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { emptyGeneral, emptyPartZero, emptyTool, emptyOperation, emptyTurningChuck, emptyTurningTools, emptyTurningOperation } from "@/lib/setupSheetDefaults";
import ComboBox from "@/components/ui/ComboBox";

export default function NewSheetDialog({ onClose, onCreate, existingCustomers = [], defaultCustomer = "" }) {
  const [partNumber, setPartNumber] = useState("");
  const [machineType, setMachineType] = useState("milling");
  const [customer, setCustomer] = useState(defaultCustomer);
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!partNumber.trim()) return;
    setSaving(true);

    if (customer.trim()) {
      const alreadyExists = existingCustomers.some(
        c => c.toLowerCase() === customer.trim().toLowerCase()
      );
      if (!alreadyExists) {
        await base44.entities.Customer.create({ name: customer.trim() });
      }
    }

    // Generate a unique folder_id for this part
    const folderId = `folder_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const isTurning = machineType === "turning";

    const sheet = await base44.entities.SetupSheet.create({
      ...emptyGeneral,
      machine_type: machineType,
      part_number: partNumber.trim(),
      customer: customer.trim(),
      folder_id: folderId,
      operation_number: 1,
      tools: isTurning ? [] : [{ ...emptyTool }],
      turning_tools: isTurning ? { ...emptyTurningTools } : undefined,
      part_zero: { ...emptyPartZero },
      operations: isTurning ? [{ ...emptyTurningOperation }] : [{ ...emptyOperation }],
      turning_chuck: isTurning ? { ...emptyTurningChuck } : undefined,
    });
    setSaving(false);
    onCreate(sheet);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-sm text-foreground">New Setup Sheet</h2>
          <Button size="icon" variant="ghost" onClick={onClose} className="h-7 w-7">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="px-5 py-4 space-y-4">
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

          <div>
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Part Number <span className="text-destructive">*</span>
            </Label>
            <Input
              autoFocus
              value={partNumber}
              onChange={e => setPartNumber(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleCreate()}
              placeholder="e.g. 12345-A"
              className="h-9 text-sm"
            />
          </div>

          <div>
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Customer <span className="text-xs text-muted-foreground font-normal normal-case">(optional — used as folder)</span>
            </Label>

            <ComboBox
              value={customer}
              onChange={setCustomer}
              options={existingCustomers}
              placeholder="Select or type…"
              className="h-9 text-sm px-3 w-full"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-border">
          <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs">Cancel</Button>
          <Button size="sm" onClick={handleCreate} disabled={saving || !partNumber.trim()} className="h-8 text-xs">
            {saving ? "Creating…" : "Create Sheet"}
          </Button>
        </div>
      </div>
    </div>
  );
}