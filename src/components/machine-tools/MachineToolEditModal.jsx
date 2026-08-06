import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { TOOL_FIELDS, TOOL_TYPE_OPTIONS, getEffectiveVisibleFields } from "@/lib/toolTypeOptions";
import TreeCascadingDropdown from "@/components/ui/TreeCascadingDropdown";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function MachineToolEditModal({ tool, onChange, onClose, allSlots = [], currentIndex = -1, onSwap }) {
  const visible = getEffectiveVisibleFields(tool);
  const [toolNumberInput, setToolNumberInput] = useState(tool.tool_number || "");
  const [confirmOverwrite, setConfirmOverwrite] = useState(null); // { newNumber, targetIndex }
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
    if (newNumber && newNumber !== (tool.tool_number || "")) {
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
    ...TOOL_FIELDS.filter(f => f.key === "tool_type"),
    ...TOOL_FIELDS.filter(f => f.key === "name"),
    ...TOOL_FIELDS.filter(f => f.key !== "tool_type" && f.key !== "name"),
  ];

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
              onChange={(e) => setToolNumberInput(e.target.value)}
              className="h-8 text-xs font-mono w-24"
              placeholder="e.g. 10"
            />
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
              </div>
            ))}
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