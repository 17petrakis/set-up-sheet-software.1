import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronRight, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Helpers ────────────────────────────────────────────────────────────────────
function F({ label, children, className = "" }) {
  return (
    <div className={className}>
      <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1 block">{label}</Label>
      {children}
    </div>
  );
}

function FInput({ label, value, onChange, placeholder = "", className = "" }) {
  return (
    <F label={label} className={className}>
      <Input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="h-8 text-xs bg-background border-border/60" />
    </F>
  );
}

function FSelect({ label, value, onChange, options, placeholder = "Select…", className = "", allowOther = false }) {
  const [showOther, setShowOther] = useState(false);
  const [otherVal, setOtherVal] = useState("");

  if (allowOther && showOther) {
    return (
      <F label={label} className={className}>
        <div className="flex gap-1">
          <Input value={otherVal} onChange={(e) => { setOtherVal(e.target.value); onChange(e.target.value); }}
            placeholder="Enter value" className="h-8 text-xs bg-background border-border/60" />
          <button type="button" onClick={() => { setShowOther(false); onChange(""); }}
            className="shrink-0 px-2 text-xs text-muted-foreground hover:text-foreground border border-border/60 rounded-md bg-background">↩</button>
        </div>
      </F>
    );
  }

  return (
    <F label={label} className={className}>
      <Select value={value || ""} onValueChange={(v) => {
        if (v === "__other__") { setShowOther(true); onChange(""); }
        else onChange(v);
      }}>
        <SelectTrigger className="h-8 text-xs bg-background border-border/60">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map(o => <SelectItem key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</SelectItem>)}
          {allowOther && <SelectItem value="__other__">Other…</SelectItem>}
        </SelectContent>
      </Select>
    </F>
  );
}

// ── Dropdown data ──────────────────────────────────────────────────────────────
const RAD_OPTIONS = [".031", ".016", ".008", ".006", "0"];
const DEG_TURN_OPTIONS = ["100", "80", "55", "35"];
const DIRECTION_OPTIONS = ["Main (S1)", "Sub (S2)"];
const ORIENTATION_OPTIONS = ["UP", "DOWN"];
const HOLDER_TURN_OPTIONS = ["DCLNR 16 4C (RH)", "DCLNL 16 4C (LH)", "DCKNR 16 4C KC3 (FACE)"];
const WIDTH_OPTIONS = [".158 (4mm)", ".156 (5/32)", ".125 (⅛)", ".088", ".094 (3/32)", ".118 (3mm)", ".079 (2mm)", ".0625 (1/16)", ".059 (1.5mm)", ".047 (3/64)", ".031 (1/32)"];
const ENDMILL_DIRECTION_OPTIONS = ["X", "Z-", "Z+"];
const TAP_TYPE_OPTIONS = ["Form", "SF", "SP", "Hard"];

// ── Removable/Addable field system ─────────────────────────────────────────────
// permanentKeys are always shown; all others are removable/addable
function RemovableField({ fieldKey, label, children, onRemove }) {
  return (
    <div className="relative group">
      {children}
      <button
        type="button"
        onClick={() => onRemove(fieldKey)}
        className="absolute -top-1 -right-1 hidden group-hover:flex items-center justify-center w-4 h-4 bg-destructive text-destructive-foreground rounded-full text-[9px] z-10"
        title="Remove field"
      >
        <X className="w-2.5 h-2.5" />
      </button>
    </div>
  );
}

