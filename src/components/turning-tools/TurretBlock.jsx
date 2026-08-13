import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, ChevronDown, ChevronRight, GripVertical, Copy } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem,
} from "@/components/ui/context-menu";
import ToolRow, { AddToolButton } from "./ToolRow";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function TurretBlock({ turret, onChange, onRemove, index, turretOptions }) {
  const [collapsed, setCollapsed] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const setField = (k, v) => onChange({ ...turret, [k]: v });

  const addTool = (kind) => {
    const newTool = { _id: Date.now() + Math.random(), tool_kind: kind, tool_number: "", tool_type: "" };
    const tools = [...(turret.tools || []), newTool];
    // Sort by tool number after adding
    const sorted = sortTools(tools);
    setField("tools", sorted);
  };

  const sortTools = (tools) => {
    return [...tools].sort((a, b) => {
      const na = parseFloat(a.tool_number) || 0;
      const nb = parseFloat(b.tool_number) || 0;
      return na - nb;
    });
  };

  const updateTool = (i, updated) => {
    const tools = [...(turret.tools || [])];
    tools[i] = updated;
    // Re-sort by tool number when tool_number changes
    const sorted = sortTools(tools);
    setField("tools", sorted);
  };

  const removeTool = (i) => {
    setField("tools", (turret.tools || []).filter((_, idx) => idx !== i));
  };

  const duplicateTool = (i) => {
    const original = turret.tools[i];
    if (!original) return;
    const copy = { ...JSON.parse(JSON.stringify(original)), _id: Date.now() + Math.random(), tool_number: "" };
    const tools = [...(turret.tools || [])];
    tools.splice(i + 1, 0, copy);
    setField("tools", tools);
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const tools = Array.from(turret.tools || []);
    const [moved] = tools.splice(result.source.index, 1);
    tools.splice(result.destination.index, 0, moved);
    setField("tools", tools);
  };

  return (
    <div className="border border-border/50 rounded-xl mb-4 shadow-sm">
      {/* Turret header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-muted/40 border-b border-border/40">
        <button type="button" onClick={() => setCollapsed(c => !c)} className="text-muted-foreground hover:text-foreground">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        <span className="text-sm font-semibold text-foreground">Turret {index + 1}</span>
        <Button type="button" size="icon" variant="ghost" onClick={() => setConfirmDelete(true)}
          className="h-8 w-8 ml-auto text-destructive hover:text-destructive shrink-0">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {!collapsed && (
        <div className="px-4 py-4 bg-background">
          {turret.turret_type && (
            <div className="mb-3">
              <AddToolButton onAdd={addTool} />
            </div>
          )}
          {(turret.tools || []).length === 0 && (
            <p className="text-xs text-muted-foreground mb-3">No tools added yet.</p>
          )}
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId={`turret-${index}`}>
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  {(turret.tools || []).map((tool, i) => (
                    <Draggable key={tool._id ? String(tool._id) : `tool-${i}`} draggableId={tool._id ? String(tool._id) : `tool-${i}`} index={i}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={snapshot.isDragging ? "opacity-80 shadow-lg" : ""}
                        >
                          <div className="flex items-start gap-1">
                            <div {...provided.dragHandleProps} className="mt-2 p-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing">
                              <GripVertical className="w-4 h-4" />
                            </div>
                            <ContextMenu>
                              <ContextMenuTrigger asChild>
                                <div className="flex-1 min-w-0">
                                  <ToolRow
                                    tool={tool}
                                    onUpdate={(updated) => updateTool(i, updated)}
                                    onRemove={() => removeTool(i)}
                                  />
                                </div>
                              </ContextMenuTrigger>
                              <ContextMenuContent>
                                <ContextMenuItem onClick={() => duplicateTool(i)} className="gap-2">
                                  <Copy className="w-3.5 h-3.5" /> Duplicate Tool
                                </ContextMenuItem>
                              </ContextMenuContent>
                            </ContextMenu>
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
        </div>
      )}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Turret?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete Turret {index + 1} and all its tools? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setConfirmDelete(false); onRemove(); }} className="bg-destructive hover:bg-destructive/90 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}