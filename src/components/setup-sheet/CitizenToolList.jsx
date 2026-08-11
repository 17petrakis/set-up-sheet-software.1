import React, { useContext, useState } from "react";
import { ViewModeContext } from "@/lib/viewModeContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SectionHeader from "./SectionHeader";
import { Wrench, Plus, Trash2, GripVertical, Ruler } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const emptyCitizenTool = { tool_number: "", description: "", insert: "", stickout: "" };

function getTNum(tool) {
  const n = parseInt(tool.tool_number, 10);
  return isNaN(n) ? null : n;
}

function sortByTNumber(arr) {
  return [...arr].sort((a, b) => {
    const aNum = parseInt(a.tool_number, 10);
    const bNum = parseInt(b.tool_number, 10);
    if (isNaN(aNum) && isNaN(bNum)) return 0;
    if (isNaN(aNum)) return 1;
    if (isNaN(bNum)) return -1;
    return aNum - bNum;
  });
}

export default function CitizenToolList({ tools, onChange }) {
  const viewMode = useContext(ViewModeContext);
  const [editingStickout, setEditingStickout] = useState({});

  const list = tools?.length ? tools : [];

  const addTool = () => onChange([...list, { ...emptyCitizenTool }]);
  const removeTool = (i) => onChange(list.filter((_, idx) => idx !== i));
  const updateCell = (i, key, val) => {
    const updated = [...list];
    updated[i] = { ...updated[i], [key]: val };
    onChange(key === "tool_number" ? sortByTNumber(updated) : updated);
  };

  const toggleStickout = (i) => {
    setEditingStickout(s => ({ ...s, [i]: !s[i] }));
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = [...list];
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    onChange(reordered);
  };

  if (viewMode && !list.some(t => Object.values(t).some(v => v && String(v).trim()))) return null;

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="pt-5 pb-5">
        <SectionHeader icon={Wrench} title="Tool List">
          {list.length > 0 && (
            <Button size="sm" variant="outline" onClick={addTool} className="h-7 text-xs gap-1.5">
              <Plus className="w-3 h-3" /> Add Tool
            </Button>
          )}
        </SectionHeader>

        {list.length === 0 ? (
          <button onClick={addTool} className="w-full flex flex-col items-center justify-center py-12 text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-lg border-2 border-dashed border-border/50 transition-colors group">
            <Plus className="w-6 h-6 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium">Click to add a tool</span>
          </button>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="citizen-tool-list">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-1">
                  {list.map((tool, i) => {
                    const tNum = getTNum(tool);
                    const showStickout = tNum !== null && tNum >= 7;
                    const stickoutAdded = showStickout && (tool.stickout || editingStickout[i]);
                    return (
                      <Draggable key={i} draggableId={`ctool-${i}`} index={i}>
                        {(prov) => (
                          <div
                            ref={prov.innerRef}
                            {...prov.draggableProps}
                            className="group flex items-end gap-2 px-2 py-2 rounded-lg hover:bg-muted/20 border-b border-border/30 last:border-b-0 transition-colors flex-wrap"
                          >
                            <div {...prov.dragHandleProps} className="flex items-end pb-1.5 cursor-grab active:cursor-grabbing">
                              <GripVertical className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground/70" />
                            </div>

                            {/* T# */}
                            <div className="shrink-0 w-16">
                              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-0.5">T#</span>
                              <Input
                                value={tool.tool_number || ""}
                                onChange={(e) => updateCell(i, "tool_number", e.target.value)}
                                className="h-8 text-xs border-transparent bg-transparent hover:border-border/60 focus:border-primary/40 focus:bg-background transition-all text-center font-mono"
                              />
                            </div>

                            {/* Description */}
                            <div className="flex-1 min-w-[140px]">
                              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-0.5">Description</span>
                              <Input
                                value={tool.description || ""}
                                onChange={(e) => updateCell(i, "description", e.target.value)}
                                className="h-8 text-xs border-transparent bg-transparent hover:border-border/60 focus:border-primary/40 focus:bg-background transition-all"
                              />
                            </div>

                            {/* Insert */}
                            <div className="flex-1 min-w-[120px]">
                              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-0.5">Insert</span>
                              <Input
                                value={tool.insert || ""}
                                onChange={(e) => updateCell(i, "insert", e.target.value)}
                                className="h-8 text-xs border-transparent bg-transparent hover:border-border/60 focus:border-primary/40 focus:bg-background transition-all"
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
                                        className="h-8 text-xs border-transparent bg-transparent hover:border-border/60 focus:border-primary/40 focus:bg-background transition-all"
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
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}

        {list.length > 0 && !viewMode && (
          <div className="mt-3 flex justify-start">
            <Button size="sm" variant="outline" onClick={addTool} className="h-7 text-xs gap-1.5">
              <Plus className="w-3 h-3" /> Add Tool
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}