import React, { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ── Shared Hole Making sub-tree ────────────────────────────────────────────────
const HOLE_MAKING_CHILDREN = [
  {
    label: "Drill", children: [
      { label: "Carbide", value: "Drill – Carbide" },
      { label: "HSS", value: "Drill – HSS" },
      { label: "Insert", value: "Drill – Insert" },
      { label: "Ex Tip", value: "Drill – Ex Tip" },
    ]
  },
  { label: "Tap", value: "Hole Making – Tap" },
  { label: "Spot/CSK", value: "Hole Making – Spot/CSK" },
];

const OTHER_CHILDREN = [
  { label: "Knurl", value: "Other – Knurl" },
  { label: "Form", value: "Other – Form" },
  { label: "Custom", value: "Other – Custom" },
];

const TURN_OPTIONS = [
  { label: "Turning", value: "Turning" },
  { label: "Groove/Part", value: "Groove/Part" },
  { label: "Thread", value: "Thread" },
  { label: "Hole Making", children: HOLE_MAKING_CHILDREN },
  { label: "Profile", value: "Profile" },
  { label: "Other", children: OTHER_CHILDREN },
];

const MILL_OPTIONS = [
  {
    label: "Milling", children: [
      {
        label: "Endmills", children: [
          { label: "SQ.", value: "Mill Endmill – SQ." },
          { label: "Radius", value: "Mill Endmill – Radius" },
          { label: "Ball", value: "Mill Endmill – Ball" },
          { label: "Chamfer", value: "Mill Endmill – Chamfer" },
        ]
      },
      { label: "Chamfer Mills", value: "Mill – Chamfer Mills" },
      { label: "Thread Mills", value: "Mill – Thread Mills" },
      { label: "Lollipop", value: "Mill – Lollipop" },
      { label: "T-Slot", value: "Mill – T-Slot" },
      { label: "Engraving", value: "Mill – Engraving" },
    ]
  },
  {
    label: "Hole Making", children: [
      { label: "Drill", value: "Mill Hole Making – Drill" },
      { label: "Spot/CSK", value: "Mill Hole Making – Spot/CSK" },
      { label: "Tap", value: "Mill Hole Making – Tap" },
      { label: "Bore", value: "Mill Hole Making – Bore" },
    ]
  },
];

// ── OD/ID/Face selector ────────────────────────────────────────────────────────
const HOLE_MAKING_VALUES = [
  "Drill – Carbide", "Drill – HSS", "Drill – Insert", "Drill – Ex Tip",
  "Hole Making – Tap", "Hole Making – Spot/CSK",
];

export function isHoleMaking(typeValue) {
  return HOLE_MAKING_VALUES.includes(typeValue);
}

export function ODIDFaceSelect({ value, onChange }) {
  return (
    <Select value={value || ""} onValueChange={onChange}>
      <SelectTrigger className="h-8 text-xs bg-background border-border/60 w-28 shrink-0">
        <SelectValue placeholder="Operation…" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="OD">OD</SelectItem>
        <SelectItem value="ID">ID</SelectItem>
        <SelectItem value="Face">Face</SelectItem>
      </SelectContent>
    </Select>
  );
}

// ── Generic recursive cascade renderer ────────────────────────────────────────
function CascadeMenu({ options, onSelect, depth = 0 }) {
  const [expanded, setExpanded] = useState(null);

  return (
    <div className={depth > 0 ? "bg-muted/40 border-y border-border/40 py-1 mb-1" : ""}>
      {options.map((opt) => (
        <div key={opt.label}>
          {opt.children ? (
            <>
              <div
                onClick={(e) => { e.stopPropagation(); setExpanded(ex => ex === opt.label ? null : opt.label); }}
                className={`flex items-center justify-between py-1.5 text-sm cursor-pointer rounded-sm mx-1 hover:bg-accent text-foreground ${depth > 0 ? "px-6" : "px-3 py-2"}`}
              >
                <span>{opt.label}</span>
                <ChevronRight className={`w-3.5 h-3.5 transition-transform shrink-0 ${expanded === opt.label ? "rotate-90" : ""}`} />
              </div>
              {expanded === opt.label && (
                <CascadeMenu options={opt.children} onSelect={onSelect} depth={depth + 1} />
              )}
            </>
          ) : (
            <div
              onClick={() => onSelect(opt.value)}
              className={`py-1.5 text-sm cursor-pointer hover:bg-primary hover:text-primary-foreground rounded-sm mx-1 ${depth > 0 ? "px-8" : "px-3 py-2"}`}
            >
              {opt.label}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function ToolTypeDropdown({ toolKind, value, onChange }) {
  const [open, setOpen] = useState(false);

  const options = toolKind === "Mill" ? MILL_OPTIONS : TURN_OPTIONS;

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <div
      className="relative min-w-[160px]"
      tabIndex={-1}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}
    >
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full h-8 px-2 text-xs bg-background border border-border/60 rounded-md text-left flex items-center justify-between hover:border-border focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <span className={value ? "text-foreground truncate" : "text-muted-foreground"}>{value || "Select type…"}</span>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground rotate-90 shrink-0 ml-1" />
      </button>
      {open && (
        <div className="absolute z-[500] top-full left-0 mt-1 w-52 bg-popover border border-border rounded-md shadow-xl py-1 max-h-80 overflow-y-auto">
          <CascadeMenu options={options} onSelect={handleSelect} />
        </div>
      )}
    </div>
  );
}