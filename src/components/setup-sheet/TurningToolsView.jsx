import React from "react";
import { formatToolParts, formatToolExtraLine, toolHasData, sortTurningToolsByTNumber, getTypeFields, migrateToolType } from "@/lib/turningToolConfig";

export function hasTurningToolsData(turningTools) {
  const turrets = turningTools?.turrets || [];
  return turrets.some(t => (t.tools || []).some(tool => toolHasData(tool)));
}

// Collect all unique field keys across tools in a turret, preserving order
function collectFieldColumns(tools) {
  const seen = new Set();
  const columns = [];
  tools.forEach(tool => {
    const typeValue = migrateToolType(tool.tool_kind, tool.tool_type);
    const fields = getTypeFields(tool.tool_kind, typeValue);
    fields.forEach(f => {
      if (!seen.has(f.key)) {
        seen.add(f.key);
        columns.push({ key: f.key, label: f.label });
      }
    });
  });
  return columns;
}

export default function TurningToolsView({ turningTools }) {
  const turrets = turningTools?.turrets || [];
  if (turrets.length === 0) return null;

  const sorted = sortTurningToolsByTNumber(turningTools);

  return (
    <div className="space-y-4">
      {sorted.turrets.map((turret, ti) => {
        const tools = (turret.tools || []).filter(tool => toolHasData(tool));
        if (tools.length === 0) return null;

        const header = `Turret ${ti + 1}${turret.turret_type ? ` — ${turret.turret_type}` : ""}`;
        const fieldColumns = collectFieldColumns(tools);

        return (
          <div key={ti}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">{header}</p>
            <div className="border border-gray-200 rounded bg-white overflow-x-auto">
              <table className="w-full min-w-[500px] border-collapse">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500 px-3 py-1.5 w-16 border-r border-gray-200">T#</th>
                    {fieldColumns.map(col => (
                      <th key={col.key} className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500 px-3 py-1.5 border-r border-gray-200 last:border-r-0 whitespace-nowrap">{col.label}</th>
                    ))}
                    <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500 px-3 py-1.5">Name</th>
                  </tr>
                </thead>
                <tbody>
                  {tools.map((tool, i) => {
                    const { tNum, fieldValues, name } = formatToolParts(tool);
                    const extraLine = formatToolExtraLine(tool);
                    return (
                      <React.Fragment key={i}>
                        <tr className={i > 0 ? "border-t border-gray-100" : ""}>
                          <td className="px-3 py-1.5 text-base font-mono font-medium align-top whitespace-nowrap border-r border-gray-200">{tNum}</td>
                          {fieldColumns.map(col => {
                            const fv = fieldValues.find(f => f.key === col.key);
                            return (
                              <td key={col.key} className="px-3 py-1.5 text-base font-medium whitespace-nowrap border-r border-gray-200 last:border-r-0">{fv?.value || ""}</td>
                            );
                          })}
                          <td className="px-3 py-1.5 text-base font-medium whitespace-nowrap">{name}</td>
                        </tr>
                        {extraLine && (
                          <tr className="border-t border-gray-100 bg-muted/20">
                            <td colSpan={fieldColumns.length + 2} className="px-3 py-1 text-sm text-muted-foreground break-words">{extraLine}</td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}