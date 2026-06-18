import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, ChevronDown, ChevronRight, Plus, X } from "lucide-react";
import ToolTypeDropdown, { isHoleMaking } from "./ToolTypeDropdown";

// ── Inline options ─────────────────────────────────────────────────────────────
const RAD_OPTIONS = [".031", ".016", ".008", ".006", "0"];
const DEG_TURN_OPTIONS = ["100", "80", "55", "35"];
const WIDTH_OPTIONS = [".158 (4mm)", ".156 (5/32)", ".125 (⅛)", ".088", ".094 (3/32)", ".118 (3mm)", ".079 (2mm)", ".0625 (1/16)", ".059 (1.5mm)", ".047 (3/64)", ".031 (1/32)"];
const DIRECTION_OPTIONS = ["Main (S1)", "Sub (S2)"];
const ORIENTATION_OPTIONS = ["UP", "DOWN"];
const HOLDER_TURN_OPTIONS = ["DCLNR 16 4C (RH)", "DCLNL 16 4C (LH)", "DCKNR 16 4C KC3 (FACE)"];
const TOOL_BLOCK_OPTIONS = ["Turn OD", "Bore OD", "Part off OD", "Axial Face"];
const TAP_TYPE_OPTIONS = ["Form", "SF", "SP", "Hard"];
const ENDMILL_DIR_OPTIONS = ["X", "Z-", "Z+"];

// Whether a type uses Width instead of Deg in the header
function isGroove(typeValue) { return typeValue === "Groove/Part"; }
function isTap(typeValue) { return typeValue === "Hole Making – Tap" || typeValue === "Mill Hole Making – Tap"; }
function isHoleMakingOrTap(typeValue) { return isHoleMaking(typeValue) || isTap(typeValue); }

// ── Small field helpers ────────────────────────────────────────────────────────
function Label({ children }) {
  return <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5 block">{children}</span>;
}

function SmallInput({ value, onChange, placeholder = "", className = "w-16" }) {
  return (
    <Input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className={`h-7 text-xs bg-background border-border/60 px-1.5 ${className}`} />
  );
}

function SmallSelect({ value, onChange, options, placeholder = "—", className = "w-20", allowOther = false }) {
  const [showOther, setShowOther] = useState(false);
  const [otherVal, setOtherVal] = useState("");

  if (allowOther && showOther) {
    return (
      <div className="flex gap-1">
        <Input value={otherVal} onChange={(e) => { setOtherVal(e.target.value); onChange(e.target.value); }}
          placeholder="Enter" className={`h-7 text-xs bg-background border-border/60 px-1.5 ${className}`} />
        <button type="button" onClick={() => { setShowOther(false); onChange(""); }}
          className="shrink-0 px-1.5 text-xs text-muted-foreground hover:text-foreground border border-border/60 rounded-md bg-background">↩</button>
      </div>
    );
  }

  return (
    <Select value={value || ""} onValueChange={(v) => { if (v === "__other__") { setShowOther(true); onChange(""); } else onChange(v); }}>
      <SelectTrigger className={`h-7 text-xs bg-background border-border/60 ${className}`}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map(o => <SelectItem key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</SelectItem>)}
        {allowOther && <SelectItem value="__other__">Other…</SelectItem>}
      </SelectContent>
    </Select>
  );
}

// ── Removable field wrapper ────────────────────────────────────────────────────
function RemovableField({ fieldKey, onRemove, children }) {
  return (
    <div className="relative group">
      {children}
      <button type="button" onClick={() => onRemove(fieldKey)}
        className="absolute -top-1.5 -right-1.5 hidden group-hover:flex items-center justify-center w-4 h-4 bg-destructive text-destructive-foreground rounded-full z-10">
        <X className="w-2.5 h-2.5" />
      </button>
    </div>
  );
}

// ── Field label + content wrapper ─────────────────────────────────────────────
function F({ label, children, className = "" }) {
  return (
    <div className={className}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

// ── Add Field Menu ─────────────────────────────────────────────────────────────
function AddFieldMenu({ availableFields, onAdd, onAddCustom }) {
  const [open, setOpen] = useState(false);
  if (availableFields.length === 0 && !onAddCustom) return null;
  return (
    <div className="relative" tabIndex={-1} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}>
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen(o => !o)} className="h-7 text-xs gap-1">
        <Plus className="w-3 h-3" /> Add Field
      </Button>
      {open && (
        <div className="absolute z-[500] bottom-full left-0 mb-1 w-44 bg-popover border border-border rounded-md shadow-xl py-1 max-h-64 overflow-y-auto">
          {availableFields.map(f => (
            <div key={f.key} onClick={() => { onAdd(f.key); setOpen(false); }}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-primary hover:text-primary-foreground rounded-sm mx-1">
              {f.label}
            </div>
          ))}
          {availableFields.length > 0 && <div className="my-1 border-t border-border/40" />}
          <div onClick={() => { onAddCustom(); setOpen(false); }}
            className="px-3 py-2 text-sm cursor-pointer hover:bg-primary hover:text-primary-foreground rounded-sm mx-1 italic text-muted-foreground">
            + Custom field…
          </div>
        </div>
      )}
    </div>
  );
}

