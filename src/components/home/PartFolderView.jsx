import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Plus, Trash2, GripVertical, Lock, Unlock, Menu } from "lucide-react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
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
import { verifyAdminPassword } from "@/lib/adminPassword";
import AddOperationDialog from "@/components/home/AddOperationDialog";

const getSortKey = (s) => s.sort_order ?? new Date(s.created_date).getTime() ?? 0;

export default function PartFolderView({ partNumber, customer, sheets, onBack, onSheetsChange }) {
  const navigate = useNavigate();
  const [showAddOp, setShowAddOp] = useState(false);
  const [showDeleteFolder, setShowDeleteFolder] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [showAccessDialog, setShowAccessDialog] = useState(false);
  const [accessRequestSent, setAccessRequestSent] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminPasswordError, setAdminPasswordError] = useState("");
  const [adminPasswordLoading, setAdminPasswordLoading] = useState(false);
  const [deleteSheetId, setDeleteSheetId] = useState(null);
  const [showDeleteSheetConfirm, setShowDeleteSheetConfirm] = useState(false);

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

  const handleAttemptDeleteFolder = () => {
    if (isPublished && !isAdmin) {
      setShowAccessDialog(true);
    } else {
      setShowDeleteFolder(true);
    }
  };

  const handleRequestAccess = async () => {
    await base44.entities.AccessRequest.create({
      employee_number: session?.employeeNumber || "",
      employee_name: session?.name || "",
      part_number: partNumber,
      folder_id: folderId,
      sheet_id: sorted[0]?.id,
      status: "pending",
      requested_at: new Date().toISOString(),
    });
    setAccessRequestSent(true);
  };

  const handleAdminUnlock = async () => {
    setAdminPasswordError("");
    setAdminPasswordLoading(true);
    try {
      const ok = await verifyAdminPassword(adminPassword);
      if (!ok) {
        setAdminPasswordError("Incorrect admin password.");
        return;
      }
      // Only unlock the specific sheet being accessed
      if (deleteSheetId) {
        await base44.entities.SetupSheet.update(deleteSheetId, { published: false });
        onSheetsChange(sheets.map(s => s.id === deleteSheetId ? { ...s, published: false } : s));
      } else {
        // Folder-level unlock (e.g. from "Unlock" button or delete-folder)
        const sheetIds = sheets.map(s => s.id);
        await base44.entities.SetupSheet.bulkUpdate(sheetIds.map(sid => ({ id: sid, published: false })));
        onSheetsChange(sheets.map(s => ({ ...s, published: false })));
      }
      setShowAccessDialog(false);
      setShowAdminPassword(false);
      setAdminPassword("");
      setDeleteSheetId(null);
    } finally {
      setAdminPasswordLoading(false);
    }
  };

  const handleAttemptDeleteSheet = (sheetId) => {
    const sheet = sheets.find(s => s.id === sheetId);
    if (sheet?.published && !isAdmin) {
      setDeleteSheetId(sheetId);
      setShowAccessDialog(true);
    } else {
      setDeleteSheetId(sheetId);
      setShowDeleteSheetConfirm(true);
    }
  };

  const handleDeleteSheet = async () => {
    if (!deleteSheetId) return;
    await base44.entities.SetupSheet.delete(deleteSheetId);
    onSheetsChange(sheets.filter(s => s.id !== deleteSheetId));
    setShowDeleteSheetConfirm(false);
    setDeleteSheetId(null);
  };

  const opLabel = (sheet) => sheet.operation_name || "Operation";

  return (
    <div>
      {/* Mobile: back + hamburger menu inline */}
      <div className="lg:hidden flex items-center justify-between mb-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Menu className="w-4 h-4" /> Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setShowAddOp(true)} className="gap-2">
              <Plus className="w-4 h-4" /> Add Operation
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {!isPublished ? (
              <DropdownMenuItem onClick={() => setShowPublishConfirm(true)} className="gap-2">
                <Lock className="w-4 h-4" /> Publish (Lock)
              </DropdownMenuItem>
            ) : isAdmin ? (
              <DropdownMenuItem onClick={handleUnlock} className="gap-2 text-amber-600 focus:text-amber-700">
                <Unlock className="w-4 h-4" /> Unlock
              </DropdownMenuItem>
            ) : (
              <div className="px-2 py-1.5 text-xs font-semibold text-amber-700 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> Published
              </div>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleAttemptDeleteFolder} className="gap-2 text-destructive focus:text-destructive">
              <Trash2 className="w-4 h-4" /> Delete Part
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {/* Mobile: title row */}
      <div className="lg:hidden mb-5">
        <h2 className="text-xl font-bold text-foreground">
          {partNumber}
          {sorted[0]?.part_name && sorted[0].part_name.trim() && (
            <span className="text-muted-foreground"> — {sorted[0].part_name}</span>
          )}
        </h2>
        {customer && <p className="text-sm text-muted-foreground mt-0.5">{customer}</p>}
      </div>

      {/* Desktop: back button */}
      <button
        onClick={onBack}
        className="hidden lg:flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>

      {/* Desktop: title + actions */}
      <div className="hidden lg:flex items-start justify-between mb-6">
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
          <Button onClick={handleAttemptDeleteFolder} variant="outline" size="sm" className="gap-2 text-destructive hover:text-destructive">
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
              className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4"
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
                        <button
                          onClick={(e) => { e.stopPropagation(); handleAttemptDeleteSheet(sheet.id); }}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive rounded-lg p-1 transition-all"
                          title="Delete operation"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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

      <AlertDialog open={showAccessDialog} onOpenChange={(open) => { setShowAccessDialog(open); if (!open) { setAccessRequestSent(false); setShowAdminPassword(false); setAdminPassword(""); setAdminPasswordError(""); setDeleteSheetId(null); } }}>
        <AlertDialogContent className="max-w-md text-center">
          {accessRequestSent ? (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-center">Request Sent</AlertDialogTitle>
                <AlertDialogDescription className="text-center">
                  Your request has been sent to Gabe. You'll be able to edit once it's approved.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <div className="flex justify-center w-full">
                  <AlertDialogAction onClick={() => { setShowAccessDialog(false); setAccessRequestSent(false); }}>OK</AlertDialogAction>
                </div>
              </AlertDialogFooter>
            </>
          ) : (
            <>
              <AlertDialogHeader>
                <div className="flex justify-center mt-1 mb-4">
                  <img
                    src="https://media.base44.com/images/public/6a1e12b8c62750465a101e9a/0681e6a29_Screenshot2026-08-06101712.png"
                    alt="Stop sign"
                    className="max-h-56 rounded-lg"
                  />
                </div>
                <AlertDialogDescription className="text-center text-base text-foreground">
                  You need Gabe's permission to edit or delete this Setup Sheet.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                {showAdminPassword ? (
                  <div className="space-y-3 w-full">
                    <input
                      type="password"
                      value={adminPassword}
                      onChange={(e) => { setAdminPassword(e.target.value); setAdminPasswordError(""); }}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAdminUnlock(); } }}
                      placeholder="Admin password"
                      autoFocus
                      className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm font-medium shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                    />
                    {adminPasswordError && (
                      <p className="text-sm text-destructive">{adminPasswordError}</p>
                    )}
                    <div className="flex flex-col-reverse sm:flex-row sm:justify-center sm:space-x-2 w-full">
                      <AlertDialogCancel onClick={() => { setShowAdminPassword(false); setAdminPassword(""); setAdminPasswordError(""); }}>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={(e) => { e.preventDefault(); handleAdminUnlock(); }} disabled={adminPasswordLoading || !adminPassword.trim()} className="bg-primary hover:bg-primary/90 text-white">
                        {adminPasswordLoading ? "Checking..." : "Unlock"}
                      </AlertDialogAction>
                    </div>
                  </div>
                ) : (
                  <div className="w-full">
                    <div className="flex flex-col-reverse sm:flex-row sm:justify-center sm:space-x-2 w-full">
                      <AlertDialogCancel>Nevermind</AlertDialogCancel>
                      <AlertDialogAction onClick={handleRequestAccess} className="bg-primary hover:bg-primary/90 text-white">
                        Ask Gabe
                      </AlertDialogAction>
                    </div>
                    <button
                      onClick={() => setShowAdminPassword(true)}
                      className="w-full -mx-6 px-6 py-2.5 mt-3 border-t border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                    >
                      Enter Admin Password
                    </button>
                  </div>
                )}
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteSheetConfirm} onOpenChange={setShowDeleteSheetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Operation?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this operation? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSheet} className="bg-destructive hover:bg-destructive/90 text-white">
              Delete
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