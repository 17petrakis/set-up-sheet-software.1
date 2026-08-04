import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ViewModeContext } from "@/lib/viewModeContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SectionHeader from "./SectionHeader";
import { Wrench, Plus, Trash2, Pencil, GripVertical, Copy, RefreshCw, Lock, Unlock, Filter, FilterX } from "lucide-react";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { emptyTool } from "@/lib/setupSheetDefaults";
import { TOOL_TYPE_OPTIONS, TOOL_FIELDS, TOOL_FIELD_SHORT, getEffectiveVisibleFields, getFieldOptions } from "@/lib/toolTypeOptions";
import TreeCascadingDropdown from "@/components/ui/TreeCascadingDropdown";
import ComboBox from "@/components/ui/ComboBox";
import ToolEditModal from "./ToolEditModal";
import { useToast } from "@/components/ui/use-toast";
import {
  ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem,
} from "@/components/ui/context-menu";

export default function ToolList({ tools, onChange, machine, slotCount }) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const viewMode = useContext(ViewModeContext);
  const [editingIndex, setEditingIndex] = useState(null);

  const sortByTNumber = (arr) =>
    [...arr].sort((a, b) => {
      const aVal = (a.tool_number || "").toString().trim().toUpperCase();
      const bVal = (b.tool_number || "").toString().trim().toUpperCase();
      // "N/A" tools are accepted as-is — keep their relative position
      if (aVal === "N/A" || bVal === "N/A") return 0;
      const aNum = parseInt(a.tool_number, 10);
      const bNum = parseInt(b.tool_number, 10);
      if (isNaN(aNum) && isNaN(bNum)) return 0;
      if (isNaN(aNum)) return 1;
      if (isNaN(bNum)) return -1;
      return aNum - bNum;
    });

  const isFixedSlots = slotCount != null;
  const [unlockConfirmIndex, setUnlockConfirmIndex] = useState(null);
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState(null);
  const [showOnlyFilled, setShowOnlyFilled] = useState(false);

  const isToolEmpty = (tool) => {
    const { tool_number, locked, visible_fields, ...rest } = tool || {};
    return !Object.values(rest).some(v => v !== "" && v !== null && v !== undefined);
  };

  const addRow = () => onChange([...tools, { ...emptyTool }]);
  const toggleLock = (i) => {
    const updated = [...tools];
    updated[i] = { ...updated[i], locked: !updated[i].locked };
    onChange(updated);
  };
  const removeRow = (i) => {
    if (isFixedSlots) {
      const updated = [...tools];
      updated[i] = { ...emptyTool, tool_number: String(i + 1) };
      onChange(updated);
    } else {
      onChange(tools.filter((_, idx) => idx !== i));
    }
  };
  const handleRemoveClick = (i) => {
    if (tools[i]?.locked) {
      setUnlockConfirmIndex(i);
    } else {
      setDeleteConfirmIndex(i);
    }
  };
  const confirmUnlockAndRemove = () => {
    if (unlockConfirmIndex !== null) {
      removeRow(unlockConfirmIndex);
      setUnlockConfirmIndex(null);
    }
  };
  const confirmDelete = () => {
    if (deleteConfirmIndex !== null) {
      removeRow(deleteConfirmIndex);
      setDeleteConfirmIndex(null);
    }
  };
  const duplicateRow = (i) => {
    const copy = { ...tools[i], tool_number: "" };
    const updated = [...tools];
    updated.splice(i + 1, 0, copy);
    onChange(updated);
  };
  const updateCell = (i, key, val) => {
    const updated = [...tools];
    updated[i] = { ...updated[i], [key]: val };
    if (isFixedSlots && key === "tool_number") return;
    onChange(key === "tool_number" ? sortByTNumber(updated) : updated);
  };
  const updateTool = (i, updated) => {
    const newTools = [...tools];
    newTools[i] = updated;
    onChange(newTools);
  };

  const handleTypeChange = (i, newType) => {
    const updated = [...tools];
    updated[i] = { ...updated[i], tool_type: newType, visible_fields: null };
    onChange(updated);
  };

  const onDragEnd = (result) => {
    if (isFixedSlots || !result.destination) return;
    const reordered = [...tools];
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    onChange(reordered);
  };

  const handleGoToMachineList = () => {
    if (!machine) {
      toast({ title: "No machine selected", description: "Please select a machine first.", variant: "destructive" });
      return;
    }
    navigate(`/machine-tool-lists/${encodeURIComponent(machine)}`);
  };

  if (viewMode && !tools.some(t => Object.values(t).some(v => v && String(v).trim()))) return null;

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="pt-5 pb-5">
        <SectionHeader icon={Wrench} title="Tool List">
          {tools.length > 0 && (
            <div className="flex items-center gap-2">
              <Button size="sm" variant={showOnlyFilled ? "default" : "outline"} onClick={() => setShowOnlyFilled(!showOnlyFilled)} className="h-7 text-xs gap-1.5">
                {showOnlyFilled ? <Filter className="w-3 h-3" /> : <FilterX className="w-3 h-3" />}
                {showOnlyFilled ? "Showing Filled" : "Show Filled Only"}
              </Button>
              <Button size="sm" variant="outline" onClick={handleGoToMachineList} className="h-7 text-xs gap-1.5">
                <RefreshCw className="w-3 h-3" /> Machine Tool List
              </Button>
              {!isFixedSlots && (
                <Button size="sm" variant="outline" onClick={addRow} className="h-7 text-xs gap-1.5">
                  <Plus className="w-3 h-3" /> Add Tool
                </Button>
              )}
            </div>
          )}
        </SectionHeader>

        {tools.length === 0 ? (
          <button onClick={addRow} className="w-full flex flex-col items-center justify-center py-12 text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-lg border-2 border-dashed border-border/50 transition-colors group">
            <Plus className="w-6 h-6 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium">Click to add a tool</span>
          </button>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="tool-list">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-1">
                  {tools.map((tool, i) => ({ tool, i }))
                    .filter(({ tool }) => !showOnlyFilled || !isToolEmpty(tool))
                    .map(({ tool, i: origIndex }, displayIndex) => {
                    const visible = getEffectiveVisibleFields(tool);
                    return (
                      <Draggable key={origIndex} draggableId={`tool-${origIndex}`} index={showOnlyFilled ? displayIndex : origIndex}>
                        {(prov) => (
                          <ContextMenu>
                          <ContextMenuTrigger asChild>
                          <div
                            ref={prov.innerRef}
                            {...prov.draggableProps}
                            className="group flex items-end gap-2 px-2 py-2 rounded-lg hover:bg-muted/20 border-b border-border/30 last:border-b-0 transition-colors flex-wrap"
                          >
                            {!isFixedSlots && (
                              <div {...prov.dragHandleProps} className="flex items-end pb-1.5 cursor-grab active:cursor-grabbing">
                                <GripVertical className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground/70" />
                              </div>
                            )}

                            {/* T# */}
                            <div className="shrink-0 w-14">
                              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-0.5">T#</span>
                              {isFixedSlots ? (
                                <div className="h-8 flex items-center justify-center text-xs font-mono text-muted-foreground">
                                  {origIndex + 1}
                                </div>
                              ) : (
                                <Input
                                  value={tool.tool_number || ""}
                                  onChange={(e) => updateCell(origIndex, "tool_number", e.target.value)}
                                  className="h-8 text-xs border-transparent bg-transparent hover:border-border/60 focus:border-primary/40 focus:bg-background transition-all text-center font-mono"
                                />
                              )}
                            </div>

                            {isToolEmpty(tool) ? (
                              <div className="flex-1 flex items-center gap-2 min-w-0">
                                <span className="text-xs text-muted-foreground italic">Empty</span>
                                <Button size="sm" variant="ghost" onClick={() => setEditingIndex(origIndex)} className="h-7 gap-1 text-xs">
                                  <Plus className="w-3 h-3" /> Add Info
                                </Button>
                              </div>
                            ) : (
                              <>
                                {/* Comment */}
                                <div className="shrink-0 min-w-[120px]" style={{ width: `${Math.max(12, (tool.name || '').length + 2)}ch`, maxWidth: '400px' }}>
                                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-0.5">Comment</span>
                                  <Input
                                    value={tool.name || ""}
                                    onChange={(e) => updateCell(origIndex, "name", e.target.value)}
                                    className="h-8 text-xs border-transparent bg-transparent hover:border-border/60 focus:border-primary/40 focus:bg-background transition-all"
                                  />
                                </div>

                                {/* Tool Type */}
                                <div className="shrink-0 w-40">
                                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-0.5">Tool Type</span>
                                  <TreeCascadingDropdown
                                    value={tool.tool_type || ""}
                                    onChange={(v) => handleTypeChange(origIndex, v)}
                                    options={TOOL_TYPE_OPTIONS}
                                    placeholder="Select…"
                                    className="w-full"
                                    allowCustom
                                  />
                                </div>

                                {/* Dynamic fields (excluding Comment/name) */}
                                {TOOL_FIELDS.filter(f => f.key !== "name" && visible[f.key] && (!viewMode || (tool[f.key] && String(tool[f.key]).trim()))).map(f => {
                                  const options = getFieldOptions(f.key, tool.tool_type);
                                  const fieldW = Math.max(8, (tool[f.key] || '').length + 2);
                                  return (
                                    <div key={f.key} className="shrink-0" style={{ width: `${fieldW}ch`, minWidth: '80px' }}>
                                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-0.5">{TOOL_FIELD_SHORT[f.key]}</span>
                                      {options ? (
                                        <ComboBox
                                          value={tool[f.key] || ""}
                                          onChange={(v) => updateCell(origIndex, f.key, v)}
                                          options={options}
                                          placeholder="—"
                                          className="h-8 text-xs px-2 py-1 w-full"
                                        />
                                      ) : (
                                        <Input
                                          value={tool[f.key] || ""}
                                          onChange={(e) => updateCell(origIndex, f.key, e.target.value)}
                                          className="h-8 text-xs border-transparent bg-transparent hover:border-border/60 focus:border-primary/40 focus:bg-background transition-all"
                                        />
                                      )}
                                    </div>
                                  );
                                })}
                              </>
                            )}

                            {tool.locked && (
                              <div className="ml-auto flex items-end pb-1">
                                <Lock className="w-3.5 h-3.5 text-amber-500" />
                              </div>
                            )}
                          </div>
                          </ContextMenuTrigger>
                          <ContextMenuContent>
                            <ContextMenuItem onClick={() => setEditingIndex(origIndex)} className="gap-2">
                              <Pencil className="w-3.5 h-3.5" /> Edit Tool
                            </ContextMenuItem>
                            <ContextMenuItem onClick={() => toggleLock(origIndex)} className="gap-2">
                              {tool.locked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                              {tool.locked ? "Unlock Tool" : "Lock Tool"}
                            </ContextMenuItem>
                            {!isFixedSlots && (
                              <ContextMenuItem onClick={() => duplicateRow(origIndex)} className="gap-2">
                                <Copy className="w-3.5 h-3.5" /> Duplicate Tool
                              </ContextMenuItem>
                            )}
                            <ContextMenuItem onClick={() => handleRemoveClick(origIndex)} className="gap-2 text-destructive focus:text-destructive">
                              <Trash2 className="w-3.5 h-3.5" /> Delete Tool
                            </ContextMenuItem>
                          </ContextMenuContent>
                          </ContextMenu>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}

        {tools.length > 0 && !isFixedSlots && (
          <div className="mt-3 flex justify-start">
            <Button size="sm" variant="outline" onClick={addRow} className="h-7 text-xs gap-1.5">
              <Plus className="w-3 h-3" /> Add Tool
            </Button>
          </div>
        )}

        {editingIndex !== null && tools[editingIndex] && (
          <ToolEditModal
            tool={tools[editingIndex]}
            onChange={(updated) => updateTool(editingIndex, updated)}
            onClose={() => setEditingIndex(null)}
          />
        )}

        <AlertDialog open={unlockConfirmIndex !== null} onOpenChange={(open) => !open && setUnlockConfirmIndex(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Unlock and remove tool?</AlertDialogTitle>
              <AlertDialogDescription>
                This tool is locked in the machine. Are you sure you want to unlock and remove it?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmUnlockAndRemove}>Unlock & Remove</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={deleteConfirmIndex !== null} onOpenChange={(open) => !open && setDeleteConfirmIndex(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete tool?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this tool? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}