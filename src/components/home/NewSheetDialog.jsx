import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Wrench, Settings } from "lucide-react";
import { emptyGeneral, emptyPartZero, emptyTool, emptyOperation, emptyTurningWorkHolding, emptyTurningAxialTool, emptyTurningRadialTool, emptyTurningOperation } from "@/lib/setupSheetDefaults";
import { cn } from "@/lib/utils";

export default function NewSheetDialog({ onClose, onCreate, existingCustomers = [] }) {
  const [partNumber, setPartNumber] = useState("");
  const [customerMode, setCustomerMode] = useState("select");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [newCustomer, setNewCustomer] = useState("");
  const [sheetType, setSheetType] = useState("milling"); // "milling" | "turning"
  const [saving, setSaving] = useState(false);

  const customerValue = customerMode === "new" ? newCustomer.trim() : selectedCustomer;

  const handleCreate = async () => {
    if (!partNumber.trim()) return;
    setSaving(true);

    if (customerMode === "new" && newCustomer.trim()) {
      const alreadyExists = existingCustomers.some(
        c => c.toLowerCase() === newCustomer.trim().toLowerCase()
      );
      if (!alreadyExists) {
        await base44.entities.Customer.create({ name: newCustomer.trim() });
      }
    }

    const baseData = {
      ...emptyGeneral,
      part_number: partNumber.trim(),
      customer: customerValue,
      sheet_type: sheetType,
    };

    let sheet;
    if (sheetType === "turning") {
      sheet = await base44.entities.SetupSheet.create({
        ...baseData,
        turning_work_holding: { ...emptyTurningWorkHolding },
        turning_axial_tools: [{ ...emptyTurningAxialTool }],
        turning_radial_tools: [{ ...emptyTurningRadialTool }],
        turning_operations: [{ ...emptyTurningOperation }],
        part_zero: { ...emptyPartZero },
        photos: {},
      });
    } else {
      sheet = await base44.entities.SetupSheet.create({
        ...baseData,
        tools: [{ ...emptyTool }],
        part_zero: { ...emptyPartZero },
        operations: [{ ...emptyOperation }],
        photos: {},
      });
    }

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

          {/* Sheet type selector */}
          <div>
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
              Sheet Type
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSheetType("milling")}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all text-sm font-medium",
                  sheetType === "milling"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                )}
              >
                <Settings className="w-5 h-5" />
                Milling
              </button>
              <button
                onClick={() => setSheetType("turning")}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all text-sm font-medium",
                  sheetType === "turning"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                )}
              >
                <Wrench className="w-5 h-5" />
                Turning
              </button>
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

            {existingCustomers.length > 0 && (
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => setCustomerMode("select")}
                  className={`text-xs px-3 py-1 rounded-md border transition-colors ${customerMode === "select" ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
                >
                  Existing
                </button>
                <button
                  onClick={() => setCustomerMode("new")}
                  className={`text-xs px-3 py-1 rounded-md border transition-colors ${customerMode === "new" ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
                >
                  New Customer
                </button>
              </div>
            )}

            {customerMode === "select" && existingCustomers.length > 0 ? (
              <select
                value={selectedCustomer}
                onChange={e => setSelectedCustomer(e.target.value)}
                className="w-full h-9 px-3 text-sm bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">— No Customer —</option>
                {existingCustomers.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            ) : (
              <Input
                value={newCustomer}
                onChange={e => setNewCustomer(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleCreate()}
                placeholder="e.g. Acme Corp"
                className="h-9 text-sm"
              />
            )}
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