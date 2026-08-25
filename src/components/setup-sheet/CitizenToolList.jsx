import React, { useContext, useState } from "react";
import { ViewModeContext } from "@/lib/viewModeContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import SectionHeader from "./SectionHeader";
import { Wrench, Plus, Trash2, GripVertical, Ruler } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import AutoSizeInput from "@/components/turning-tools/AutoSizeInput";

const TOOL_LOCATIONS = [
  { key: "Main Slide", label: "Main Slide" },
  { key: "Main Spindle End Working", label: "Main Spindle End Working" },
  { key: "Sub-Spindle End Working", label: "Sub-Spindle End Working" },
];

const DEFAULT_LOCATION = "Main Slide";

const emptyCitizenTool = { tool_number: "", description: "", insert: "", holder: "", stickout: "", location: DEFAULT_LOCATION };

function getTNum(tool) {
  const n = parseInt(tool.tool_number, 10);
  return isNaN(n) ? null : n;
}

function normalizeLocation(loc) {
  return TOOL_LOCATIONS.some((l) => l.key === loc) ? loc : DEFAULT_LOCATION;
}

export default function CitizenToolList({ tools, onChange }) {
  const viewMode = useContext(ViewModeContext);
  const [editingStickout, setEditingStickout] = useState({});

  const rawList = tools?.length ? tools : [];
  const list = rawList.map((t) => ({ ...t, location: normalizeLocation(t.location) }));

  const addTool = (location) => onChange([...rawList, { ...emptyCitizenTool, location }]);
  const removeTool = (i) => onChange(rawList.filter((_, idx) => idx !== i));
  const updateCell = (i, key, val) => {
    const updated = [...rawList];
    updated[i] = { ...updated[i], [key]: val };
    onChange(updated);
  };

  const toggleStickout = (i) => {
    setEditingStickout((s) => ({ ...s, [i]: !s[i] }));
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const fromSection = result.source.droppableId;
    const toSection = result.destination.droppableId;

    // Build per-section arrays preserving current within-section order
    const sectionArrays = {};
    TOOL_LOCATIONS.forEach((s) => { sectionArrays[s.key] = []; });
    rawList.forEach((t) => {
      sectionArrays[normalizeLocation(t.location)].push(t);
    });

    // Remove the dragged tool from its source section
    const [moved] = sectionArrays[fromSection].splice(result.source.index, 1);
    if (!moved) return;

    // Update its location and insert into the destination section at the drop position
    sectionArrays[toSection].splice(result.destination.index, 0, { ...moved, location: toSection });

    // Reconstruct rawList grouped by section in canonical order
    onChange([
      ...sectionArrays["Main Slide"],
      ...sectionArrays["Main Spindle End Working"],
      ...sectionArrays["Sub-Spindle End Working"],
    ]);
  };

  const hasAnyData = list.some((t) =>
    Object.entries(t).some(([k, v]) => k !== "location" && v && String(v).trim())
  );
  if (viewMode && !hasAnyData) return null;

  const renderToolRow = (tool, filteredIdx, i) => {
    const tNum = getTNum(tool);
    const showStickout = tNum !== null && tNum >= 7;
    const stickoutAdded = showStickout && (tool.stickout || editingStickout[i]);
    return (
      <Draggable key={`ctool-${i}`} draggableId={`ctool-${i}`} index={filteredIdx}>
        {(prov) => (
          <div
            ref={prov.innerRef}
            {...prov.draggableProps}
            className="group flex items-end gap-2 px-2 py-2 rounded-lg hover:bg-muted/20 border-b border-border/30 last:border-b-0 transition-colors min-w-max"
          >
            <div {...prov.dragHandleProps} className="flex items-end pb-1.5 cursor-grab active:cursor-grabbing">
              <GripVertical className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground/70" />
            </div>

            {/* Location */}
            <div className="shrink-0 w-44">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-0.5">Location</span>
              <Select value={tool.location} onValueChange={(v) => updateCell(i, "location", v)} disabled={viewMode}>
                <SelectTrigger className="h-8 text-xs bg-card border-input hover:border-primary/40 focus:border-primary/40 transition-all">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TOOL_LOCATIONS.map((l) => (
                    <SelectItem key={l.key} value={l.key}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* T# */}
            <div className="shrink-0 w-16">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-0.5">T#</span>
              <Input
                value={tool.tool_number || ""}
                onChange={(e) => updateCell(i, "tool_number", e.target.value)}
                className="h-8 text-xs bg-card border-input hover:border-primary/40 focus:border-primary/40 transition-all text-center font-mono"
              />
            </div>

            {/* Description */}
            <div className="min-w-[8rem]">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-0.5">Description</span>
              <AutoSizeInput
                value={tool.description || ""}
                onChange={(v) => updateCell(i, "description", v)}
                inputClass="h-8 text-xs bg-card border-input hover:border-primary/40 focus:border-primary/40 transition-all"
                minWidth="8rem"
              />
            </div>

            {/* Insert / Part Number */}
            <div className="min-w-[8rem]">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-0.5">Insert / Part Number</span>
              <AutoSizeInput
                value={tool.insert || ""}
                onChange={(v) => updateCell(i, "insert", v)}
                inputClass="h-8 text-xs bg-card border-input hover:border-primary/40 focus:border-primary/40 transition-all"
                minWidth="8rem"
              />
            </div>

            {/* Holder */}
            <div className="min-w-[3rem]">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-0.5">Holder</span>
              <AutoSizeInput
                value={tool.holder || ""}
                onChange={(v) => updateCell(i, "holder", v)}
                inputClass="h-8 text-xs bg-card border-input hover:border-primary/40 focus:border-primary/40 transition-all"
                minWidth="3rem"
              />
            </div>

            {/* Stickout (T# 7+ only, optional) */}
            {showStickout && (
              <>
                {stickoutAdded ? (
                  <div className="shrink-0 w-28">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-0.5">Stickout</span>
                    <div className="flex items-center gap-1">
                      <Input
                        value={tool.stickout || ""}
                        onChange={(e) => updateCell(i, "stickout", e.target.value)}
                        className="h-8 text-xs bg-card border-input hover:border-primary/40 focus:border-primary/40 transition-all"
                      />
                      {!viewMode && (
                        <Button size="icon" variant="ghost" onClick={() => { updateCell(i, "stickout", ""); toggleStickout(i); }}
                          className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  !viewMode && (
                    <div className="flex items-end pb-1.5">
                      <Button size="sm" variant="outline" onClick={() => toggleStickout(i)} className="h-8 text-xs gap-1.5 border-dashed">
                        <Ruler className="w-3 h-3" /> Add Stickout
                      </Button>
                    </div>
                  )
                )}
              </>
            )}

            {/* Delete */}
            {!viewMode && (
              <div className="flex items-end gap-0.5 ml-auto">
                <Button size="icon" variant="ghost" onClick={() => removeTool(i)}
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </div>
        )}
      </Draggable>
    );
  };

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="pt-5 pb-5">
        <SectionHeader icon={Wrench} title="Tool List" />

        <DragDropContext onDragEnd={onDragEnd}>
          {TOOL_LOCATIONS.map((section) => {
            const sectionTools = list
              .map((t, i) => ({ tool: t, idx: i }))
              .filter(({ tool }) => tool.location === section.key);

            return (
              <div key={section.key} className="mb-4 last:mb-0">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-foreground/80">{section.label}</p>
                  {!viewMode && (
                    <Button size="sm" variant="outline" onClick={() => addTool(section.key)} className="h-7 text-xs gap-1.5">
                      <Plus className="w-3 h-3" /> Add Tool
                    </Button>
                  )}
                </div>

                <Droppable droppableId={section.key}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`overflow-x-auto space-y-1 pb-2 rounded-lg transition-colors ${
                        snapshot.isDraggingOver ? "bg-primary/5 border border-primary/20" : ""
                      }`}
                    >
                      {sectionTools.length === 0 ? (
                        !viewMode ? (
                          <button
                            onClick={() => addTool(section.key)}
                            className="w-full flex items-center justify-center py-6 text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-lg border-2 border-dashed border-border/50 transition-colors text-xs font-medium"
                          >
                            <Plus className="w-4 h-4 mr-1.5" /> Add a tool to {section.label}
                          </button>
                        ) : (
                          <p className="text-xs text-muted-foreground py-3">—</p>
                        )
                      ) : (
                        sectionTools.map(({ tool, idx }, filteredIdx) => renderToolRow(tool, filteredIdx, idx))
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </DragDropContext>
      </CardContent>
    </Card>
  );
}