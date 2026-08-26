import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, ClipboardList, Trash2, GripVertical, Star } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem
} from "@/components/ui/context-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getCMMThumbnail } from "@/lib/photoSlots";
import AddCMMOperationDialog from "./AddCMMOperationDialog";

const getSortKey = (s) => s.sort_order ?? new Date(s.created_date).getTime() ?? 0;

export default function CMMFolderView({ folder, onBack, onSheetsChange }) {
  const navigate = useNavigate();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteFolderTarget, setDeleteFolderTarget] = useState(false);
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

  const handleDeleteFolder = async () => {
    await base44.entities.CMMSheet.deleteMany({ folder_id: folder.sheets[0]?.folder_id });
    onSheetsChange([]);
    setDeleteFolderTarget(false);
    onBack();
  };

  const handleMakeFolderThumbnail = async (sheetId) => {
    const updates = (folder.sheets || []).map(s => ({ id: s.id, is_folder_thumbnail: s.id === sheetId }));
    await base44.entities.CMMSheet.bulkUpdate(updates);
    onSheetsChange((folder.sheets || []).map(s => ({ ...s, is_folder_thumbnail: s.id === sheetId })));
  };

  const handleAddOperation = async (opName) => {
    const sortedSheets = [...(folder.sheets || [])].sort((a, b) => getSortKey(a) - getSortKey(b));
    const base = sortedSheets[sortedSheets.length - 1] || {};
    const folderId = base.folder_id || `cmm_folder_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const { id, created_date, updated_date, created_by_id, ...rest } = base;
    const sheet = await base44.entities.CMMSheet.create({
      ...rest,
      part_number: folder.partNumber,
      customer: folder.customer,
      folder_id: folderId,
      description: opName,
      sort_order: Date.now(),
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
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowAddOp(true)} size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> Add Operation
          </Button>
          <Button onClick={() => setDeleteFolderTarget(true)} size="sm" variant="outline" className="gap-2 text-destructive hover:text-destructive">
            <Trash2 className="w-4 h-4" /> Delete Part
          </Button>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="cmm-operations">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4"
            >
              {sorted.map((sheet, index) => (
                <Draggable key={sheet.id} draggableId={sheet.id} index={index}>
                  {(dragProvided, snapshot) => (
                    <ContextMenu>
                    <ContextMenuTrigger asChild>
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
                            className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground rounded-lg p-1 transition-all cursor-grab active:cursor-grabbing z-10"
                            title="Drag to reorder"
                          >
                            <GripVertical className="w-3.5 h-3.5" />
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteTarget(sheet); }}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-destructive/10 hover:bg-destructive text-destructive hover:text-white rounded-lg p-1.5 transition-all z-10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      <div className="relative w-full h-28 bg-muted/30 rounded-xl overflow-hidden mb-3 flex items-center justify-center">
                        {sheet.is_folder_thumbnail && (
                          <div className="absolute top-1.5 left-1.5 bg-amber-500 text-white rounded-full p-1 shadow-lg z-10" title="Folder thumbnail">
                            <Star className="w-3 h-3 fill-white" />
                          </div>
                        )}
                        {(() => { const icon = getCMMThumbnail(sheet); return icon ? (
                          <img src={icon} alt="Part" className="w-full h-full object-cover" />
                        ) : (
                          <ClipboardList className="w-8 h-8 text-emerald-600/40" />
                        ); })()}
                      </div>
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-foreground truncate">{sheet.description || "Operation"}</p>
                          <p className="text-xs text-muted-foreground">CMM</p>
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
                    </ContextMenuTrigger>
                    <ContextMenuContent className="w-48">
                      <ContextMenuItem onSelect={() => navigate(`/cmm-sheet/${sheet.id}`)} className="gap-2">
                        <ClipboardList className="w-4 h-4" /> Open
                      </ContextMenuItem>
                      <ContextMenuItem
                        onSelect={() => handleMakeFolderThumbnail(sheet.id)}
                        className="gap-2"
                      >
                        <Star className={`w-4 h-4 ${sheet.is_folder_thumbnail ? "fill-amber-500 text-amber-500" : ""}`} />
                        {sheet.is_folder_thumbnail ? "Folder Thumbnail" : "Make Folder Thumbnail"}
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
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

      <AlertDialog open={deleteFolderTarget} onOpenChange={(open) => !open && setDeleteFolderTarget(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Entire Part?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete <strong>{folder.partNumber}</strong> and all {folder.sheets.length} CMM sheet(s)? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFolder} className="bg-destructive hover:bg-destructive/90 text-white">Delete All</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showAddOp && (
        <AddCMMOperationDialog onClose={() => setShowAddOp(false)} onAdd={handleAddOperation} />
      )}
    </div>
  );
}