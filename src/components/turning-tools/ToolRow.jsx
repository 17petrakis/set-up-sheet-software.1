import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, ChevronDown, ChevronRight, Plus, X, Pencil, RotateCcw } from "lucide-react";

import ToolTypeDropdown, { isHoleMaking } from "./ToolTypeDropdown";
import TurningToolEditModal from "./TurningToolEditModal";
import AutoResizeTextarea from "@/components/ui/AutoResizeTextarea";

// ── Inline options ─────────────────────────────────────────────────────────────
const RAD_OPTIONS = [".031", ".016", ".008", ".006", "0"];
const DEG_TURN_OPTIONS = ["100", "80", "55", "35"];
const WIDTH_OPTIONS = [".158 (4mm)", ".156 (5/32)", ".125 (1/8)", ".088", ".094 (3/32)", ".118 (3mm)", ".079 (2mm)", ".0625 (1/16)", ".059 (1.5mm)", ".047 (3/64)", ".031 (1/32)"];
const DIRECTION_OPTIONS = ["Main (S1)", "Sub (S2)"];
const ORIENTATION_OPTIONS = ["UP", "DOWN"];
const HOLDER_TURN_OPTIONS = ["DCLNR 16 4C (RH)", "DCLNL 16 4C (LH)", "DCKNR 16 4C KC3 (FACE)"];
const TOOL_BLOCK_OPTIONS = ["Turn OD", "Bore OD", "Part off OD", "Axial Face"];
const TAP_TYPE_OPTIONS = ["Form", "SF", "SP", "Hard"];
const ENDMILL_DIR_OPTIONS = ["X", "Z-", "Z+"];
const HOLDER_COLLET_OPTIONS = ["ER25x1", "ER32x1", "ER16x3/4", "ER11x5/8", "DA"];
const COOLANT_OPTIONS = ["No coolant", "From outside", "Thru collet", "Thru tool"];
const EXTENSION_OPTIONS = ["ER11-ER25", "ER11-5/8x4", "ER25 + ER11-5/8x4", "ER25 + ER11-ER25", "Arbor", "5/8 Weldon"];
const EXTENSION_MILL_OPTIONS = ["ER25", "ER11-ER25", "ER11-5/8x4", "ER25 + ER11-5/8x4", "ER25 + ER11-ER25", "Arbor", "5/8 Weldon"];
const ANGLE_DRILL_OPTIONS = ["118", "135", "180"];
const ANGLE_SPOT_OPTIONS = ["82", "90", "100"];
const MILL_CHAMFER_ANGLE_OPTIONS = ["90", "60", "45", "30"];
const MILL_DIA_TYPES = [
  "Mill Endmill – SQ.", "Mill Endmill – Radius", "Mill Endmill – Chamfer",
  "Mill – Chamfer Mills", "Mill – Engraving", "Mill – Thread Mills",
  "Mill – Lollipop", "Mill – T-Slot",
];

// Whether a type uses Width instead of Deg in the header
function isGroove(typeValue) { return typeValue === "Groove/Part"; }
function isTap(typeValue) { return typeValue === "Hole Making – Tap" || typeValue === "Mill Hole Making – Tap"; }
function isHoleMakingOrTap(typeValue) { return isHoleMaking(typeValue) || isTap(typeValue); }
function isDrill(typeValue) {
  if (!typeValue) return false;
  return typeValue.startsWith("Drill – ") || typeValue === "Mill Hole Making – Drill";
}
function isSpotOrCsk(typeValue) {
  return ["Hole Making – Spot Drill", "Hole Making – Countersink",
    "Mill Hole Making – Spot Drill", "Mill Hole Making – Countersink"].includes(typeValue);
}
function isInsertDrill(typeValue) { return typeValue === "Drill – Insert"; }

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

