import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { isHoleMaking } from "./ToolTypeDropdown";

function isTap(v) { return v === "Hole Making – Tap" || v === "Mill Hole Making – Tap"; }
function isHoleMakingOrTap(v) { return isHoleMaking(v) || isTap(v); }

function getFixedFields(typeValue, isMill) {
  const isHoleMakingType = isHoleMakingOrTap(typeValue);
  return [
    { key: "holder", label: "Holder" },
    { key: "direction", label: "Direction" },
    ...(isMill ? [] : [{ key: "orientation", label: "Orientation" }]),
    { key: "stickout", label: (isHoleMakingType || isMill) ? "Stickout (from holder)" : "Stickout" },
  ];
}

function getExtraFieldDefs(typeValue, isMill) {
  const isHoleMakingType = isHoleMakingOrTap(typeValue);
  if (isMill) return [
    { key: "num_flutes", label: "#-Flt" },
    { key: "flute_length", label: "Flute length" },
    { key: "oal", label: "OAL" },
    { key: "reach", label: "Reach" },
    { key: "shank_dia", label: "Shank Dia." },
    { key: "neck_dia", label: "Neck Dia." },
    { key: "tip_dia", label: "Tip" },
    { key: "extension", label: "Extension" },
    { key: "part_number_desc", label: "Part #/Desc." },
    { key: "insert", label: "Insert" },
    { key: "note", label: "Note" },
  ];
  return [
    ...(typeValue === "Thread" ? [{ key: "angle", label: "Angle" }] : []),
    ...(typeValue === "Profile" ? [{ key: "relief_angle", label: "Relief Angle" }] : []),
    ...(!isHoleMakingType ? [{ key: "sleeve_shim", label: "Sleeve/Shim" }] : []),
    ...(isHoleMakingType ? [
      { key: "holder_collet", label: "Holder + Collet size" },
      { key: "num_flutes", label: "#-Flt" },
      { key: "flute_length", label: "Flute length" },
      { key: "oal", label: "OAL" },
      { key: "reach", label: "Reach" },
      { key: "shank_dia", label: "Shank Dia." },
      { key: "neck_dia", label: "Neck Dia." },
      { key: "tip_dia", label: "Tip Dia." },
      { key: "coolant", label: "Coolant" },
      { key: "extension", label: "Extension" },
      { key: "part_number_desc", label: "Part #/Desc." },
      { key: "note", label: "Note" },
    ] : []),
    ...(!isHoleMakingType ? [{ key: "material", label: "Material" }, { key: "name", label: "Name/Description" }] : []),
    ...(isTap(typeValue) ? [{ key: "chamfer_x_p", label: "Chamfer x P" }] : []),
  ];
}

export default function TurningToolEditModal({ tool, onUpdate, onClose, typeValue }) {
  const isMill = tool.tool_kind === "Mill";
  const removed = tool._removed_fields || [];
  const added = tool._added_fields || [];
  const customFields = tool.custom_fields || [];

  const fixedFields = getFixedFields(typeValue, isMill);
  const extraFieldDefs = getExtraFieldDefs(typeValue, isMill);

  const isFixedVisible = (k) => !removed.includes(k);
  const isExtraVisible = (k) => added.includes(k);

  const toggleFixed = (k) => {
    if (isFixedVisible(k)) onUpdate({ ...tool, _removed_fields: [...removed, k] });
    else onUpdate({ ...tool, _removed_fields: removed.filter(x => x !== k) });
  };
  const toggleExtra = (k) => {
    if (isExtraVisible(k)) onUpdate({ ...tool, _added_fields: added.filter(x => x !== k) });
    else onUpdate({ ...tool, _added_fields: [...added, k] });
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
              {fixedFields.map(f => (
                <label key={f.key} className="flex items-center gap-2.5 py-1.5 cursor-pointer hover:bg-muted/40 rounded px-1">
                  <Checkbox checked={isFixedVisible(f.key)} onCheckedChange={() => toggleFixed(f.key)} />
                  <span className="text-xs font-medium">{f.label}</span>
                </label>
              ))}
              {extraFieldDefs.map(f => (
                <label key={f.key} className="flex items-center gap-2.5 py-1.5 cursor-pointer hover:bg-muted/40 rounded px-1">
                  <Checkbox checked={isExtraVisible(f.key)} onCheckedChange={() => toggleExtra(f.key)} />
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
        </div>
      </DialogContent>
    </Dialog>
  );
}