import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { TOOL_FIELDS, TOOL_TYPE_OPTIONS, getEffectiveVisibleFields } from "@/lib/toolTypeOptions";
import TreeCascadingDropdown from "@/components/ui/TreeCascadingDropdown";

export default function ToolEditModal({ tool, onChange, onClose }) {
  const visible = getEffectiveVisibleFields(tool);

  const toggleField = (key) => {
    const overrides = tool.visible_fields || {};
    onChange({ ...tool, visible_fields: { ...overrides, [key]: !visible[key] } });
  };

  const setField = (key, val) => onChange({ ...tool, [key]: val });

  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Tool {tool.tool_number || ""}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tool Comment (Name) */}
          <div>
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">Comment</label>
            <Input
              value={tool.name || ""}
              onChange={(e) => setField("name", e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* Tool Number + Type */}
          <div className="grid grid-cols-[80px_1fr] gap-3">
            <div>
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">Tool #</label>
              <Input
                value={tool.tool_number || ""}
                disabled
                readOnly
                className="h-8 text-xs text-center font-mono bg-muted/50"
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

          {/* All toggleable fields (excluding Comment, shown above) */}
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">All Fields — toggle to show/hide in row</p>
            {TOOL_FIELDS.filter(f => f.key !== "name").map(f => (
              <div key={f.key} className="flex items-center gap-2 py-1 border-b border-border/30">
                <Checkbox
                  checked={!!visible[f.key]}
                  onCheckedChange={() => toggleField(f.key)}
                />
                <span className="text-xs font-medium w-32 shrink-0">{f.label}</span>
                <Input
                  value={tool[f.key] || ""}
                  onChange={(e) => setField(f.key, e.target.value)}
                  className="h-8 text-xs flex-1"
                />
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}