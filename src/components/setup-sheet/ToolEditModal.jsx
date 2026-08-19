import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";
import { TOOL_FIELDS, getEffectiveVisibleFields, getCustomFields, makeCustomFieldKey } from "@/lib/toolTypeOptions";

export default function ToolEditModal({ tool, onChange, onClose }) {
  const visible = getEffectiveVisibleFields(tool);
  const [editingLabels, setEditingLabels] = useState({});

  const toggleField = (key) => {
    const overrides = tool.visible_fields || {};
    onChange({ ...tool, visible_fields: { ...overrides, [key]: !visible[key] } });
  };

  const setFieldValue = (key, val) => onChange({ ...tool, [key]: val });

  const addCustomField = () => {
    let idx = 1;
    while (tool[`custom_field_${idx}`] !== undefined) idx++;
    const key = `custom_field_${idx}`;
    const overrides = tool.visible_fields || {};
    onChange({ ...tool, [key]: "", visible_fields: { ...overrides, [key]: true } });
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

  const commitRename = (oldKey, newLabel) => {
    const trimmed = (newLabel || "").trim();
    setEditingLabels(prev => { const next = { ...prev }; delete next[oldKey]; return next; });
    if (!trimmed) return;
    const newKey = makeCustomFieldKey(trimmed);
    if (oldKey === newKey || tool[newKey] !== undefined) return;
    const value = tool[oldKey] || "";
    const next = { ...tool };
    delete next[oldKey];
    next[newKey] = value;
    if (next.visible_fields) {
      const vf = { ...next.visible_fields };
      if (oldKey in vf) { vf[newKey] = vf[oldKey]; delete vf[oldKey]; }
      next.visible_fields = vf;
    }
    onChange(next);
  };

  const customFields = getCustomFields(tool);

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Edit Tool Fields {tool.tool_number ? `T${tool.tool_number}` : ""}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Fields — toggle to show/hide</p>
            <div className="space-y-0.5">
              {TOOL_FIELDS.map(f => (
                <label key={f.key} className="flex items-center gap-2.5 py-1.5 cursor-pointer hover:bg-muted/40 rounded px-1">
                  <Checkbox checked={!!visible[f.key]} onCheckedChange={() => toggleField(f.key)} />
                  <span className="text-xs font-medium">{f.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Custom Fields</p>
              <button type="button" onClick={addCustomField} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80">
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            {customFields.length === 0 && (
              <p className="text-xs text-muted-foreground italic px-1">No custom fields.</p>
            )}
            {customFields.map((cf) => (
              <div key={cf.key} className="flex items-center gap-2 py-1">
                <Input
                  value={editingLabels[cf.key] !== undefined ? editingLabels[cf.key] : cf.label}
                  onChange={(e) => setEditingLabels(prev => ({ ...prev, [cf.key]: e.target.value }))}
                  onBlur={(e) => commitRename(cf.key, e.target.value)}
                  placeholder="Field name"
                  className="h-8 text-xs flex-1"
                />
                <Input
                  value={tool[cf.key] || ""}
                  onChange={(e) => setFieldValue(cf.key, e.target.value)}
                  placeholder="Value"
                  className="h-8 text-xs flex-1"
                />
                <button type="button" onClick={() => removeCustomField(cf.key)} className="text-destructive hover:text-destructive/80 p-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-2 border-t border-border">
            <Button type="button" onClick={onClose} className="bg-primary hover:bg-primary/90 text-white">
              OK
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}