import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Plus, Trash2, GripVertical, Lock, Unlock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { emptyGeneral, emptyPartZero, emptyTool, emptyOperation, emptyTurningChuck, emptyTurningTools, emptyTurningOperation } from "@/lib/setupSheetDefaults";
import { getPartIconPhoto } from "@/lib/photoSlots";
import AddOperationDialog from "@/components/home/AddOperationDialog";

const getSortKey = (s) => s.sort_order ?? new Date(s.created_date).getTime() ?? 0;

export default function PartFolderView({ partNumber, customer, sheets, onBack, onSheetsChange }) {
  const navigate = useNavigate();
  const [showAddOp, setShowAddOp] = useState(false);
  const [showDeleteFolder, setShowDeleteFolder] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);

  const session = JSON.parse(localStorage.getItem("employeeSession") || "null");
  const isAdmin = session?.isAdmin === true;

  const sorted = [...sheets].sort((a, b) => getSortKey(a) - getSortKey(b));
  const folderId = sorted[0]?.folder_id;
  const isPublished = sorted.some(s => s.published);

  const handleAddOperation = async (machineType, opName) => {
    const isTurning = machineType === "turning";
    // Carry part-level info from the FIRST (original) operation, not the last
    const sourceSheet = sorted[0];

    // Operation-specific fields that should NOT be carried over
    const EXCLUDE_FIELDS = [
      "cycle_time", "cycle_time_hrs", "handling_time", "total_cycle_time",
      "total_additional_time", "deburring_time", "finishing_time", "wash_time",
      "has_deburring", "deburring_notes", "finishing_notes", "wash_notes",
      "operation_description", "operation_notes", "work_holding_notes",
      "fixturing_notes", "operation_name", "stops",
      "id", "created_date", "updated_date", "created_by_id",
      "operation_number", "folder_id", "sort_order",
    ];

    const carriedGeneral = sourceSheet
      ? Object.fromEntries(Object.entries(sourceSheet).filter(([k]) => !EXCLUDE_FIELDS.includes(k)))
      : {};

    // Carry over only the ISO view photo
    const CARRY_PHOTOS = ["iso"];
    const carriedPhotos = {};
    if (sourceSheet?.photos) {
      CARRY_PHOTOS.forEach(k => { if (sourceSheet.photos[k]) carriedPhotos[k] = sourceSheet.photos[k]; });
    }

    const sourceIsTurning = sourceSheet?.machine_type === "turning";
    // Copy tool list from the source operation when the machine type matches
    const carriedTools = (!isTurning && !sourceIsTurning && sourceSheet?.tools?.length)
      ? sourceSheet.tools.map(t => ({ ...t }))
      : (isTurning ? [] : [{ ...emptyTool }]);
    const carriedTurningTools = (isTurning && sourceIsTurning && sourceSheet?.turning_tools)
      ? JSON.parse(JSON.stringify(sourceSheet.turning_tools))
      : (isTurning ? { ...emptyTurningTools } : undefined);

    const createData = {
      ...emptyGeneral,
      ...carriedGeneral,
      machine_type: machineType,
      operation_name: opName,
      tools: carriedTools,
      turning_tools: carriedTurningTools,
      part_zero: { ...emptyPartZero },
      operations: isTurning ? [{ ...emptyTurningOperation }] : [{ ...emptyOperation }],
      photos: carriedPhotos,
      turning_chuck: isTurning ? { ...emptyTurningChuck } : undefined,
    };

    const newSheet = await base44.entities.SetupSheet.create({
      ...createData,
      part_number: partNumber,
      customer: customer,
      folder_id: folderId,
      sort_order: Date.now(),
    });
    onSheetsChange([...sheets, newSheet]);
    setShowAddOp(false);
    navigate(`/sheet/${newSheet.id}?mode=edit`);
  };

  const handleDragEnd = async (result) => {
    if (!result.destination || result.source.index === result.destination.index) return;
    const reordered = [...sorted];
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    // Reassign sort_order based on new positions, using timestamps to keep gaps
    const now = Date.now();
    const updates = reordered.map((s, i) => ({ ...s, sort_order: now + i }));
    onSheetsChange(updates);
    await base44.entities.SetupSheet.bulkUpdate(
      updates.map(s => ({ id: s.id, sort_order: s.sort_order }))
    );
  };

  const handleDeleteFolder = async () => {
    await Promise.all(sheets.map(s => base44.entities.SetupSheet.delete(s.id)));
    onSheetsChange([]);
    setShowDeleteFolder(false);
    onBack();
  };

  const handlePublish = async () => {
    const sheetIds = sheets.map(s => s.id);
    await base44.entities.SetupSheet.bulkUpdate(sheetIds.map(id => ({ id, published: true })));
    onSheetsChange(sheets.map(s => ({ ...s, published: true })));
    setShowPublishConfirm(false);
  };

  const handleUnlock = async () => {
    const sheetIds = sheets.map(s => s.id);
    await base44.entities.SetupSheet.bulkUpdate(sheetIds.map(id => ({ id, published: false })));
    onSheetsChange(sheets.map(s => ({ ...s, published: false })));
  };

  const opLabel = (sheet) => sheet.operation_name || "Operation";

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
          <h2 className="text-2xl font-bold text-foreground">
            {partNumber}
            {sorted[0]?.part_name && sorted[0].part_name.trim() && (
              <span className="text-muted-foreground"> — {sorted[0].part_name}</span>
            )}
          </h2>
          {customer && <p className="text-sm text-muted-foreground mt-0.5">{customer}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowAddOp(true)} className="gap-2" size="sm">
            <Plus className="w-4 h-4" /> Add Operation
          </Button>
          {!isPublished ? (
            <Button onClick={() => setShowPublishConfirm(true)} variant="outline" size="sm" className="gap-2">
              <Lock className="w-4 h-4" /> Publish (Lock)
            </Button>
          ) : isAdmin ? (
            <Button onClick={handleUnlock} variant="outline" size="sm" className="gap-2 text-amber-600 hover:text-amber-700">
              <Unlock className="w-4 h-4" /> Unlock
            </Button>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
              <Lock className="w-3.5 h-3.5" /> Published
            </span>
          )}
          <Button onClick={() => setShowDeleteFolder(true)} variant="outline" size="sm" className="gap-2 text-destructive hover:text-destructive">
            <Trash2 className="w-4 h-4" /> Delete Part
          </Button>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="operations">
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
                        "relative bg-card border border-border rounded-2xl p-4 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all group",
                        snapshot.isDragging && "shadow-lg border-primary/50 ring-2 ring-primary/20"
                      )}
                      onClick={() => navigate(`/sheet/${sheet.id}`)}
                    >
                      {sorted.length > 1 && (
                        <div
                          {...dragProvided.dragHandleProps}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground rounded-lg p-1 transition-all cursor-grab active:cursor-grabbing"
                          title="Drag to reorder"
                        >
                          <GripVertical className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div className="flex items-start gap-3 mb-3">
                        {(() => { const icon = getPartIconPhoto(sheet.photos); return icon ? (
                          <img src={icon} alt="Part" className="w-9 h-9 rounded-lg object-cover border border-border shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4 text-primary" />
                          </div>
                        ); })()}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-foreground truncate">{opLabel(sheet)}</p>
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
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {showAddOp && (
        <AddOperationDialog
          onClose={() => setShowAddOp(false)}
          onAdd={handleAddOperation}
        />
      )}

      <AlertDialog open={showDeleteFolder} onOpenChange={setShowDeleteFolder}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Part Folder?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{partNumber}</strong> and all its operations ({sheets.length})? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFolder} className="bg-destructive hover:bg-destructive/90 text-white">
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showPublishConfirm} onOpenChange={setShowPublishConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish (Lock) Part Folder?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to publish <strong>{partNumber}</strong>? This will lock the part file — non-admin users will need Admin permission to edit or delete any operation in this folder.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePublish} className="bg-amber-600 hover:bg-amber-700 text-white">
              <Lock className="w-4 h-4 mr-1" /> Publish & Lock
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}