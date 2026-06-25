import React from "react";
import { ENDMILL_TYPES, FACE_MILL_TYPES } from "@/lib/toolTypeOptions";

const DIAMETER_IN = ["1/8", "3/16", "1/4", "5/16", "3/8", "1/2", "5/8", "3/4", "1\""];
const DIAMETER_MM = ["3mm", "4mm", "6mm", "8mm", "10mm", "12mm", "16mm", "20mm"];
const FLUTES = ["2", "3", "4", "5", "6"];
const HOLDERS = ["ER16", "ER20", "ER25", "ER32", "ER40", "Shrink Fit", "Hydraulic", "Weldon", "Milling Chuck"];
const ANGLES = ["60°", "82°", "90°", "100°", "120°"];
const TAP_IMPERIAL = ["#4-40", "#6-32", "#8-32", "#10-24", "#10-32", "1/4-20", "1/4-28", "5/16-18", "3/8-16", "1/2-13"];
const TAP_METRIC = ["M3x0.5", "M4x0.7", "M5x0.8", "M6x1.0", "M8x1.25", "M10x1.5", "M12x1.75"];

/**
 * Returns chip data for a given field + tool type.
 * Returns null if no chips apply.
 * Format for multi-row: { rows: [{ label, values }] }
 * Format for single-row: { rows: [{ label: null, values }] }
 */
export function getChipsForField(fieldKey, toolType) {
  if (fieldKey === "diameter" && (ENDMILL_TYPES.includes(toolType) || FACE_MILL_TYPES.includes(toolType))) {
    return { rows: [{ label: "in", values: DIAMETER_IN }, { label: "mm", values: DIAMETER_MM }] };
  }
  if (fieldKey === "flutes" && ENDMILL_TYPES.includes(toolType)) {
    return { rows: [{ label: null, values: FLUTES }] };
  }
  if (fieldKey === "holder") {
    return { rows: [{ label: null, values: HOLDERS }] };
  }
  if (fieldKey === "angle" && (toolType === "Chamfer Mill" || toolType === "Countersink")) {
    return { rows: [{ label: null, values: ANGLES }] };
  }
  if (fieldKey === "thread_pitch" && toolType === "Tap") {
    return { rows: [{ label: "UNC/UNF", values: TAP_IMPERIAL }, { label: "Metric", values: TAP_METRIC }] };
  }
  return null;
}

function Chip({ value, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-1.5 h-5 text-[10px] rounded-full border transition-colors whitespace-nowrap ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-background text-muted-foreground border-border/60 hover:border-primary/40 hover:text-foreground"
      }`}
    >
      {value}
    </button>
  );
}

export default function FieldChips({ fieldKey, toolType, currentValue, onSelect }) {
  const data = getChipsForField(fieldKey, toolType);
  if (!data) return null;

  return (
    <div className="mt-0.5 space-y-0.5">
      {data.rows.map((row, ri) => (
        <div key={ri} className="flex items-center gap-1 flex-wrap">
          {row.label && (
            <span className="text-[9px] text-muted-foreground/60 font-medium uppercase tracking-wide mr-0.5 shrink-0">
              {row.label}
            </span>
          )}
          {row.values.map(v => (
            <Chip key={v} value={v} active={currentValue === v} onClick={() => onSelect(v)} />
          ))}
        </div>
      ))}
    </div>
  );
}