function SmallSelect({ value, onChange, options, placeholder = "—", className = "w-20", allowOther = true }) {
  const [forcedOther, setForcedOther] = useState(false);
  const normalizedOptions = options.map(opt => (typeof opt === "string" ? { value: opt, label: opt } : opt));
  const isInOptions = normalizedOptions.some(o => o.value === value);
  const showCustom = allowOther && (forcedOther || (!!value && !isInOptions));

  if (showCustom) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <Input
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Custom…"
          className="h-7 text-xs px-1.5 flex-1 min-w-0"
        />
        <button
          type="button"
          onClick={() => { setForcedOther(false); onChange(""); }}
          className="text-muted-foreground hover:text-foreground p-0.5 shrink-0"
          title="Back to list"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <Select value={value || undefined} onValueChange={(v) => {
      if (v === "__other__") {
        setForcedOther(true);
        onChange("");
      } else {
        onChange(v);
      }
    }}>
      <SelectTrigger className={`h-7 text-xs px-1.5 ${className}`}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {normalizedOptions.map(opt => (
          <SelectItem key={opt.value} value={opt.value} className="text-xs">{opt.label}</SelectItem>
        ))}
        {allowOther && <SelectItem value="__other__" className="text-xs italic text-muted-foreground">Other…</SelectItem>}
      </SelectContent>
    </Select>
  );
}

