import React from "react";
import ComboBox from "@/components/ui/ComboBox";

// ── Shared Hole Making sub-tree ────────────────────────────────────────────────
const HOLE_MAKING_CHILDREN = [
  {
    label: "Drill", children: [
      { label: "Carbide", value: "Drill – Carbide" },
      { label: "HSS", value: "Drill – HSS" },
      { label: "Insert", value: "Drill – Insert" },
      { label: "Ex Tip", value: "Drill – Ex Tip" },
      { label: "Center", value: "Drill – Center" },
    ]
  },
  { label: "Tap", value: "Hole Making – Tap" },
  { label: "Spot Drill", value: "Hole Making – Spot Drill" },
  { label: "Countersink", value: "Hole Making – Countersink" },
];

const TURN_OPTIONS = [
  { label: "Turning", value: "Turning" },
  { label: "Groove/Part", value: "Groove/Part" },
  { label: "Thread", value: "Thread" },
  { label: "Hole Making", children: HOLE_MAKING_CHILDREN },
  { label: "Profile", value: "Profile" },
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
      { label: "Spot Drill", value: "Mill Hole Making – Spot Drill" },
      { label: "Countersink", value: "Mill Hole Making – Countersink" },
      { label: "Tap", value: "Mill Hole Making – Tap" },
      { label: "Bore", value: "Mill Hole Making – Bore" },
    ]
  },
];

// ── Flatten option tree into {label, value} list ─────────────────────────────
function flattenOptions(options) {
  const result = [];
  for (const opt of options) {
    if (opt.children) {
      result.push(...flattenOptions(opt.children));
    } else {
      result.push({ label: opt.value, value: opt.value });
    }
  }
  return result;
}

const FLAT_TURN = flattenOptions(TURN_OPTIONS);
const FLAT_MILL = flattenOptions(MILL_OPTIONS);

// ── OD/ID/Face selector ────────────────────────────────────────────────────────
const HOLE_MAKING_VALUES = [
  "Drill – Carbide", "Drill – HSS", "Drill – Insert", "Drill – Ex Tip", "Drill – Center",
  "Hole Making – Tap", "Hole Making – Spot Drill", "Hole Making – Countersink",
];

export function isHoleMaking(typeValue) {
  return HOLE_MAKING_VALUES.includes(typeValue);
}

export function ToolBlockSelect({ value, onChange }) {
  return (
    <ComboBox
      value={value || ""}
      onChange={onChange}
      options={["Turn OD", "Bore OD", "Part off OD", "Axial Face"]}
      placeholder="Tool Block…"
      className="h-8 text-xs px-2 w-36 shrink-0"
    />
  );
}

export default function ToolTypeDropdown({ toolKind, value, onChange }) {
  const options = toolKind === "Mill" ? FLAT_MILL : FLAT_TURN;
  return (
    <ComboBox
      value={value || ""}
      onChange={onChange}
      options={options}
      placeholder="Select type…"
      className="h-8 text-xs px-2 w-full min-w-[160px]"
    />
  );
}