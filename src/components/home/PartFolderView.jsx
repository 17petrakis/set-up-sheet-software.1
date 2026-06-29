import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { emptyGeneral, emptyPartZero, emptyTool, emptyOperation, emptyTurningChuck, emptyTurningTools, emptyTurningOperation } from "@/lib/setupSheetDefaults";
import AddOperationDialog from "@/components/home/AddOperationDialog";

export default function PartFolderView({ partNumber, customer, sheets, onBack, onSheetsChange }) {
  const navigate = useNavigate();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showAddOp, setShowAddOp] = useState(false);

  const sorted = [...sheets].sort((a, b) => {
    const ad = a.created_date ? new Date(a.created_date).getTime() : 0;
    const bd = b.created_date ? new Date(b.created_date).getTime() : 0;
    if (ad !== bd) return ad - bd;
    return (a.operation_number || 1) - (b.operation_number || 1);
  });
  const folderId = sorted[0]?.folder_id;
  const nextOpNumber = sorted.length > 0 ? Math.max(...sorted.map(s => s.operation_number || 1)) + 1 : 2;

  // Fields shared between milling and turning general info
  const SHARED_GENERAL_FIELDS = [
    "job_number", "programmer", "revision", "date", "quantity",
    "material", "units", "status", "program", "program_software",
    "program_location", "machine", "photos",
  ];
  // Fields to never copy
  const SYSTEM_FIELDS = ["id", "created_date", "updated_date", "created_by_id"];

  const handleAddOperation = async (machineType) => {
    const isTurning = machineType === "turning";
    const lastSheet = sorted[sorted.length - 1];
    const sameType = lastSheet && lastSheet.machine_type === machineType;

    let createData;

    if (lastSheet && sameType) {
      // Same type: copy everything except system fields and operation-specific text
      const copy = { ...lastSheet };
      SYSTEM_FIELDS.forEach(k => delete copy[k]);
      delete copy.operation_number;
      delete copy.folder_id;
      copy.operation_description = "";
      copy.operation_notes = "";
      copy.work_holding_notes = "";
      createData = copy;
    } else if (lastSheet && !sameType) {
      // Different type: only copy shared general info fields
      createData = {
        ...emptyGeneral,
        machine_type: machineType,
      };
      SHARED_GENERAL_FIELDS.forEach(k => {
        if (lastSheet[k] !== undefined && lastSheet[k] !== null && lastSheet[k] !== "") {
          createData[k] = lastSheet[k];
        }
      });
      // Set up defaults for the new type
      createData.tools = isTurning ? [] : [{ ...emptyTool }];
      createData.turning_tools = isTurning ? { ...emptyTurningTools } : undefined;
      createData.part_zero = { ...emptyPartZero };
      createData.operations = isTurning ? [{ ...emptyTurningOperation }] : [{ ...emptyOperation }];
      createData.turning_chuck = isTurning ? { ...emptyTurningChuck } : undefined;
    } else {
      // No previous sheet at all
      createData = {
        ...emptyGeneral,
        machine_type: machineType,
        tools: isTurning ? [] : [{ ...emptyTool }],
        turning_tools: isTurning ? { ...emptyTurningTools } : undefined,
        part_zero: { ...emptyPartZero },
        operations: isTurning ? [{ ...emptyTurningOperation }] : [{ ...emptyOperation }],
        turning_chuck: isTurning ? { ...emptyTurningChuck } : undefined,
      };
    }

    const newSheet = await base44.entities.SetupSheet.create({
      ...createData,
      part_number: partNumber,
      customer: customer,
      folder_id: folderId,
      operation_number: nextOpNumber,
    });
    onSheetsChange([...sheets, newSheet]);
    setShowAddOp(false);
    navigate(`/sheet/${newSheet.id}`);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await base44.entities.SetupSheet.delete(deleteTarget.id);
    onSheetsChange(sheets.filter(s => s.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{partNumber}</h2>
          {customer && <p className="text-sm text-muted-foreground mt-0.5">{customer}</p>}
        </div>
        <Button onClick={() => setShowAddOp(true)} className="gap-2" size="sm">
          <Plus className="w-4 h-4" /> Add Operation
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sorted.map(sheet => (
          <div
            key={sheet.id}
            className="relative bg-card border border-border rounded-2xl p-4 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all group"
            onClick={() => navigate(`/sheet/${sheet.id}`)}
          >
            {sorted.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); setDeleteTarget(sheet); }}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-destructive/10 hover:bg-destructive text-destructive hover:text-white rounded-lg p-1.5 transition-all"
                title="Delete operation"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <div className="flex items-start gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-foreground">Operation {sheet.operation_number || 1}</p>
                <p className="text-xs text-muted-foreground capitalize">{sheet.machine_type || "milling"}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
              {sheet.machine && (
                <div>
                  <p className="text-muted-foreground font-medium uppercase tracking-wider text-[9px]">Machine</p>
                  <p className="text-foreground font-medium truncate">{sheet.machine}</p>
                </div>
              )}
              {sheet.updated_date && (
                <div>
                  <p className="text-muted-foreground font-medium uppercase tracking-wider text-[9px]">Updated</p>
                  <p className="text-foreground font-medium">{format(new Date(sheet.updated_date), "MMM d")}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showAddOp && (
        <AddOperationDialog
          onClose={() => setShowAddOp(false)}
          onAdd={handleAddOperation}
          nextOpNumber={nextOpNumber}
        />
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Operation {deleteTarget?.operation_number}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>Operation {deleteTarget?.operation_number}</strong>? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}