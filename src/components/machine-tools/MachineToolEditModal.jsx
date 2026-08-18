import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { TOOL_TYPE_OPTIONS, getAllFields, getEffectiveVisibleFields, makeCustomFieldKey } from "@/lib/toolTypeOptions";
import TreeCascadingDropdown from "@/components/ui/TreeCascadingDropdown";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function MachineToolEditModal({ tool, onChange, onClose, allSlots = [], currentIndex = -1, onSwap, slotCount }) {
  const visible = getEffectiveVisibleFields(tool);
  const [toolNumberInput, setToolNumberInput] = useState(tool.tool_number || "");
  const [confirmOverwrite, setConfirmOverwrite] = useState(null); // { newNumber, targetIndex }
  const [numberError, setNumberError] = useState("");
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const nameInputRef = useRef(null);

  const isEmpty = !Object.entries(tool).some(
    ([k, v]) => k !== "tool_number" && k !== "locked" && k !== "visible_fields" && v && String(v).trim()
  );

  // For empty tools: show only Comment and auto-focus it
  useEffect(() => {
    if (isEmpty) {
      onChange({ ...tool, visible_fields: { tool_type: false, diameter: false, holder: false, name: true } });
      setTimeout(() => nameInputRef.current?.focus(), 50);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleField = (key) => {
    const overrides = tool.visible_fields || {};
    onChange({ ...tool, visible_fields: { ...overrides, [key]: !visible[key] } });
  };

  const setField = (key, val) => onChange({ ...tool, [key]: val });

  const isSlotFull = (t) =>
    Object.entries(t).some(([k, v]) => k !== "tool_number" && k !== "locked" && k !== "visible_fields" && v && String(v).trim());

  const handleSubmit = () => {
    const newNumber = toolNumberInput.trim();
    setNumberError("");
    if (newNumber && newNumber !== (tool.tool_number || "")) {
      const num = parseInt(newNumber, 10);
      if (slotCount && !isNaN(num) && (num < 0 || num > slotCount)) {
        setNumberError(`Tool number out of bounds (0–${slotCount})`);
        return;
      }
      const targetIndex = allSlots.findIndex((s, idx) => idx !== currentIndex && s.tool_number === newNumber);
      if (targetIndex >= 0) {
        const targetTool = allSlots[targetIndex];
        if (isSlotFull(targetTool)) {
          setConfirmOverwrite({ newNumber, targetIndex });
          return;
        }
        if (onSwap) onSwap(currentIndex, targetIndex);
      } else {
        onChange({ ...tool, tool_number: newNumber });
      }
    }
    onClose();
  };

  // Tool type first, then name, then the rest
  const orderedFields = [
    ...getAllFields(tool).filter(f => f.key === "tool_type"),
    ...getAllFields(tool).filter(f => f.key === "name"),
    ...getAllFields(tool).filter(f => f.key !== "tool_type" && f.key !== "name"),
  ];
  const customKeys = new Set(orderedFields.filter(f => f.key.startsWith("custom_")).map(f => f.key));

  const addCustomField = () => {
    const label = newFieldLabel.trim();
    if (!label) return;
    const key = makeCustomFieldKey(label);
    if (tool[key] !== undefined) { setNewFieldLabel(""); return; }
    const overrides = tool.visible_fields || {};
    onChange({ ...tool, [key]: "", visible_fields: { ...overrides, [key]: true } });
    setNewFieldLabel("");
  };

  const removeCustomField = (key) => {
    const next = { ...tool };
    delete next[key];
    if (next.visible_fields) {
      const vf = { ...next.visible_fields };
      delete vf[key];
      next.visible_fields = vf;
    }
    onChange(next);
  };

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Tool {tool.tool_number || ""}</DialogTitle>
        </DialogHeader>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          {/* Tool Number (editable) */}
          <div className="mb-4">
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">Tool #</label>
            <Input
              value={toolNumberInput}
              onChange={(e) => { setToolNumberInput(e.target.value); setNumberError(""); }}
              className="h-8 text-xs font-mono w-24"
              placeholder="e.g. 10"
            />
            {numberError && (
              <div className="flex items-center gap-3 mt-2 p-2 bg-destructive/10 border border-destructive/30 rounded-md">
                <img
                  src="https://media.base44.com/images/public/6a1e12b8c62750465a101e9a/3af3de635_image.png"
                  alt="Stop"
                  className="h-16 w-16 object-contain shrink-0"
                />
                <div>
                  <p className="text-sm font-bold text-destructive">Hold it! Tool number out of bounds.</p>
                  <p className="text-xs text-destructive/80 mt-0.5">{numberError}</p>
                </div>
              </div>
            )}
          </div>

          {/* All toggleable fields — tool type first, then name, then rest */}
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">All Fields — toggle to show/hide in row</p>
            {orderedFields.map(f => (
              <div key={f.key} className="flex items-center gap-2 py-1 border-b border-border/30">
                <Checkbox
                  checked={!!visible[f.key]}
                  onCheckedChange={() => toggleField(f.key)}
                />
                <span className="text-xs font-medium w-32 shrink-0">{f.label}</span>
                {f.key === "tool_type" ? (
                  <TreeCascadingDropdown
                    value={tool.tool_type || ""}
                    onChange={(v) => onChange({ ...tool, tool_type: v, visible_fields: null })}
                    options={TOOL_TYPE_OPTIONS}
                    placeholder="Select…"
                    className="h-8 text-xs flex-1"
                    allowCustom
                  />
                ) : (
                  <Input
                    ref={f.key === "name" ? nameInputRef : undefined}
                    value={tool[f.key] || ""}
                    onChange={(e) => setField(f.key, e.target.value)}
                    className="h-8 text-xs flex-1"
                  />
                )}
                {customKeys.has(f.key) && (
                  <Button size="icon" variant="ghost" onClick={() => removeCustomField(f.key)} className="h-7 w-7 text-destructive hover:text-destructive shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Add custom field */}
          <div className="flex items-center gap-2 pt-1">
            <Input
              value={newFieldLabel}
              onChange={(e) => setNewFieldLabel(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomField(); } }}
              placeholder="Custom field name…"
              className="h-8 text-xs flex-1"
            />
            <Button size="sm" variant="outline" onClick={addCustomField} className="gap-1.5 shrink-0">
              <Plus className="w-3.5 h-3.5" /> Add Field
            </Button>
          </div>

          <div className="flex justify-end pt-4">
            <button type="submit" className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors">
              Done
            </button>
          </div>
        </form>

        {/* Overwrite confirmation */}
        <AlertDialog open={confirmOverwrite !== null} onOpenChange={(open) => {
          if (!open) {
            setConfirmOverwrite(null);
            setToolNumberInput(tool.tool_number || "");
          }
        }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Overwrite slot T{confirmOverwrite?.newNumber}?</AlertDialogTitle>
              <AlertDialogDescription>
                Slot T{confirmOverwrite?.newNumber} already has a tool. The two tools will be swapped. Do you want to continue?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (onSwap && confirmOverwrite) onSwap(currentIndex, confirmOverwrite.targetIndex);
                  setConfirmOverwrite(null);
                  onClose();
                }}
              >
                Yes, swap
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}