// ── General Info panel (expanded body) ────────────────────────────────────────
// Fixed fields: shown by default, removable (tracked in _removed_fields)
// Extra fields: hidden by default, addable (tracked in _added_fields)
function GeneralInfo({ tool, onUpdate, typeValue }) {
  const set = (k) => (v) => onUpdate({ ...tool, [k]: v });
  const isMill = tool.tool_kind === "Mill";
  const isHoleMakingType = isHoleMakingOrTap(typeValue);

  // _removed_fields: fixed fields the user has hidden
  const removed = tool._removed_fields || [];
  const isFixedVisible = (k) => !removed.includes(k);
  const removeFixed = (k) => onUpdate({ ...tool, _removed_fields: [...removed, k] });
  const restoreFixed = (k) => onUpdate({ ...tool, _removed_fields: removed.filter(x => x !== k) });

  // _added_fields: extra fields the user has explicitly added
  const added = tool._added_fields || [];
  const isExtraVisible = (k) => added.includes(k);
  const addExtra = (k) => onUpdate({ ...tool, _added_fields: [...added, k] });
  const removeExtra = (k) => onUpdate({ ...tool, _added_fields: added.filter(x => x !== k) });

  // Fixed fields (shown by default, removable)
  const fixedFields = [
    { key: "insert", label: "Insert", show: !isMill },
    { key: "holder", label: "Holder", show: true },
    { key: "direction", label: "Direction", show: true },
    { key: "orientation", label: "Orientation", show: !isMill },
    { key: "stickout", label: "Stickout", show: true },
    { key: "tool_block", label: "Tool Block", show: tool.tool_kind === "Turn" && !isHoleMakingType },
  ].filter(f => f.show);

  // Extra fields (hidden by default, addable per tool type)
  const extraFieldDefs = [
    ...(typeValue === "Thread" ? [{ key: "angle", label: "Angle" }, { key: "pitch", label: "Pitch" }] : []),
    ...(typeValue === "Profile" ? [{ key: "relief_angle", label: "Relief Angle" }, { key: "reach", label: "Reach" }] : []),
    ...(!isMill && !isHoleMakingType ? [{ key: "sleeve_shim", label: "Sleeve/Shim" }] : []),
    ...(isHoleMakingType ? [{ key: "tool", label: "Tool" }, { key: "sleeve", label: "Sleeve" }] : []),
    ...(isTap(typeValue) ? [{ key: "tap_type", label: "Tap Type" }, { key: "chamfer_r", label: "Chamfer x R" }] : []),
    ...(isMill && !isHoleMakingType ? [{ key: "num_flutes", label: "# Flutes" }, { key: "flute_length", label: "Flute Length" }] : []),
    ...(typeValue === "Mill – Thread Mills" ? [{ key: "neck_dia", label: "Neck Dia" }, { key: "max_depth", label: "Max Depth" }] : []),
    { key: "material", label: "Material" },
    { key: "name", label: "Name/Description" },
  ];

  // Build add-field menu options
  const availableToAdd = [
    ...fixedFields.filter(f => !isFixedVisible(f.key)).map(f => ({ key: f.key, label: f.label, isFixed: true })),
    ...extraFieldDefs.filter(f => !isExtraVisible(f.key)).map(f => ({ key: f.key, label: f.label, isFixed: false })),
  ];

  const customFields = tool.custom_fields || [];
  const addCustomField = () => onUpdate({ ...tool, custom_fields: [...customFields, { key: "", value: "" }] });
  const removeCustomField = (i) => onUpdate({ ...tool, custom_fields: customFields.filter((_, idx) => idx !== i) });
  const updateCustomField = (i, k, v) => {
    const updated = [...customFields];
    updated[i] = { ...updated[i], [k]: v };
    onUpdate({ ...tool, custom_fields: updated });
  };

  const handleAdd = (k, isFixed) => {
    if (isFixed) restoreFixed(k);
    else addExtra(k);
  };

  function renderExtraField(f) {
    return (
      <RemovableField key={f.key} fieldKey={f.key} onRemove={removeExtra}>
        <F label={f.label}>
          {f.key === "tap_type" && <SmallSelect value={tool.tap_type} onChange={set("tap_type")} options={TAP_TYPE_OPTIONS} className="w-24" />}
          {f.key === "material" && <SmallInput value={tool.material} onChange={set("material")} className="w-24" />}
          {f.key === "name" && <SmallInput value={tool.name} onChange={set("name")} className="w-32" />}
          {f.key === "angle" && <SmallInput value={tool.angle} onChange={set("angle")} className="w-20" />}
          {f.key === "pitch" && <SmallInput value={tool.pitch} onChange={set("pitch")} className="w-20" />}
          {f.key === "relief_angle" && <SmallInput value={tool.relief_angle} onChange={set("relief_angle")} className="w-24" />}
          {f.key === "reach" && <SmallInput value={tool.reach} onChange={set("reach")} className="w-20" />}
          {f.key === "sleeve_shim" && <SmallInput value={tool.sleeve_shim} onChange={set("sleeve_shim")} className="w-24" />}
          {f.key === "sleeve" && <SmallInput value={tool.sleeve} onChange={set("sleeve")} className="w-24" />}
          {f.key === "tool" && <SmallInput value={tool.tool} onChange={set("tool")} className="w-24" />}
          {f.key === "chamfer_r" && <SmallInput value={tool.chamfer_r} onChange={set("chamfer_r")} className="w-24" />}
          {f.key === "num_flutes" && <SmallInput value={tool.num_flutes} onChange={set("num_flutes")} className="w-20" />}
          {f.key === "flute_length" && <SmallInput value={tool.flute_length} onChange={set("flute_length")} className="w-24" />}
          {f.key === "neck_dia" && <SmallInput value={tool.neck_dia} onChange={set("neck_dia")} className="w-20" />}
          {f.key === "max_depth" && <SmallInput value={tool.max_depth} onChange={set("max_depth")} className="w-24" />}
        </F>
      </RemovableField>
    );
  }

  return (
    <div className="px-4 py-3 bg-background border-t border-border/30">
      <div className="flex flex-wrap gap-x-3 gap-y-2 mb-3">
        {/* Fixed removable fields */}
        {fixedFields.map(f => {
          if (!isFixedVisible(f.key)) return null;
          return (
            <RemovableField key={f.key} fieldKey={f.key} onRemove={removeFixed}>
              <F label={f.label}>
                {f.key === "insert" && <SmallInput value={tool.insert} onChange={set("insert")} className="w-28" />}
                {f.key === "holder" && (
                  isMill
                    ? <SmallInput value={tool.holder} onChange={set("holder")} className="w-32" />
                    : <SmallSelect value={tool.holder} onChange={set("holder")} options={HOLDER_TURN_OPTIONS} allowOther className="w-48" placeholder="Select…" />
                )}
                {f.key === "direction" && (
                  isMill
                    ? <SmallSelect value={tool.direction} onChange={set("direction")} options={ENDMILL_DIR_OPTIONS} className="w-20" />
                    : <SmallSelect value={tool.spindle} onChange={set("spindle")} options={DIRECTION_OPTIONS} className="w-28" />
                )}
                {f.key === "orientation" && (
                  <SmallSelect value={tool.rotation} onChange={set("rotation")} options={ORIENTATION_OPTIONS} className="w-28" />
                )}
                {f.key === "stickout" && <SmallInput value={tool.stickout} onChange={set("stickout")} className="w-24" />}
                {f.key === "tool_block" && (
                  <SmallSelect value={tool.od_id_face} onChange={set("od_id_face")} options={TOOL_BLOCK_OPTIONS} className="w-36" placeholder="Select…" />
                )}
              </F>
            </RemovableField>
          );
        })}

        {/* Extra added fields */}
        {extraFieldDefs.filter(f => isExtraVisible(f.key)).map(f => renderExtraField(f))}

        {/* Custom fields */}
        {customFields.map((cf, i) => (
          <div key={i} className="relative group flex flex-col">
            <Input value={cf.key} onChange={(e) => updateCustomField(i, "key", e.target.value)}
              placeholder="Field name" className="h-6 text-[10px] bg-background border-border/60 w-28 mb-0.5 uppercase tracking-wide" />
            <Input value={cf.value} onChange={(e) => updateCustomField(i, "value", e.target.value)}
              placeholder="Value" className="h-7 text-xs bg-background border-border/60 w-28" />
            <button type="button" onClick={() => removeCustomField(i)}
              className="absolute -top-1.5 -right-1.5 hidden group-hover:flex items-center justify-center w-4 h-4 bg-destructive text-destructive-foreground rounded-full z-10">
              <X className="w-2.5 h-2.5" />
            </button>
          </div>
        ))}
      </div>

      <AddFieldMenu
        availableFields={availableToAdd}
        onAdd={(k) => {
          const def = availableToAdd.find(f => f.key === k);
          handleAdd(k, def?.isFixed ?? false);
        }}
        onAddCustom={addCustomField}
      />
    </div>
  );
}

