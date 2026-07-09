import React, { useState, useContext } from "react";
import { ViewModeContext } from "@/lib/viewModeContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SectionHeader from "./SectionHeader";
import { Wrench, Plus, Trash2, Pencil, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { emptyTool } from "@/lib/setupSheetDefaults";
import { TOOL_TYPE_OPTIONS, TOOL_FIELDS, TOOL_FIELD_SHORT, getEffectiveVisibleFields, getFieldOptions } from "@/lib/toolTypeOptions";
import TreeCascadingDropdown from "@/components/ui/TreeCascadingDropdown";
import ComboBox from "@/components/ui/ComboBox";
import ToolEditModal from "./ToolEditModal";
import { useToast } from "@/components/ui/use-toast";
import { base44 } from "@/api/base44Client";
import { RefreshCw } from "lucide-react";

export default function ToolList({ tools, onChange, machine }) {
  const { toast } = useToast();
  const viewMode = useContext(ViewModeContext);
  const [editingIndex, setEditingIndex] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const sortByTNumber = (arr) =>
    [...arr].sort((a, b) => {
      const aNum = parseInt(a.tool_number, 10);
      const bNum = parseInt(b.tool_number, 10);
      if (isNaN(aNum) && isNaN(bNum)) return 0;
      if (isNaN(aNum)) return 1;
      if (isNaN(bNum)) return -1;
      return aNum - bNum;
    });

  const addRow = () => onChange([...tools, { ...emptyTool }]);
  const removeRow = (i) => onChange(tools.filter((_, idx) => idx !== i));
  const updateCell = (i, key, val) => {
    const updated = [...tools];
    updated[i] = { ...updated[i], [key]: val };
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
    if (!result.destination) return;
    const reordered = [...tools];
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    onChange(reordered);
  };

  const handleSync = async () => {
    if (!machine) {
      toast({ title: "No machine selected", description: "Please select a machine before syncing.", variant: "destructive" });
      return;
    }
    setSyncing(true);
    try {
      const payload = {
        machineId: machine,
        tools: tools.map(t => ({
          tool_number: t.tool_number,
          tool_type: t.tool_type,
          diameter: t.diameter,
          holder: t.holder,
          name: t.name,
          flutes: t.flutes,
          stickout_length: t.stickout_length,
        })),
      };
      const res = await base44.functions.invoke('syncToolListToMachine', payload);
      const data = res.data || res;
      const t = toast({
        title: "Machine tool list updated",
        description: data.message || data.summary || "Sync complete.",
      });
      setTimeout(() => t.dismiss(), 30000);
    } catch (err) {
      const t = toast({
        title: "Sync failed",
        description: err?.response?.data?.error || err?.message || "Could not sync tool list.",
        variant: "destructive",
      });
      setTimeout(() => t.dismiss(), 30000);
    } finally {
      setSyncing(false);
    }
  };

  if (viewMode && !tools.some(t => Object.values(t).some(v => v && String(v).trim()))) return null;

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="pt-5 pb-5">
        <SectionHeader icon={Wrench} title="Tool List">
          {tools.length > 0 && (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleSync} disabled={syncing} className="h-7 text-xs gap-1.5">
                <RefreshCw className={`w-3 h-3 ${syncing ? "animate-spin" : ""}`} /> Update Machine's Tool List (Beta)
              </Button>
              <Button size="sm" variant="outline" onClick={addRow} className="h-7 text-xs gap-1.5">
                <Plus className="w-3 h-3" /> Add Tool
              </Button>
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
                  {tools.map((tool, i) => {
                    const visible = getEffectiveVisibleFields(tool);
                    return (
                      <Draggable key={i} draggableId={`tool-${i}`} index={i}>
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
                            <div className="shrink-0 w-14">
                              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-0.5">T#</span>
                              <Input
                                value={tool.tool_number || ""}
                                onChange={(e) => updateCell(i, "tool_number", e.target.value)}
                                className="h-8 text-xs border-transparent bg-transparent hover:border-border/60 focus:border-primary/40 focus:bg-background transition-all text-center font-mono"
                              />
                            </div>

                            {/* Tool Type */}
                            <div className="shrink-0 w-40">
                              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-0.5">Tool Type</span>
                              <TreeCascadingDropdown
                                value={tool.tool_type || ""}
                                onChange={(v) => handleTypeChange(i, v)}
                                options={TOOL_TYPE_OPTIONS}
                                placeholder="Select…"
                                className="w-full"
                              />
                            </div>

                            {/* Dynamic fields */}
                            {TOOL_FIELDS.filter(f => visible[f.key] && (!viewMode || (tool[f.key] && String(tool[f.key]).trim()))).map(f => {
                              const options = getFieldOptions(f.key, tool.tool_type);
                              const fieldW = Math.max(8, (tool[f.key] || '').length + 2);
                              return (
                                <div key={f.key} className="shrink-0" style={{ width: `${fieldW}ch`, minWidth: '80px' }}>
                                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-0.5">{TOOL_FIELD_SHORT[f.key]}</span>
                                  {options ? (
                                    <ComboBox
                                      value={tool[f.key] || ""}
                                      onChange={(v) => updateCell(i, f.key, v)}
                                      options={options}
                                      placeholder="—"
                                      className="h-8 text-xs px-2 py-1 w-full"
                                    />
                                  ) : (
                                    <Input
                                      value={tool[f.key] || ""}
                                      onChange={(e) => updateCell(i, f.key, e.target.value)}
                                      className="h-8 text-xs border-transparent bg-transparent hover:border-border/60 focus:border-primary/40 focus:bg-background transition-all"
                                    />
                                  )}
                                </div>
                              );
                            })}

                            {/* Actions */}
                            <div className="flex items-end gap-0.5 ml-auto">
                              <Button size="icon" variant="ghost" onClick={() => setEditingIndex(i)}
                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => removeRow(i)}
                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive">
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
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

        {tools.length > 0 && (
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
      </CardContent>
    </Card>
  );
}