function AddFieldMenu({ availableFields, onAdd }) {
  const [open, setOpen] = useState(false);
  if (availableFields.length === 0) return null;
  return (
    <div className="relative" tabIndex={-1} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}>
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen(o => !o)} className="h-7 text-xs gap-1">
        <Plus className="w-3 h-3" /> Add Field
      </Button>
      {open && (
        <div className="absolute z-[500] bottom-full left-0 mb-1 w-44 bg-popover border border-border rounded-md shadow-xl py-1 max-h-60 overflow-y-auto">
          {availableFields.map(f => (
            <div key={f.key} onClick={() => { onAdd(f.key); setOpen(false); }}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-primary hover:text-primary-foreground rounded-sm mx-1">
              {f.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// useRemovedFields — manages which optional fields have been removed
function useRemovedFields(data, onChange) {
  const removed = data._removed_fields || [];
  const removeField = (key) => onChange({ ...data, _removed_fields: [...removed, key] });
  const addField = (key) => onChange({ ...data, _removed_fields: removed.filter(k => k !== key) });
  const isVisible = (key) => !removed.includes(key);
  return { removeField, addField, isVisible, removed };
}

// ── Turn Direction + Orientation (shared by all turn tool types) ──────────────
function TurnSpindleFields({ data, set, isVisible, removeField }) {
  return (
    <>
      {isVisible("spindle") && (
        <RemovableField fieldKey="spindle" onRemove={removeField}>
          <FSelect label="Direction" value={data.spindle} onChange={set("spindle")} options={DIRECTION_OPTIONS} className="w-28" />
        </RemovableField>
      )}
      {isVisible("rotation") && (
        <RemovableField fieldKey="rotation" onRemove={removeField}>
          <FSelect label="Orientation" value={data.rotation} onChange={set("rotation")} options={ORIENTATION_OPTIONS} className="w-28" />
        </RemovableField>
      )}
    </>
  );
}

// ── Threadmill type dropdown ───────────────────────────────────────────────────
function ThreadmillTypeDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [solidExp, setSolidExp] = useState(false);
  const [multiInput, setMultiInput] = useState("");

  const select = (v) => { onChange(v); setOpen(false); setSolidExp(false); };

  return (
    <div className="relative" tabIndex={-1} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) { setOpen(false); setSolidExp(false); } }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="h-8 px-2 text-xs bg-background border border-border/60 rounded-md text-left flex items-center justify-between hover:border-border focus:outline-none focus:ring-1 focus:ring-ring min-w-[120px]">
        <span className={value ? "text-foreground truncate" : "text-muted-foreground"}>{value || "Select…"}</span>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground rotate-90 shrink-0 ml-1" />
      </button>
      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 w-52 bg-popover border border-border rounded-md shadow-xl py-1">
          <div onClick={() => setSolidExp(e => !e)}
            className="flex items-center justify-between px-3 py-2 text-sm cursor-pointer rounded-sm mx-1 hover:bg-accent text-foreground">
            <span>Solid</span>
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${solidExp ? "rotate-90" : ""}`} />
          </div>
          {solidExp && (
            <div className="bg-muted/40 border-y border-border/40 py-1 mb-1">
              <div onClick={() => select("Solid – Single")}
                className="px-6 py-1.5 text-sm cursor-pointer hover:bg-primary hover:text-primary-foreground rounded-sm mx-1">Single</div>
              <div className="px-6 py-1.5 flex items-center gap-2">
                <span className="text-sm whitespace-nowrap">Multi. FL:</span>
                <Input value={multiInput} onChange={(e) => setMultiInput(e.target.value)}
                  onBlur={() => { if (multiInput) select(`Solid – Multi. FL: ${multiInput}`); }}
                  className="h-7 text-xs w-20 bg-background border-border/60" />
              </div>
            </div>
          )}
          <div onClick={() => select("Indelible")}
            className="px-3 py-2 text-sm cursor-pointer rounded-sm mx-1 hover:bg-primary hover:text-primary-foreground text-foreground">
            Indelible
          </div>
        </div>
      )}
    </div>
  );
}

// ── Determine field set ────────────────────────────────────────────────────────
function getFieldSet(typeValue) {
  if (!typeValue) return null;
  const t = typeValue;
  if (t.startsWith("Mill Endmill")) return "mill_endmill";
  if (t === "Mill – Thread Mills") return "mill_threadmill";
  if (t === "Mill Hole Making – Tap") return "mill_tap";
  if (t.includes("Mill Hole Making") || t === "Mill Hole Making – Drill") return "hole_making_mill";
  if (t === "Mill – Chamfer Mills" || t === "Mill – Lollipop" || t === "Mill – T-Slot" || t === "Mill – Engraving") return "mill_in_progress";
  if (t === "Hole Making – Tap") return "turn_tap";
  if (t.includes("Hole Making") || t.includes("Drill") || t === "Hole Making – Spot/CSK") return "hole_making_turn";
  if (t === "Turning") return "turning";
  if (t === "Groove/Part") return "groove";
  if (t === "Thread") return "thread";
  if (t === "Profile") return "profile";
  if (t.includes("Knurl") || t.includes("Form") || t.includes("Custom")) return "custom";
  return null;
}

// ── Custom/free-form fields ────────────────────────────────────────────────────
function CustomFields({ data, onChange }) {
  const fields = data.custom_fields || [];
  const addField = () => onChange({ ...data, custom_fields: [...fields, { key: "", value: "" }] });
  const removeField = (i) => onChange({ ...data, custom_fields: fields.filter((_, idx) => idx !== i) });
  const updateField = (i, k, v) => {
    const updated = [...fields];
    updated[i] = { ...updated[i], [k]: v };
    onChange({ ...data, custom_fields: updated });
  };

  return (
    <div className="space-y-2">
      {fields.map((f, i) => (
        <div key={i} className="flex gap-2 items-center">
          <Input value={f.key} onChange={(e) => updateField(i, "key", e.target.value)}
            placeholder="Field name" className="h-8 text-xs bg-background border-border/60 w-32" />
          <Input value={f.value} onChange={(e) => updateField(i, "value", e.target.value)}
            placeholder="Value" className="h-8 text-xs bg-background border-border/60 flex-1" />
          <button type="button" onClick={() => removeField(i)}
            className="text-destructive hover:text-destructive/80 p-1"><X className="w-3.5 h-3.5" /></button>
        </div>
      ))}
      <Button type="button" size="sm" variant="outline" onClick={addField} className="h-7 text-xs gap-1">
        <Plus className="w-3 h-3" /> Add Field
      </Button>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────
export default function ToolFields({ toolKind, typeValue, data, onChange }) {
  const set = (k) => (v) => onChange({ ...data, [k]: v });
  const fieldSet = getFieldSet(typeValue);
  const { removeField, addField, isVisible, removed } = useRemovedFields(data, onChange);

  if (!typeValue || !fieldSet) return null;

  if (fieldSet === "mill_in_progress") {
    return <span className="text-xs text-muted-foreground italic">(in progress)</span>;
  }

  // ── Turning ──────────────────────────────────────────────────────────────────
  if (fieldSet === "turning") {
    const allOptional = [
      { key: "rad", label: "Rad" },
      { key: "spindle", label: "Direction" },
      { key: "rotation", label: "Orientation" },
      { key: "holder", label: "Holder" },
      { key: "tool_block", label: "Tool Block" },
      { key: "stickout", label: "Stickout" },
      { key: "sleeve_shim", label: "Sleeve/Shim" },
    ];
    const available = allOptional.filter(f => !isVisible(f.key));
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-x-3 gap-y-2">
          <FSelect label="Deg" value={data.deg} onChange={set("deg")} options={DEG_TURN_OPTIONS} allowOther className="w-20" />
          <FInput label="Name" value={data.name} onChange={set("name")} className="w-32" />
          {isVisible("rad") && (
            <RemovableField fieldKey="rad" onRemove={removeField}>
              <FSelect label="Rad" value={data.rad} onChange={set("rad")} options={RAD_OPTIONS} allowOther className="w-20" />
            </RemovableField>
          )}
          {isVisible("spindle") && (
            <RemovableField fieldKey="spindle" onRemove={removeField}>
              <FSelect label="Direction" value={data.spindle} onChange={set("spindle")} options={DIRECTION_OPTIONS} className="w-28" />
            </RemovableField>
          )}
          {isVisible("rotation") && (
            <RemovableField fieldKey="rotation" onRemove={removeField}>
              <FSelect label="Orientation" value={data.rotation} onChange={set("rotation")} options={ORIENTATION_OPTIONS} className="w-28" />
            </RemovableField>
          )}
          {isVisible("holder") && (
            <RemovableField fieldKey="holder" onRemove={removeField}>
              <FSelect label="Holder" value={data.holder} onChange={set("holder")} options={HOLDER_TURN_OPTIONS} allowOther className="w-48" />
            </RemovableField>
          )}
          {isVisible("tool_block") && (
            <RemovableField fieldKey="tool_block" onRemove={removeField}>
              <FInput label="Tool Block" value={data.tool_block} onChange={set("tool_block")} className="w-24" />
            </RemovableField>
          )}
          {isVisible("stickout") && (
            <RemovableField fieldKey="stickout" onRemove={removeField}>
              <FInput label="Stickout" value={data.stickout} onChange={set("stickout")} className="w-24" />
            </RemovableField>
          )}
          {isVisible("sleeve_shim") && (
            <RemovableField fieldKey="sleeve_shim" onRemove={removeField}>
              <FInput label="Sleeve/Shim" value={data.sleeve_shim} onChange={set("sleeve_shim")} className="w-24" />
            </RemovableField>
          )}
        </div>
        <AddFieldMenu availableFields={available} onAdd={addField} />
      </div>
    );
  }

  // ── Groove/Part ───────────────────────────────────────────────────────────────
  if (fieldSet === "groove") {
    const allOptional = [
      { key: "rad", label: "Rad" },
      { key: "spindle", label: "Direction" },
      { key: "rotation", label: "Orientation" },
      { key: "insert", label: "Insert" },
      { key: "holder", label: "Holder" },
      { key: "stickout", label: "Stickout" },
    ];
    const available = allOptional.filter(f => !isVisible(f.key));
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-x-3 gap-y-2">
          <FSelect label="Width" value={data.width} onChange={set("width")} options={WIDTH_OPTIONS} allowOther className="w-32" />
          <FInput label="Name" value={data.name} onChange={set("name")} className="w-32" />
          {isVisible("rad") && (
            <RemovableField fieldKey="rad" onRemove={removeField}>
              <FSelect label="Rad" value={data.rad} onChange={set("rad")} options={RAD_OPTIONS} allowOther className="w-20" />
            </RemovableField>
          )}
          {isVisible("spindle") && (
            <RemovableField fieldKey="spindle" onRemove={removeField}>
              <FSelect label="Direction" value={data.spindle} onChange={set("spindle")} options={DIRECTION_OPTIONS} className="w-28" />
            </RemovableField>
          )}
          {isVisible("rotation") && (
            <RemovableField fieldKey="rotation" onRemove={removeField}>
              <FSelect label="Orientation" value={data.rotation} onChange={set("rotation")} options={ORIENTATION_OPTIONS} className="w-28" />
            </RemovableField>
          )}
          {isVisible("insert") && (
            <RemovableField fieldKey="insert" onRemove={removeField}>
              <FInput label="Insert" value={data.insert} onChange={set("insert")} className="w-28" />
            </RemovableField>
          )}
          {isVisible("holder") && (
            <RemovableField fieldKey="holder" onRemove={removeField}>
              <FInput label="Holder" value={data.holder} onChange={set("holder")} className="w-36" />
            </RemovableField>
          )}
          {isVisible("stickout") && (
            <RemovableField fieldKey="stickout" onRemove={removeField}>
              <FInput label="Stickout" value={data.stickout} onChange={set("stickout")} className="w-24" />
            </RemovableField>
          )}
        </div>
        <AddFieldMenu availableFields={available} onAdd={addField} />
      </div>
    );
  }

  // ── Thread ────────────────────────────────────────────────────────────────────
  if (fieldSet === "thread") {
    const allOptional = [
      { key: "spindle", label: "Direction" },
      { key: "rotation", label: "Orientation" },
      { key: "insert", label: "Insert" },
      { key: "holder", label: "Holder" },
      { key: "rad", label: "Rad" },
      { key: "angle", label: "Angle" },
      { key: "pitch", label: "Pitch" },
    ];
    const available = allOptional.filter(f => !isVisible(f.key));
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-x-3 gap-y-2">
          <FInput label="Name" value={data.name} onChange={set("name")} className="w-32" />
          {isVisible("spindle") && (
            <RemovableField fieldKey="spindle" onRemove={removeField}>
              <FSelect label="Direction" value={data.spindle} onChange={set("spindle")} options={DIRECTION_OPTIONS} className="w-28" />
            </RemovableField>
          )}
          {isVisible("rotation") && (
            <RemovableField fieldKey="rotation" onRemove={removeField}>
              <FSelect label="Orientation" value={data.rotation} onChange={set("rotation")} options={ORIENTATION_OPTIONS} className="w-28" />
            </RemovableField>
          )}
          {isVisible("insert") && (
            <RemovableField fieldKey="insert" onRemove={removeField}>
              <FInput label="Insert" value={data.insert} onChange={set("insert")} className="w-28" />
            </RemovableField>
          )}
          {isVisible("holder") && (
            <RemovableField fieldKey="holder" onRemove={removeField}>
              <FInput label="Holder" value={data.holder} onChange={set("holder")} className="w-36" />
            </RemovableField>
          )}
          {isVisible("rad") && (
            <RemovableField fieldKey="rad" onRemove={removeField}>
              <FSelect label="Rad" value={data.rad} onChange={set("rad")} options={RAD_OPTIONS} allowOther className="w-20" />
            </RemovableField>
          )}
          {isVisible("angle") && (
            <RemovableField fieldKey="angle" onRemove={removeField}>
              <FInput label="Angle" value={data.angle} onChange={set("angle")} className="w-20" />
            </RemovableField>
          )}
          {isVisible("pitch") && (
            <RemovableField fieldKey="pitch" onRemove={removeField}>
              <FInput label="Pitch" value={data.pitch} onChange={set("pitch")} className="w-20" />
            </RemovableField>
          )}
        </div>
        <AddFieldMenu availableFields={available} onAdd={addField} />
      </div>
    );
  }

  // ── Profile ───────────────────────────────────────────────────────────────────
  if (fieldSet === "profile") {
    const allOptional = [
      { key: "spindle", label: "Direction" },
      { key: "rotation", label: "Orientation" },
      { key: "insert", label: "Insert" },
      { key: "holder", label: "Holder" },
      { key: "rad", label: "Rad" },
      { key: "relief_angle", label: "Relief Angle" },
      { key: "reach", label: "Reach" },
    ];
    const available = allOptional.filter(f => !isVisible(f.key));
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-x-3 gap-y-2">
          <FInput label="Name" value={data.name} onChange={set("name")} className="w-32" />
          {isVisible("spindle") && (
            <RemovableField fieldKey="spindle" onRemove={removeField}>
              <FSelect label="Direction" value={data.spindle} onChange={set("spindle")} options={DIRECTION_OPTIONS} className="w-28" />
            </RemovableField>
          )}
          {isVisible("rotation") && (
            <RemovableField fieldKey="rotation" onRemove={removeField}>
              <FSelect label="Orientation" value={data.rotation} onChange={set("rotation")} options={ORIENTATION_OPTIONS} className="w-28" />
            </RemovableField>
          )}
          {isVisible("insert") && (
            <RemovableField fieldKey="insert" onRemove={removeField}>
              <FInput label="Insert" value={data.insert} onChange={set("insert")} className="w-28" />
            </RemovableField>
          )}
          {isVisible("holder") && (
            <RemovableField fieldKey="holder" onRemove={removeField}>
              <FInput label="Holder" value={data.holder} onChange={set("holder")} className="w-36" />
            </RemovableField>
          )}
          {isVisible("rad") && (
            <RemovableField fieldKey="rad" onRemove={removeField}>
              <FSelect label="Rad" value={data.rad} onChange={set("rad")} options={RAD_OPTIONS} allowOther className="w-20" />
            </RemovableField>
          )}
          {isVisible("relief_angle") && (
            <RemovableField fieldKey="relief_angle" onRemove={removeField}>
              <FInput label="Relief Angle" value={data.relief_angle} onChange={set("relief_angle")} className="w-24" />
            </RemovableField>
          )}
          {isVisible("reach") && (
            <RemovableField fieldKey="reach" onRemove={removeField}>
              <FInput label="Reach" value={data.reach} onChange={set("reach")} className="w-20" />
            </RemovableField>
          )}
        </div>
        <AddFieldMenu availableFields={available} onAdd={addField} />
      </div>
    );
  }

  // ── Turn Hole Making ──────────────────────────────────────────────────────────
  if (fieldSet === "hole_making_turn") {
    const allOptional = [
      { key: "spindle", label: "Direction" },
      { key: "rotation", label: "Orientation" },
      { key: "tool", label: "Tool" },
      { key: "material", label: "Material" },
      { key: "holder", label: "Holder" },
      { key: "sleeve", label: "Sleeve" },
    ];
    const available = allOptional.filter(f => !isVisible(f.key));
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-x-3 gap-y-2">
          <FInput label="Dia." value={data.dia} onChange={set("dia")} className="w-20" />
          <FSelect label="Deg" value={data.deg} onChange={set("deg")} options={DEG_TURN_OPTIONS} allowOther className="w-20" />
          <FInput label="Name" value={data.name} onChange={set("name")} className="w-32" />
          {isVisible("spindle") && (
            <RemovableField fieldKey="spindle" onRemove={removeField}>
              <FSelect label="Direction" value={data.spindle} onChange={set("spindle")} options={DIRECTION_OPTIONS} className="w-28" />
            </RemovableField>
          )}
          {isVisible("rotation") && (
            <RemovableField fieldKey="rotation" onRemove={removeField}>
              <FSelect label="Orientation" value={data.rotation} onChange={set("rotation")} options={ORIENTATION_OPTIONS} className="w-28" />
            </RemovableField>
          )}
          {isVisible("tool") && (
            <RemovableField fieldKey="tool" onRemove={removeField}>
              <FInput label="Tool" value={data.tool} onChange={set("tool")} className="w-24" />
            </RemovableField>
          )}
          {isVisible("material") && (
            <RemovableField fieldKey="material" onRemove={removeField}>
              <FInput label="Material" value={data.material} onChange={set("material")} className="w-24" />
            </RemovableField>
          )}
          {isVisible("holder") && (
            <RemovableField fieldKey="holder" onRemove={removeField}>
              <FInput label="Holder" value={data.holder} onChange={set("holder")} className="w-28" />
            </RemovableField>
          )}
          {isVisible("sleeve") && (
            <RemovableField fieldKey="sleeve" onRemove={removeField}>
              <FInput label="Sleeve" value={data.sleeve} onChange={set("sleeve")} className="w-24" />
            </RemovableField>
          )}
        </div>
        <AddFieldMenu availableFields={available} onAdd={addField} />
      </div>
    );
  }

  // ── Mill Hole Making ──────────────────────────────────────────────────────────
  if (fieldSet === "hole_making_mill") {
    const allOptional = [
      { key: "tool", label: "Tool" },
      { key: "material", label: "Material" },
      { key: "holder", label: "Holder" },
      { key: "sleeve", label: "Sleeve" },
    ];
    const available = allOptional.filter(f => !isVisible(f.key));
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-x-3 gap-y-2">
          <FInput label="Dia." value={data.dia} onChange={set("dia")} className="w-20" />
          <FSelect label="Deg" value={data.deg} onChange={set("deg")} options={DEG_TURN_OPTIONS} allowOther className="w-20" />
          <FInput label="Name" value={data.name} onChange={set("name")} className="w-32" />
          {isVisible("tool") && (
            <RemovableField fieldKey="tool" onRemove={removeField}>
              <FInput label="Tool" value={data.tool} onChange={set("tool")} className="w-24" />
            </RemovableField>
          )}
          {isVisible("material") && (
            <RemovableField fieldKey="material" onRemove={removeField}>
              <FInput label="Material" value={data.material} onChange={set("material")} className="w-24" />
            </RemovableField>
          )}
          {isVisible("holder") && (
            <RemovableField fieldKey="holder" onRemove={removeField}>
              <FInput label="Holder" value={data.holder} onChange={set("holder")} className="w-28" />
            </RemovableField>
          )}
          {isVisible("sleeve") && (
            <RemovableField fieldKey="sleeve" onRemove={removeField}>
              <FInput label="Sleeve" value={data.sleeve} onChange={set("sleeve")} className="w-24" />
            </RemovableField>
          )}
        </div>
        <AddFieldMenu availableFields={available} onAdd={addField} />
      </div>
    );
  }

  // ── Turn Tap ──────────────────────────────────────────────────────────────────
  if (fieldSet === "turn_tap" || fieldSet === "mill_tap") {
    const allOptional = [
      { key: "spindle", label: "Direction" },
      { key: "rotation", label: "Orientation" },
      { key: "material", label: "Material" },
      { key: "chamfer_r", label: "Chamfer x R" },
    ];
    const available = allOptional.filter(f => !isVisible(f.key));
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-x-3 gap-y-2">
          <FInput label="Dia." value={data.dia} onChange={set("dia")} className="w-20" />
          <FSelect label="Deg." value={data.deg} onChange={set("deg")} options={DEG_TURN_OPTIONS} allowOther className="w-20" />
          <FInput label="Name" value={data.name} onChange={set("name")} className="w-32" />
          <FSelect label="Tap Type" value={data.tap_type} onChange={set("tap_type")} options={TAP_TYPE_OPTIONS} className="w-24" />
          {isVisible("spindle") && fieldSet === "turn_tap" && (
            <RemovableField fieldKey="spindle" onRemove={removeField}>
              <FSelect label="Direction" value={data.spindle} onChange={set("spindle")} options={DIRECTION_OPTIONS} className="w-28" />
            </RemovableField>
          )}
          {isVisible("rotation") && fieldSet === "turn_tap" && (
            <RemovableField fieldKey="rotation" onRemove={removeField}>
              <FSelect label="Orientation" value={data.rotation} onChange={set("rotation")} options={ORIENTATION_OPTIONS} className="w-28" />
            </RemovableField>
          )}
          {isVisible("material") && (
            <RemovableField fieldKey="material" onRemove={removeField}>
              <FInput label="Material" value={data.material} onChange={set("material")} className="w-24" />
            </RemovableField>
          )}
          {isVisible("chamfer_r") && (
            <RemovableField fieldKey="chamfer_r" onRemove={removeField}>
              <FInput label="Chamfer x R" value={data.chamfer_r} onChange={set("chamfer_r")} className="w-24" />
            </RemovableField>
          )}
        </div>
        <AddFieldMenu availableFields={available} onAdd={addField} />
      </div>
    );
  }

  // ── Mill Endmill ──────────────────────────────────────────────────────────────
  if (fieldSet === "mill_endmill") {
    const allOptional = [
      { key: "direction", label: "Direction" },
      { key: "num_flutes", label: "# Flutes" },
      { key: "flute_length", label: "Flute Length" },
      { key: "stickout", label: "Stickout" },
      { key: "holder", label: "Holder/Ext." },
    ];
    const available = allOptional.filter(f => !isVisible(f.key));
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-x-3 gap-y-2">
          <FInput label="Dia." value={data.dia} onChange={set("dia")} className="w-20" />
          <FInput label="Name" value={data.name} onChange={set("name")} className="w-32" />
          {isVisible("direction") && (
            <RemovableField fieldKey="direction" onRemove={removeField}>
              <FSelect label="Direction" value={data.direction} onChange={set("direction")} options={ENDMILL_DIRECTION_OPTIONS} className="w-20" />
            </RemovableField>
          )}
          {isVisible("num_flutes") && (
            <RemovableField fieldKey="num_flutes" onRemove={removeField}>
              <FInput label="# Flutes" value={data.num_flutes} onChange={set("num_flutes")} className="w-20" />
            </RemovableField>
          )}
          {isVisible("flute_length") && (
            <RemovableField fieldKey="flute_length" onRemove={removeField}>
              <FInput label="Flute Length" value={data.flute_length} onChange={set("flute_length")} className="w-24" />
            </RemovableField>
          )}
          {isVisible("stickout") && (
            <RemovableField fieldKey="stickout" onRemove={removeField}>
              <FInput label="Stickout" value={data.stickout} onChange={set("stickout")} className="w-24" />
            </RemovableField>
          )}
          {isVisible("holder") && (
            <RemovableField fieldKey="holder" onRemove={removeField}>
              <FInput label="Holder/Ext." value={data.holder} onChange={set("holder")} className="w-32" />
            </RemovableField>
          )}
        </div>
        <AddFieldMenu availableFields={available} onAdd={addField} />
      </div>
    );
  }

  // ── Mill Threadmill ───────────────────────────────────────────────────────────
  if (fieldSet === "mill_threadmill") {
    const allOptional = [
      { key: "direction", label: "Direction" },
      { key: "neck_dia", label: "Neck Dia" },
      { key: "max_depth", label: "Max Depth" },
      { key: "stickout", label: "Stickout" },
      { key: "num_flutes", label: "# Flutes" },
      { key: "holder", label: "Holder/Ext." },
    ];
    const available = allOptional.filter(f => !isVisible(f.key));
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-x-3 gap-y-2">
          <FInput label="Dia." value={data.dia} onChange={set("dia")} className="w-20" />
          <F label="Name">
            <ThreadmillTypeDropdown value={data.threadmill_type} onChange={set("threadmill_type")} />
          </F>
          {isVisible("direction") && (
            <RemovableField fieldKey="direction" onRemove={removeField}>
              <FSelect label="Direction" value={data.direction} onChange={set("direction")} options={ENDMILL_DIRECTION_OPTIONS} className="w-20" />
            </RemovableField>
          )}
          {isVisible("neck_dia") && (
            <RemovableField fieldKey="neck_dia" onRemove={removeField}>
              <FInput label="Neck Dia" value={data.neck_dia} onChange={set("neck_dia")} className="w-20" />
            </RemovableField>
          )}
          {isVisible("max_depth") && (
            <RemovableField fieldKey="max_depth" onRemove={removeField}>
              <FInput label="Max Depth" value={data.max_depth} onChange={set("max_depth")} className="w-24" />
            </RemovableField>
          )}
          {isVisible("stickout") && (
            <RemovableField fieldKey="stickout" onRemove={removeField}>
              <FInput label="Stickout" value={data.stickout} onChange={set("stickout")} className="w-24" />
            </RemovableField>
          )}
          {isVisible("num_flutes") && (
            <RemovableField fieldKey="num_flutes" onRemove={removeField}>
              <FInput label="# Flutes" value={data.num_flutes} onChange={set("num_flutes")} className="w-20" />
            </RemovableField>
          )}
          {isVisible("holder") && (
            <RemovableField fieldKey="holder" onRemove={removeField}>
              <FInput label="Holder/Ext." value={data.holder} onChange={set("holder")} className="w-32" />
            </RemovableField>
          )}
        </div>
        <AddFieldMenu availableFields={available} onAdd={addField} />
      </div>
    );
  }

  // ── Custom ────────────────────────────────────────────────────────────────────
  if (fieldSet === "custom") {
    return <CustomFields data={data} onChange={onChange} />;
  }

  return null;
}