// ── Add Tool dropdown ──────────────────────────────────────────────────────────
function AddToolButton({ onAdd }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" tabIndex={-1} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}>
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen(o => !o)} className="h-7 text-xs gap-1">
        + Add Tool
        <ChevronDown className="w-3 h-3" />
      </Button>
      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 w-28 bg-popover border border-border rounded-md shadow-lg py-1">
          {["Turn", "Mill"].map(k => (
            <div key={k} onClick={() => { onAdd(k); setOpen(false); }}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-primary hover:text-primary-foreground rounded-sm mx-1">
              {k}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export { AddToolButton };

// ── Main ToolRow ──────────────────────────────────────────────────────────────
export default function ToolRow({ tool, onUpdate, onRemove }) {
  const [expanded, setExpanded] = useState(true);
  const set = (k) => (v) => onUpdate({ ...tool, [k]: v });

  const typeValue = tool.tool_type || "";
  const showWidth = isGroove(typeValue);
  const showDia = isHoleMakingOrTap(typeValue);
  // Show Rad in header for turn tools that aren't groove/holemaking
  const showRad = tool.tool_kind === "Turn" && !showWidth && !showDia && typeValue && typeValue !== "Thread";
  // Show Deg in header for relevant turn types
  const showDeg = tool.tool_kind === "Turn" && !showWidth && typeValue;

  const handleTypeChange = (val) => {
    onUpdate({ ...tool, tool_type: val });
  };

  return (
    <div className="border border-border/40 rounded-lg mb-2">
      {/* ── Header row ── */}
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/20 hover:bg-muted/30 transition-colors flex-wrap">
        <button type="button" onClick={() => setExpanded(e => !e)} className="text-muted-foreground hover:text-foreground shrink-0">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {/* T# */}
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-xs text-muted-foreground font-mono">T#</span>
          <Input value={tool.tool_number || ""} onChange={(e) => set("tool_number")(e.target.value)}
            placeholder="#" className="h-7 w-10 text-xs bg-background border-border/60 px-1.5 text-center font-mono" />
        </div>

        {/* Kind badge */}
        {tool.tool_kind && (
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${tool.tool_kind === "Mill" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>
            {tool.tool_kind}
          </span>
        )}

        {/* Type dropdown */}
        <div className="w-36 shrink-0">
          <ToolTypeDropdown toolKind={tool.tool_kind} value={typeValue} onChange={handleTypeChange} />
        </div>

        {/* Rad */}
        {showRad && (
          <div className="shrink-0 flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Rad</span>
            <SmallSelect value={tool.rad} onChange={set("rad")} options={RAD_OPTIONS} allowOther className="w-20" />
          </div>
        )}

        {/* Width */}
        {showWidth && (
          <div className="shrink-0 flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Width</span>
            <SmallSelect value={tool.width} onChange={set("width")} options={WIDTH_OPTIONS} allowOther className="w-32" />
          </div>
        )}

        {/* Dia */}
        {showDia && (
          <div className="shrink-0 flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Dia.</span>
            <SmallInput value={tool.dia} onChange={set("dia")} placeholder="0.000" className="w-16" />
          </div>
        )}

        {/* Deg */}
        {showDeg && (
          <div className="shrink-0 flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Deg</span>
            <SmallSelect value={tool.deg} onChange={set("deg")} options={DEG_TURN_OPTIONS} allowOther className="w-20" />
          </div>
        )}

        <Button type="button" size="icon" variant="ghost" onClick={onRemove}
          className="h-7 w-7 ml-auto text-destructive hover:text-destructive shrink-0">
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* ── Expanded: General Information ── */}
      {expanded && typeValue && (
        <GeneralInfo tool={tool} onUpdate={onUpdate} typeValue={typeValue} />
      )}
    </div>
  );
}