// ── Stackable Extension (multiple entries) ─────────────────────────────────────
function StackableExtension({ value, onChange, options }) {
  const items = Array.isArray(value) ? value : [];
  const update = (i, val) => { const u = [...items]; u[i] = val; onChange(u); };
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, ""]);
  return (
    <div className="flex flex-col gap-1">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-1">
          <SmallSelect value={item} onChange={(v) => update(i, v)} options={options} className="w-36" />
          <button type="button" onClick={() => remove(i)} className="text-destructive hover:text-destructive/80 p-0.5">
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
      <button type="button" onClick={add} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground w-fit">
        <Plus className="w-3 h-3" /> Add
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

// ── General Info panel (expanded body) ────────────────────────────────────────
// Fixed fields: shown by default, removable (tracked in _removed_fields)
// Extra fields: hidden by default, addable (tracked in _added_fields)
function GeneralInfo({ tool, onUpdate, typeValue, onEditFields }) {
  const set = (k) => (v) => onUpdate({ ...tool, [k]: v });
  const isMill = tool.tool_kind === "Mill";
  const isHoleMakingType = isHoleMakingOrTap(typeValue);

  // _removed_fields: fixed fields the user has hidden
  const removed = tool._removed_fields || [];
  const isFixedVisible = (k) => !removed.includes(k);

  // _added_fields: extra fields the user has explicitly added
  const added = tool._added_fields || [];
  const isExtraVisible = (k) => added.includes(k);

  // Fixed fields (shown by default, removable)
  const fixedFields = [
    { key: "insert", label: "Insert", show: false },
    { key: "holder", label: "Holder", show: true },
    { key: "direction", label: "Direction", show: true },
    { key: "orientation", label: "Orientation", show: !isMill },
    { key: "stickout", label: (isHoleMakingType || isMill) ? "Stickout (from holder)" : "Stickout", show: true },
  ].filter(f => f.show);

  // Extra fields (hidden by default, addable per tool type)
  const extraFieldDefs = isMill ? [
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
  ] : [
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

  const customFields = tool.custom_fields || [];
  const updateCustomField = (i, k, v) => {
    const updated = [...customFields];
    updated[i] = { ...updated[i], [k]: v };
    onUpdate({ ...tool, custom_fields: updated });
  };

  function renderExtraField(f) {
    return (
      <F key={f.key} label={f.label}>
          {f.key === "tap_type" && <SmallSelect value={tool.tap_type} onChange={set("tap_type")} options={TAP_TYPE_OPTIONS} className="w-24" />}
          {f.key === "material" && <SmallInput value={tool.material} onChange={set("material")} className="w-24" />}
          {f.key === "name" && <SmallInput value={tool.name} onChange={set("name")} className="w-32" />}
          {f.key === "angle" && <SmallInput value={tool.angle} onChange={set("angle")} className="w-20" />}
          {f.key === "pitch" && <SmallInput value={tool.pitch} onChange={set("pitch")} className="w-20" />}
          {f.key === "relief_angle" && <SmallInput value={tool.relief_angle} onChange={set("relief_angle")} className="w-24" />}
          {f.key === "reach" && <SmallInput value={tool.reach} onChange={set("reach")} className="w-20" />}
          {f.key === "sleeve_shim" && <SmallInput value={tool.sleeve_shim} onChange={set("sleeve_shim")} className="w-24" />}
          {f.key === "sleeve" && <SmallInput value={tool.sleeve} onChange={set("sleeve")} className="w-24" />}
          {f.key === "chamfer_r" && <SmallInput value={tool.chamfer_r} onChange={set("chamfer_r")} className="w-24" />}
          {f.key === "num_flutes" && <SmallInput value={tool.num_flutes} onChange={set("num_flutes")} className="w-20" />}
          {f.key === "flute_length" && <SmallInput value={tool.flute_length} onChange={set("flute_length")} className="w-24" />}
          {f.key === "neck_dia" && <SmallInput value={tool.neck_dia} onChange={set("neck_dia")} className="w-20" />}
          {f.key === "max_depth" && <SmallInput value={tool.max_depth} onChange={set("max_depth")} className="w-24" />}
          {f.key === "holder_collet" && <SmallSelect value={tool.holder_collet} onChange={set("holder_collet")} options={HOLDER_COLLET_OPTIONS} className="w-32" />}
          {f.key === "oal" && <SmallInput value={tool.oal} onChange={set("oal")} className="w-20" />}
          {f.key === "shank_dia" && <SmallInput value={tool.shank_dia} onChange={set("shank_dia")} className="w-20" />}
          {f.key === "tip_dia" && <SmallInput value={tool.tip_dia} onChange={set("tip_dia")} className="w-20" />}
          {f.key === "coolant" && (
            <SmallSelect value={tool.coolant} onChange={set("coolant")} options={COOLANT_OPTIONS} className="w-28" />
          )}
          {f.key === "extension" && (
            isMill
              ? <StackableExtension value={tool.extensions} onChange={set("extensions")} options={EXTENSION_MILL_OPTIONS} />
              : <SmallSelect value={tool.extension} onChange={set("extension")} options={EXTENSION_OPTIONS} className="w-36" />
          )}
          {f.key === "insert" && <SmallInput value={tool.insert} onChange={set("insert")} className="w-28" />}
          {f.key === "chamfer_x_p" && <SmallInput value={tool.chamfer_x_p} onChange={set("chamfer_x_p")} className="w-24" />}
          {f.key === "part_number_desc" && <SmallInput value={tool.part_number_desc} onChange={set("part_number_desc")} className="w-32" />}
          {f.key === "note" && (
            <AutoResizeTextarea
              value={tool.note || ""}
              onChange={(e) => set("note")(e.target.value)}
              className="text-xs min-h-[28px] py-1 px-1.5 w-48"
              placeholder=""
            />
          )}
        </F>
    );
  }

  return (
    <div className="px-4 py-3 bg-background border-t border-border/30">
      <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
        {/* Fixed fields */}
        {fixedFields.map(f => {
          if (!isFixedVisible(f.key)) return null;
          return (
            <F key={f.key} label={f.label}>
              {f.key === "insert" && <SmallInput value={tool.insert} onChange={set("insert")} className="w-28" />}
              {f.key === "holder" && (
                isMill
                  ? <SmallInput value={tool.holder} onChange={set("holder")} className="w-32" />
                  : <SmallSelect value={tool.holder} onChange={set("holder")} options={HOLDER_TURN_OPTIONS} className="w-48" placeholder="Select…" />
              )}
              {f.key === "direction" && (
                isMill
                  ? <SmallSelect value={tool.direction} onChange={set("direction")} options={ENDMILL_DIR_OPTIONS} className="w-20" />
                  : <SmallSelect value={tool.spindle} onChange={set("spindle")} options={DIRECTION_OPTIONS} className="w-28" />
              )}
              {f.key === "orientation" && (
                <SmallSelect value={tool.rotation} onChange={set("rotation")} options={ORIENTATION_OPTIONS} className="w-28" />
              )}
              {f.key === "stickout" && <SmallInput value={tool.stickout} onChange={set("stickout")} className={isHoleMakingType || isMill ? "w-36" : "w-24"} />}
            </F>
          );
        })}

        {/* Extra fields */}
        {extraFieldDefs.filter(f => isExtraVisible(f.key)).map(f => renderExtraField(f))}

        {/* Custom fields */}
        {customFields.map((cf, i) => (
          <div key={i} className="flex flex-col">
            <Input value={cf.key} onChange={(e) => updateCustomField(i, "key", e.target.value)}
              placeholder="Field name" className="h-6 text-[10px] bg-background border-border/60 w-28 mb-0.5 uppercase tracking-wide" />
            <Input value={cf.value} onChange={(e) => updateCustomField(i, "value", e.target.value)}
              placeholder="Value" className="h-7 text-xs bg-background border-border/60 w-28" />
          </div>
        ))}

        {/* Edit fields (pencil) */}
        <button type="button" onClick={onEditFields}
          className="mt-5 p-1.5 text-muted-foreground hover:text-foreground transition-colors shrink-0"
          title="Add/Remove fields">
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Add Tool buttons ───────────────────────────────────────────────────────────
function AddToolButton({ onAdd }) {
  return (
    <div className="flex items-center gap-1.5">
      <Button type="button" size="sm" variant="outline" onClick={() => onAdd("Turn")} className="h-7 text-xs gap-1">
        + Turning Tool
      </Button>
      <Button type="button" size="sm" variant="outline" onClick={() => onAdd("Mill")} className="h-7 text-xs gap-1">
        + Milling Tool
      </Button>
    </div>
  );
}

export { AddToolButton };

// ── Main ToolRow ──────────────────────────────────────────────────────────────
export default function ToolRow({ tool, onUpdate, onRemove }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const set = (k) => (v) => onUpdate({ ...tool, [k]: v });

  const typeValue = tool.tool_type || "";
  const isMillTool = tool.tool_kind === "Mill";
  const showWidth = isGroove(typeValue) || typeValue === "Mill – T-Slot";
  const showDia = isHoleMakingOrTap(typeValue) || MILL_DIA_TYPES.includes(typeValue);
  // Show Rad in header for turn tools that aren't holemaking, and Mill Radius endmills
  const showRad = (tool.tool_kind === "Turn" && !showDia && typeValue) || typeValue === "Mill Endmill – Radius" || typeValue === "Mill Endmill – Ball";
  // Show Chmf for Mill Chamfer endmills
  const showMillChmf = typeValue === "Mill Endmill – Chamfer";
  // Show Deg in header for relevant turn types (not Thread or Profile)
  const showDeg = tool.tool_kind === "Turn" && !showWidth && typeValue && typeValue !== "Thread" && typeValue !== "Profile" && !isHoleMakingOrTap(typeValue);
  const showAngle = isDrill(typeValue) || isSpotOrCsk(typeValue) ||
    typeValue === "Mill – Chamfer Mills" || typeValue === "Mill – Engraving";
  const angleOptions = isSpotOrCsk(typeValue) ? ANGLE_SPOT_OPTIONS :
    (isDrill(typeValue) ? ANGLE_DRILL_OPTIONS : MILL_CHAMFER_ANGLE_OPTIONS);
  // Show Reach for Profile tools and Mill Thread Mills / Lollipop
  const showReach = (tool.tool_kind === "Turn" && typeValue === "Profile") ||
    typeValue === "Mill – Thread Mills" || typeValue === "Mill – Lollipop";
  // Show Pitch for Thread tools and Mill Thread Mills
  const showPitch = (tool.tool_kind === "Turn" && (typeValue === "Thread" || isTap(typeValue))) ||
    typeValue === "Mill – Thread Mills";
  const showTapType = isTap(typeValue);
  const showOdIdBox = typeValue && ((tool.tool_kind === "Turn" && !isHoleMakingOrTap(typeValue)) || isMillTool);
  const odIdOptions = isMillTool ? ["Axial", "Radial"] : ["OD", "ID"];
  // Mill Name/Tool field: show for all mill types except Thread Mills
  const millShowNameField = isMillTool && typeValue && typeValue !== "Mill – Thread Mills";
  const millIsHoleMakingNonTap = isMillTool && isHoleMakingOrTap(typeValue) && !isTap(typeValue);

  const handleTypeChange = (val) => {
    const updates = { tool_type: val };
    if (val === "Drill – Center") updates.angle = "60";
    else if (isSpotOrCsk(val)) updates.angle = "180";
    onUpdate({ ...tool, ...updates });
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

        {/* Dia */}
        {showDia && (
          <div className="shrink-0 flex items-center gap-1 ml-4">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Dia.</span>
            <SmallInput value={tool.dia} onChange={set("dia")} placeholder="0.000" className="w-16" />
          </div>
        )}

        {/* Rad */}
        {showRad && (
          <div className="shrink-0 flex items-center gap-1 ml-4">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Rad</span>
            <SmallSelect value={tool.rad} onChange={set("rad")} options={RAD_OPTIONS} className="w-14" />
          </div>
        )}

        {/* Chmf (Mill Chamfer endmill) */}
        {showMillChmf && (
          <div className="shrink-0 flex items-center gap-1 ml-4">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Chmf.</span>
            <SmallInput value={tool.chmf} onChange={set("chmf")} placeholder="" className="w-16" />
          </div>
        )}

        {/* Width */}
        {showWidth && (
          <div className="shrink-0 flex items-center gap-1 ml-4">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Width</span>
            <SmallSelect value={tool.width} onChange={set("width")} options={WIDTH_OPTIONS} className="w-24" />
          </div>
        )}

        {/* Deg */}
        {showDeg && (
          <div className={`shrink-0 flex items-center gap-1 ${!showRad && !showWidth && !showDia ? "ml-4" : ""}`}>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Deg</span>
            <SmallSelect value={tool.deg} onChange={set("deg")} options={DEG_TURN_OPTIONS} className="w-14" />
          </div>
        )}

        {/* Angle (Holemaking drills & spot/countersink) */}
        {showAngle && (
          <div className="shrink-0 flex items-center gap-1 ml-4">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Angle</span>
            <SmallSelect value={tool.angle} onChange={set("angle")} options={angleOptions} className="w-14" />
          </div>
        )}

        {/* Reach (Profile only) */}
        {showReach && (
          <div className="shrink-0 flex items-center gap-1 ml-4">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Reach</span>
            <SmallInput value={tool.reach} onChange={set("reach")} placeholder="" className="w-16" />
          </div>
        )}

        {/* Pitch (Thread & Tap) */}
        {showPitch && (
          <div className="shrink-0 flex items-center gap-1 ml-4">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Pitch</span>
            <SmallInput value={tool.pitch} onChange={set("pitch")} placeholder="" className="w-16" />
          </div>
        )}

        {/* Tap Typ (Tap only) */}
        {showTapType && (
          <div className="shrink-0 flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Typ</span>
            <SmallSelect value={tool.tap_type} onChange={set("tap_type")} options={TAP_TYPE_OPTIONS} className="w-20" />
          </div>
        )}

        {/* Insert/Tool/Name (Turn only, in header) */}
        {tool.tool_kind === "Turn" && typeValue && (
          <div className="flex-1 flex items-center gap-1 min-w-0">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider shrink-0">{isTap(typeValue) ? "Name" : isHoleMakingOrTap(typeValue) && !isInsertDrill(typeValue) ? "Tool" : "Insert"}</span>
            <SmallInput value={isTap(typeValue) ? tool.name : tool.insert} onChange={isTap(typeValue) ? set("name") : set("insert")} className="flex-1 w-full min-w-0" />
          </div>
        )}

        {/* Name/Tool (Mill, in header) */}
        {millShowNameField && (
          <div className="flex-1 flex items-center gap-1 min-w-0">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider shrink-0">{millIsHoleMakingNonTap ? "Tool" : "Name"}</span>
            <SmallInput value={millIsHoleMakingNonTap ? tool.insert : tool.name} onChange={millIsHoleMakingNonTap ? set("insert") : set("name")} className="flex-1 w-full min-w-0" />
          </div>
        )}

        {showOdIdBox && (
          <div className="ml-auto shrink-0">
            <SmallSelect
              value={tool.od_id}
              onChange={set("od_id")}
              options={odIdOptions}
              placeholder={tool.tool_kind === "Mill" ? "Axl/Rad" : "OD/ID"}
              className="w-20"
            />
          </div>
        )}
        <Button type="button" size="icon" variant="ghost" onClick={onRemove}
          className={`h-7 w-7 text-destructive hover:text-destructive shrink-0 ${showOdIdBox ? "" : "ml-auto"}`}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* ── Expanded: General Information ── */}
      {expanded && typeValue && (
        <GeneralInfo tool={tool} onUpdate={onUpdate} typeValue={typeValue} onEditFields={() => setEditing(true)} />
      )}

      {editing && (
        <TurningToolEditModal
          tool={tool}
          onUpdate={onUpdate}
          onClose={() => setEditing(false)}
          typeValue={tool.tool_type || ""}
        />
      )}
    </div>
  );
}