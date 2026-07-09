import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, ClipboardList, Trash2, GripVertical } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import AddCMMOperationDialog from "./AddCMMOperationDialog";

const getSortKey = (s) => s.sort_order ?? new Date(s.created_date).getTime() ?? 0;

export default function CMMFolderView({ folder, onBack, onSheetsChange }) {
  const navigate = useNavigate();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showAddOp, setShowAddOp] = useState(false);

  const sorted = [...(folder.sheets || [])].sort((a, b) => getSortKey(a) - getSortKey(b));

  const handleDragEnd = async (result) => {
    if (!result.destination || result.source.index === result.destination.index) return;
    const reordered = [...sorted];
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    const now = Date.now();
    const updates = reordered.map((s, i) => ({ ...s, sort_order: now + i }));
    onSheetsChange(updates);
    await base44.entities.CMMSheet.bulkUpdate(
      updates.map(s => ({ id: s.id, sort_order: s.sort_order }))
    );
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await base44.entities.CMMSheet.delete(deleteTarget.id);
    const updated = folder.sheets.filter(s => s.id !== deleteTarget.id);
    onSheetsChange(updated);
    setDeleteTarget(null);
  };

  const handleAddOperation = async (opName) => {
    const base = folder.sheets[0] || {};
    const folderId = base.folder_id || `cmm_folder_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const sheet = await base44.entities.CMMSheet.create({
      part_number: folder.partNumber,
      customer: folder.customer,
      folder_id: folderId,
      description: opName,
      sort_order: Date.now(),
      machine: base.machine,
      material: base.material,
      units: base.units || "in",
      program_number: base.program_number,
      program_location: base.program_location,
      cycle_time: base.cycle_time,
      fixturing: [],
      work_placement: [],
      work_holding: [{ _id: "first", note: "", photo_url: "" }],
      important_notes: [],
      program_notes: "",
    });
    navigate(`/cmm-sheet/${sheet.id}`);
  };

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{folder.partNumber}</h2>
          {folder.customer && <p className="text-sm text-muted-foreground mt-0.5">{folder.customer}</p>}
        </div>
        <Button onClick={() => setShowAddOp(true)} size="sm" className="gap-2">
          <Plus className="w-4 h-4" /> Add Operation
        </Button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="cmm-operations">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              {sorted.map((sheet, index) => (
                <Draggable key={sheet.id} draggableId={sheet.id} index={index}>
                  {(dragProvided, snapshot) => (
                    <div
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      className={cn(
                        "relative bg-card border border-border rounded-2xl p-4 cursor-pointer hover:shadow-md hover:border-emerald-400/40 transition-all group",
                        snapshot.isDragging && "shadow-lg border-emerald-400/60 ring-2 ring-emerald-400/20"
                      )}
                      onClick={() => navigate(`/cmm-sheet/${sheet.id}`)}
                    >
                      {sorted.length > 1 && (
                        <>
                          <div
                            {...dragProvided.dragHandleProps}
                            onClick={(e) => e.stopPropagation()}
                            className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground rounded-lg p-1 transition-all cursor-grab active:cursor-grabbing"
                            title="Drag to reorder"
                          >
                            <GripVertical className="w-3.5 h-3.5" />
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteTarget(sheet); }}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-destructive/10 hover:bg-destructive text-destructive hover:text-white rounded-lg p-1.5 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      <div className="flex items-start gap-3 mb-2">
                        <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                          <ClipboardList className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-foreground">{sheet.part_number}</p>
                          {sheet.description && <p className="text-xs text-muted-foreground mt-0.5 truncate italic">{sheet.description}</p>}
                        </div>
                      </div>
                      {sheet.updated_date && (
                        <p className="text-[11px] text-muted-foreground">{format(new Date(sheet.updated_date), "MMM d, yyyy")}</p>
                      )}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete CMM Sheet?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 text-white">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showAddOp && (
        <AddCMMOperationDialog onClose={() => setShowAddOp(false)} onAdd={handleAddOperation} />
      )}
    </div>
  );
}