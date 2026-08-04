import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wrench, Plus, Lock, Unlock, Pencil, Trash2, Filter } from "lucide-react";
import { emptyTool } from "@/lib/setupSheetDefaults";
import { TOOL_FIELDS, TOOL_TYPE_OPTIONS, TOOL_FIELD_SHORT, getEffectiveVisibleFields, getFieldOptions } from "@/lib/toolTypeOptions";
import TreeCascadingDropdown from "@/components/ui/TreeCascadingDropdown";
import ComboBox from "@/components/ui/ComboBox";
import MachineToolEditModal from "./MachineToolEditModal";
import {
  ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function MachineToolListTable({ tools, onChange, slotCount, machineName }) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [showOnlyFull, setShowOnlyFull] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmUnlock, setConfirmUnlock] = useState(null);

  // Ensure we always have exactly slotCount slots
  const slots = useMemo(() => {
    const arr = Array.isArray(tools) ? tools : [];
    const result = Array.from({ length: slotCount }, (_, i) =>
      arr[i] ? { ...arr[i] } : { ...emptyTool, tool_number: String(i + 1) }
    );
    // Ensure every slot has a tool_number
    result.forEach((t, i) => {
      if (!t.tool_number) t.tool_number = String(i + 1);
    });
    return result;
  }, [tools, slotCount]);

  const isSlotFull = (tool) =>
    Object.entries(tool).some(([k, v]) => k !== "tool_number" && k !== "locked" && k !== "visible_fields" && v && String(v).trim());

  const visibleSlots = showOnlyFull ? slots.map((t, i) => ({ tool: t, index: i })).filter(({ tool }) => isSlotFull(tool)) : slots.map((t, i) => ({ tool: t, index: i }));

  const updateTool = (i, updated) => {
    const next = [...slots];
    next[i] = updated;
    onChange(next);
  };

  const updateCell = (i, key, val) => {
    const next = [...slots];
    next[i] = { ...next[i], [key]: val };
    onChange(next);
  };

  const handleTypeChange = (i, newType) => {
    const next = [...slots];
    next[i] = { ...next[i], tool_type: newType, visible_fields: null };
    onChange(next);
  };

  const toggleLock = (i) => {
    const next = [...slots];
    next[i] = { ...next[i], locked: !next[i].locked };
    onChange(next);
  };

  const clearTool = (i) => {
    const next = [...slots];
    next[i] = { ...emptyTool, tool_number: String(i + 1) };
    onChange(next);
  };

  const fullCount = slots.filter(isSlotFull).length;

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="pt-5 pb-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold font-heading text-foreground">{machineName}</h2>
            <span className="text-xs text-muted-foreground ml-1">{fullCount}/{slotCount} slots filled</span>
          </div>
          <Button
            size="sm"
            variant={showOnlyFull ? "default" : "outline"}
            onClick={() => setShowOnlyFull(!showOnlyFull)}
            className="h-7 text-xs gap-1.5"
          >
            <Filter className="w-3 h-3" /> {showOnlyFull ? "Showing Full" : "Show Only Full"}
          </Button>
        </div>

        <div className="space-y-1">
          {visibleSlots.map(({ tool, index: i }) => {
            const full = isSlotFull(tool);
            const visible = getEffectiveVisibleFields(tool);
            return (
              <ContextMenu key={i}>
                <ContextMenuTrigger asChild>
                  <div
                    className={`group flex items-end gap-2 px-2 py-2 rounded-lg hover:bg-muted/20 border-b border-border/30 last:border-b-0 transition-colors ${full ? "" : "bg-muted/10"}`}
                  >
                    {/* T# */}
                    <div className="shrink-0 w-14">
                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-0.5">T#</span>
                      <div className="h-8 flex items-center justify-center text-xs font-mono font-semibold text-foreground">
                        {tool.tool_number}
                      </div>
                    </div>

                    {full ? (
                      <>
                        {/* Comment (name) — expandable */}
                        <div className="shrink-0" style={{ width: `${Math.max(15, (tool.name || '').length + 3)}ch`, minWidth: '120px', maxWidth: '400px' }}>
                          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-0.5">Comment</span>
                          <Input
                            value={tool.name || ""}
                            onChange={(e) => updateCell(i, "name", e.target.value)}
                            className="h-8 text-xs border-transparent bg-transparent hover:border-border/60 focus:border-primary/40 focus:bg-background transition-all"
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
                            allowCustom
                          />
                        </div>

                        {/* Dynamic fields */}
                        {TOOL_FIELDS.filter(f => f.key !== "name" && visible[f.key]).map(f => {
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

                        {/* Lock indicator */}
                        {tool.locked && (
                          <div className="flex items-end pb-1.5 shrink-0">
                            <Lock className="w-3.5 h-3.5 text-amber-500" />
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center gap-1.5 ml-auto pr-1">
                        <span className="text-xs text-muted-foreground italic">empty</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setEditingIndex(i)}
                          className="h-7 w-7"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem onClick={() => setEditingIndex(i)} className="gap-2">
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </ContextMenuItem>
                  {tool.locked ? (
                    <ContextMenuItem onClick={() => setConfirmUnlock(i)} className="gap-2">
                      <Unlock className="w-3.5 h-3.5" /> Unlock Tool
                    </ContextMenuItem>
                  ) : (
                    <ContextMenuItem onClick={() => toggleLock(i)} className="gap-2">
                      <Lock className="w-3.5 h-3.5" /> Lock Tool
                    </ContextMenuItem>
                  )}
                  <ContextMenuSeparator />
                  <ContextMenuItem
                    onClick={() => {
                      if (tool.locked) {
                        setConfirmUnlock(i);
                      } else {
                        setConfirmDelete(i);
                      }
                    }}
                    className="gap-2 text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            );
          })}
        </div>

        {editingIndex !== null && slots[editingIndex] && (
          <MachineToolEditModal
            tool={slots[editingIndex]}
            onChange={(updated) => updateTool(editingIndex, updated)}
            onClose={() => setEditingIndex(null)}
          />
        )}

        {/* Delete confirmation */}
        <AlertDialog open={confirmDelete !== null} onOpenChange={(open) => { if (!open) setConfirmDelete(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove tool from slot T{slots[confirmDelete]?.tool_number}?</AlertDialogTitle>
              <AlertDialogDescription>
                This will clear all tool information from this slot. The slot will remain but become empty. Are you sure?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  clearTool(confirmDelete);
                  setConfirmDelete(null);
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Yes, remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Unlock confirmation */}
        <AlertDialog open={confirmUnlock !== null} onOpenChange={(open) => { if (!open) setConfirmUnlock(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Unlock tool in slot T{slots[confirmUnlock]?.tool_number}?</AlertDialogTitle>
              <AlertDialogDescription>
                This tool is currently locked in the machine. Confirm you want to unlock it so it can be modified or removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  toggleLock(confirmUnlock);
                  setConfirmUnlock(null);
                }}
              >
                Yes, unlock
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}