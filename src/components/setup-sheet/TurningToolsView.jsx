import React from "react";

const TOOL_COL_DEFS = [
  { key: "tool_number", label: "T#" },
  { key: "tool_kind", label: "Kind" },
  { key: "tool_type", label: "Type" },
  { key: "dia", label: "Dia" },
  { key: "rad", label: "Rad" },
  { key: "width", label: "Width" },
  { key: "deg", label: "Deg" },
  { key: "angle", label: "Angle" },
  { key: "reach", label: "Reach" },
  { key: "pitch", label: "Pitch" },
  { key: "holder", label: "Holder" },
  { key: "spindle", label: "Dir" },
  { key: "rotation", label: "Orient" },
  { key: "stickout", label: "Stickout" },
  { key: "insert", label: "Insert" },
  { key: "name", label: "Name" },
  { key: "part_number_desc", label: "Part #/Desc" },
  { key: "material", label: "Material" },
  { key: "num_flutes", label: "# Flt" },
  { key: "flute_length", label: "Flute Len" },
  { key: "oal", label: "OAL" },
  { key: "shank_dia", label: "Shank Ø" },
  { key: "neck_dia", label: "Neck Ø" },
  { key: "tip_dia", label: "Tip Ø" },
  { key: "coolant", label: "Coolant" },
  { key: "extension", label: "Extension" },
  { key: "note", label: "Note" },
];

function formatVal(v) {
  if (v === "" || v === null || v === undefined) return "";
  if (Array.isArray(v)) return v.filter(Boolean).join(", ");
  return String(v);
}

function hasData(tools) {
  return tools.some(t => Object.values(t).some(v => v !== "" && v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0)));
}

export function hasTurningToolsData(turningTools) {
  const turrets = turningTools?.turrets || [];
  return turrets.some(t => (t.tools || []).length > 0 && hasData(t.tools));
}

export default function TurningToolsView({ turningTools, tableClass = "view-table" }) {
  const turrets = turningTools?.turrets || [];
  if (turrets.length === 0) return null;

  return (
    <div className="space-y-4">
      {turrets.map((turret, ti) => {
        const tools = turret.tools || [];
        if (tools.length === 0 || !hasData(tools)) return null;

        const visibleCols = TOOL_COL_DEFS.filter(c => tools.some(t => formatVal(t[c.key])));
        // Add custom fields as columns
        const customKeys = new Set();
        tools.forEach(t => (t.custom_fields || []).forEach(cf => { if (cf.key) customKeys.add(cf.key); }));
        const customCols = [...customKeys].map(k => ({
          key: `custom_${k}`,
          label: k,
          getValue: (t) => (t.custom_fields || []).find(cf => cf.key === k)?.value || "",
        }));

        const allCols = [...visibleCols, ...customCols];
        if (allCols.length === 0) return null;

        const header = `Turret ${ti + 1}${turret.turret_type ? ` — ${turret.turret_type}` : ""}`;

        return (
          <div key={ti}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">{header}</p>
            <table className={`${tableClass} w-full`}>
              <thead>
                <tr>{allCols.map(c => <th key={c.key}>{c.label}</th>)}</tr>
              </thead>
              <tbody>
                {tools.map((tool, i) => (
                  <tr key={i}>
                    {allCols.map(c => (
                      <td key={c.key}>{c.getValue ? formatVal(c.getValue(tool)) : formatVal(tool[c.key])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}