import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, ChevronDown, ChevronRight, GripVertical } from "lucide-react";
import TurretDropdown from "./TurretDropdown";
import ToolRow, { AddToolButton } from "./ToolRow";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function TurretBlock({ turret, onChange, onRemove, index }) {
  const [collapsed, setCollapsed] = useState(false);

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
        <div className="flex-1 max-w-xs">
          <TurretDropdown value={turret.turret_type || ""} onChange={(v) => setField("turret_type", v)} />
        </div>
        {turret.turret_type && <AddToolButton onAdd={addTool} />}
        <Button type="button" size="icon" variant="ghost" onClick={onRemove}
          className="h-8 w-8 ml-auto text-destructive hover:text-destructive shrink-0">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {!collapsed && (
        <div className="px-4 py-4 bg-background">
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
                            <div className="flex-1 min-w-0">
                              <ToolRow
                                tool={tool}
                                onUpdate={(updated) => updateTool(i, updated)}
                                onRemove={() => removeTool(i)}
                              />
                            </div>
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
    </div>
  );
}