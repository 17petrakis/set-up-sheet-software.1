import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";
import { TOOL_TYPE_OPTIONS, getAllFields, getEffectiveVisibleFields, makeCustomFieldKey } from "@/lib/toolTypeOptions";
import TreeCascadingDropdown from "@/components/ui/TreeCascadingDropdown";

export default function ToolEditModal({ tool, onChange, onClose }) {
  const visible = getEffectiveVisibleFields(tool);
  const [newFieldLabel, setNewFieldLabel] = useState("");

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onClose();
    }
  };

  const toggleField = (key) => {
    const overrides = tool.visible_fields || {};
    onChange({ ...tool, visible_fields: { ...overrides, [key]: !visible[key] } });
  };

  const setField = (key, val) => onChange({ ...tool, [key]: val });

  const addCustomField = () => {
    const label = newFieldLabel.trim();
    if (!label) return;
    const key = makeCustomFieldKey(label);
    if (tool[key] !== undefined) { setNewFieldLabel(""); return; }
    const overrides = tool.visible_fields || {};
    onChange({ ...tool, [key]: "", visible_fields: { ...overrides, [key]: true } });
    setNewFieldLabel("");
  };

  const removeCustomField = (key) => {
    const next = { ...tool };
    delete next[key];
    if (next.visible_fields) {
      const vf = { ...next.visible_fields };
      delete vf[key];
      next.visible_fields = vf;
    }
    onChange(next);
  };

  const allFields = getAllFields(tool);
  const customKeys = new Set(allFields.filter(f => f.key.startsWith("custom_")).map(f => f.key));

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Edit Tool {tool.tool_number || ""}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tool Number + Type */}
          <div className="grid grid-cols-[80px_1fr] gap-3">
            <div>
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">Tool #</label>
              <Input
                value={tool.tool_number || ""}
                onChange={(e) => setField("tool_number", e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-8 text-xs text-center font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">Tool Type</label>
              <TreeCascadingDropdown
                value={tool.tool_type || ""}
                onChange={(v) => onChange({ ...tool, tool_type: v, visible_fields: null })}
                options={TOOL_TYPE_OPTIONS}
                placeholder="Select…"
                className="w-full"
              />
            </div>
          </div>

          {/* All toggleable fields */}
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">All Fields — toggle to show/hide in row</p>
            {allFields.map(f => (
              <div key={f.key} className="flex items-center gap-2 py-1 border-b border-border/30">
                <Checkbox
                  checked={!!visible[f.key]}
                  onCheckedChange={() => toggleField(f.key)}
                />
                <span className="text-xs font-medium w-32 shrink-0">{f.label}</span>
                <Input
                  value={tool[f.key] || ""}
                  onChange={(e) => setField(f.key, e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="h-8 text-xs flex-1"
                />
                {customKeys.has(f.key) && (
                  <Button size="icon" variant="ghost" onClick={() => removeCustomField(f.key)} className="h-7 w-7 text-destructive hover:text-destructive shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Add custom field */}
          <div className="flex items-center gap-2 pt-1">
            <Input
              value={newFieldLabel}
              onChange={(e) => setNewFieldLabel(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomField(); } }}
              placeholder="Custom field name…"
              className="h-8 text-xs flex-1"
            />
            <Button size="sm" variant="outline" onClick={addCustomField} className="gap-1.5 shrink-0">
              <Plus className="w-3.5 h-3.5" /> Add Field
            </Button>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={onClose} size="sm">OK</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}