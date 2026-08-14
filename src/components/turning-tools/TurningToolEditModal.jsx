import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { EXTRA_FIELD_DEFS, DEFAULT_VISIBLE_EXTRA } from "@/lib/turningToolConfig";

export default function TurningToolEditModal({ tool, onUpdate, onClose, typeValue }) {
  const removed = tool._removed_fields || [];
  const added = tool._added_fields || [];
  const customFields = tool.custom_fields || [];

  const isFieldVisible = (k) => {
    if (removed.includes(k)) return false;
    if (added.includes(k)) return true;
    return DEFAULT_VISIBLE_EXTRA.includes(k);
  };

  const toggleField = (k) => {
    if (DEFAULT_VISIBLE_EXTRA.includes(k)) {
      if (removed.includes(k)) onUpdate({ ...tool, _removed_fields: removed.filter(x => x !== k) });
      else onUpdate({ ...tool, _removed_fields: [...removed, k] });
    } else {
      if (added.includes(k)) onUpdate({ ...tool, _added_fields: added.filter(x => x !== k) });
      else onUpdate({ ...tool, _added_fields: [...added, k] });
    }
  };

  const addCustomField = () => onUpdate({ ...tool, custom_fields: [...customFields, { key: "", value: "" }] });
  const removeCustomField = (i) => onUpdate({ ...tool, custom_fields: customFields.filter((_, idx) => idx !== i) });

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Tool Fields {tool.tool_number ? `T${tool.tool_number}` : ""}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Fields — toggle to show/hide</p>
            <div className="space-y-0.5">
              {EXTRA_FIELD_DEFS.map(f => (
                <label key={f.key} className="flex items-center gap-2.5 py-1.5 cursor-pointer hover:bg-muted/40 rounded px-1">
                  <Checkbox checked={isFieldVisible(f.key)} onCheckedChange={() => toggleField(f.key)} />
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
            {customFields.map((cf, i) => (
              <div key={i} className="flex items-center gap-2 py-1">
                <Input value={cf.key} onChange={(e) => {
                  const updated = [...customFields];
                  updated[i] = { ...updated[i], key: e.target.value };
                  onUpdate({ ...tool, custom_fields: updated });
                }} placeholder="Field name" className="h-8 text-xs flex-1" />
                <Input value={cf.value} onChange={(e) => {
                  const updated = [...customFields];
                  updated[i] = { ...updated[i], value: e.target.value };
                  onUpdate({ ...tool, custom_fields: updated });
                }} placeholder="Value" className="h-8 text-xs flex-1" />
                <button type="button" onClick={() => removeCustomField(i)} className="text-destructive hover:text-destructive/80 p-1">
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