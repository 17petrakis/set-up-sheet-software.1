import React from "react";
import { formatToolParts, formatToolExtraLine, toolHasData, sortTurningToolsByTNumber } from "@/lib/turningToolConfig";

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
            <div className="border border-gray-200 rounded bg-white overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500 px-3 py-1.5 w-16">T#</th>
                    <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500 px-3 py-1.5">Shape</th>
                    <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500 px-3 py-1.5">Name</th>
                  </tr>
                </thead>
                <tbody>
                  {tools.map((tool, i) => {
                    const { tNum, shape, name } = formatToolParts(tool);
                    const extraLine = formatToolExtraLine(tool);
                    return (
                      <React.Fragment key={i}>
                        <tr className={i > 0 ? "border-t border-gray-100" : ""}>
                          <td className="px-3 py-1.5 text-base font-mono font-medium align-top whitespace-nowrap">{tNum}</td>
                          <td className="px-3 py-1.5 text-base font-medium break-words">{shape}</td>
                          <td className="px-3 py-1.5 text-base font-medium break-words">{name}</td>
                        </tr>
                        {extraLine && (
                          <tr className="border-t border-gray-50">
                            <td></td>
                            <td className="px-3 py-0.5 text-sm text-muted-foreground break-words">{extraLine}</td>
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