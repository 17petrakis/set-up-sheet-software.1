import React from "react";
import { formatToolLine, formatToolExtraLine, toolHasData, sortTurningToolsByTNumber } from "@/lib/turningToolConfig";

export function hasTurningToolsData(turningTools) {
  const turrets = turningTools?.turrets || [];
  return turrets.some(t => (t.tools || []).some(tool => toolHasData(tool)));
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

        return (
          <div key={ti}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">{header}</p>
            <div className="text-sm space-y-0 border border-gray-200 rounded bg-white">
              {tools.map((tool, i) => {
                const mainLine = formatToolLine(tool);
                const extraLine = formatToolExtraLine(tool);
                return (
                  <div key={i} className={i % 2 === 1 ? "bg-gray-50" : ""}>
                    <div className="px-3 py-1 break-words">{mainLine}</div>
                    {extraLine && <div className="px-3 py-0.5 break-words text-muted-foreground">{extraLine}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}