import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, FileText, Copy, Edit3, X } from "lucide-react";
import { emptyGeneral, emptyPartZero, emptyTool, emptyOperation, emptyTurningChuck, emptyTurningTools, emptyTurningOperation } from "@/lib/setupSheetDefaults";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const session = JSON.parse(localStorage.getItem("employeeSession") || "null");
const employeeName = session?.name || session?.employeeNumber || "Unknown";

export default function DuplicatePartDialog({
  partNumber,
  customer,
  machineType,
  existingSheets,
  onClose,
  onCreated,
}) {
  const [view, setView] = useState("options"); // "options" | "replaceConfirm" | "addOperation"
  const [operationName, setOperationName] = useState("");
  const [saving, setSaving] = useState(false);

  const isTurning = machineType === "turning";

  const buildSheetData = (folderId, operationNumber, opName) => ({
    ...emptyGeneral,
    machine_type: machineType,
    part_number: partNumber,
    customer: customer?.trim() || "",
    folder_id: folderId,
    operation_number: operationNumber,
    operation_name: opName || undefined,
    tools: isTurning ? [] : [{ ...emptyTool }],
    turning_tools: isTurning ? { ...emptyTurningTools } : undefined,
    part_zero: { ...emptyPartZero },
    operations: isTurning ? [{ ...emptyTurningOperation }] : [{ ...emptyOperation }],
    turning_chuck: isTurning ? { ...emptyTurningChuck } : undefined,
  });

  // ── Option 1: Replace existing part file ──
  const handleReplace = async () => {
    setSaving(true);
    const folderId = `folder_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Create the new sheet first
    const newSheet = await base44.entities.SetupSheet.create(
      buildSheetData(folderId, 1, existingSheets[0]?.operation_name || undefined)
    );

    // Save each old sheet as a revision under the new sheet, then delete it
    for (const oldSheet of existingSheets) {
      await base44.entities.SheetRevision.create({
        sheet_id: newSheet.id,
        part_number: oldSheet.part_number,
        saved_by: employeeName,
        note: `Replaced by new sheet for "${partNumber}" — original machine: ${oldSheet.machine || "Unknown"}, Op ${oldSheet.operation_number || 1}`,
        snapshot: oldSheet,
      });
      await base44.entities.SetupSheet.delete(oldSheet.id);
    }

    setSaving(false);
    onCreated(newSheet);
  };

  // ── Option 2: Add as new operation ──
  const handleAddOperation = async () => {
    setSaving(true);
    const existingFolderId = existingSheets[0]?.folder_id;
    const maxOp = Math.max(0, ...existingSheets.map(s => s.operation_number || 0));

    const newSheet = await base44.entities.SetupSheet.create(
      buildSheetData(existingFolderId, maxOp + 1, operationName.trim() || undefined)
    );

    setSaving(false);
    onCreated(newSheet);
  };

  // ── Options view ──
  if (view === "options") {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-md">
          <div className="flex items-start gap-3 px-5 py-4 border-b border-border">
            <img
              src="https://media.base44.com/images/public/6a1e12b8c62750465a101e9a/5d0984da3_image.png"
              alt="Stop"
              className="w-16 h-auto object-contain shrink-0"
            />
            <div className="flex-1">
              <h2 className="font-semibold text-sm text-foreground">Duplicate Part Number</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                A part file already exists for <strong>{partNumber}</strong>.
              </p>
            </div>
            <Button size="icon" variant="ghost" onClick={onClose} className="h-7 w-7">
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="p-4 space-y-2">
            <button
              onClick={() => setView("replaceConfirm")}
              className="w-full flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/50 transition-colors text-left"
            >
              <FileText className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Replace existing part file</p>
                <p className="text-xs text-muted-foreground mt-0.5">Deletes the existing sheets and replaces them with this new one. Old data is saved to revision history.</p>
              </div>
            </button>

            <button
              onClick={() => setView("addOperation")}
              className="w-full flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/50 transition-colors text-left"
            >
              <Copy className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Add as new operation</p>
                <p className="text-xs text-muted-foreground mt-0.5">Adds this sheet as a new operation within the existing part file.</p>
              </div>
            </button>

            <button
              onClick={onClose}
              className="w-full flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/50 transition-colors text-left"
            >
              <Edit3 className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Change part name</p>
                <p className="text-xs text-muted-foreground mt-0.5">Go back and enter a different part number.</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Replace confirm view ──
  if (view === "replaceConfirm") {
    return (
      <AlertDialog open={true} onOpenChange={(open) => !open && setView("options")}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace existing part file?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{existingSheets.length}</strong> existing sheet{existingSheets.length !== 1 ? "s" : ""} for part <strong>{partNumber}</strong> and replace them with the new one. The old data will be saved as revisions in the new part's history tab.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReplace}
              disabled={saving}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              {saving ? "Replacing…" : "Yes, replace it"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // ── Add operation view ──
  if (view === "addOperation") {
    const maxOp = Math.max(0, ...existingSheets.map(s => s.operation_number || 0));
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-sm text-foreground">Add as Operation {maxOp + 1}</h2>
            <Button size="icon" variant="ghost" onClick={() => setView("options")} className="h-7 w-7">
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="px-5 py-4 space-y-4">
            <div>
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                Operation Title <span className="text-xs text-muted-foreground font-normal normal-case">(optional)</span>
              </Label>
              <Input
                autoFocus
                value={operationName}
                onChange={(e) => setOperationName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddOperation()}
                placeholder={`e.g. Op ${maxOp + 1} — Mill`}
                className="h-9 text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 px-5 py-3 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setView("options")} className="h-8 text-xs">Back</Button>
            <Button size="sm" onClick={handleAddOperation} disabled={saving} className="h-8 text-xs">
              {saving ? "Adding…" : `Add as Op ${maxOp + 1}`}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}