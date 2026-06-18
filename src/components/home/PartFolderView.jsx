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

const statusColors = {
  Active: "bg-green-100 text-green-700",
  Repeating: "bg-blue-100 text-blue-700",
  "One Time": "bg-amber-100 text-amber-700",
  Completed: "bg-gray-100 text-gray-700",
  "On Hold": "bg-red-100 text-red-700"
};

export default function PartFolderView({ partNumber, customer, sheets, onBack, onSheetsChange }) {
  const navigate = useNavigate();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showAddOp, setShowAddOp] = useState(false);

  const sorted = [...sheets].sort((a, b) => (a.operation_number || 1) - (b.operation_number || 1));
  const folderId = sorted[0]?.folder_id;
  const nextOpNumber = sorted.length > 0 ? Math.max(...sorted.map(s => s.operation_number || 1)) + 1 : 2;

  const handleAddOperation = async (machineType) => {
    const isTurning = machineType === "turning";
    // Find the last operation to copy data from
    const lastSheet = sorted[sorted.length - 1];
    // Fields we don't want to carry over
    const { id, created_date, updated_date, created_by_id, operation_number, folder_id: _fid, ...prevData } = lastSheet || {};
    const baseData = lastSheet ? prevData : emptyGeneral;

    const newSheet = await base44.entities.SetupSheet.create({
      ...baseData,
      machine_type: machineType,
      part_number: partNumber,
      customer: customer,
      folder_id: folderId,
      operation_number: nextOpNumber,
      // Reset operation-specific fields
      operation_description: "",
      operation_notes: "",
      tools: isTurning ? [] : [{ ...emptyTool }],
      turning_tools: isTurning ? { ...emptyTurningTools } : undefined,
      operations: isTurning ? [{ ...emptyTurningOperation }] : [{ ...emptyOperation }],
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

            {sheet.status && (
              <div className="mb-3">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wide ${statusColors[sheet.status] || statusColors.Active}`}>
                  {sheet.status}
                </span>
              </div>
            )}

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