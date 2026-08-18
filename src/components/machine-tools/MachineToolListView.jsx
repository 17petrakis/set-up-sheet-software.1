import React, { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Wrench } from "lucide-react";
import { TOOL_FIELDS, TOOL_FIELD_SHORT, getEffectiveVisibleFields } from "@/lib/toolTypeOptions";

export default function MachineToolListView({ tools, slotCount, machineName }) {
  const slots = useMemo(() => {
    const arr = Array.isArray(tools) ? tools : [];
    const total = slotCount + 1;
    const result = Array.from({ length: total }, (_, i) =>
      arr[i] ? { ...arr[i] } : { tool_number: String(i) }
    );
    result.forEach((t, i) => {
      if (!t.tool_number) t.tool_number = String(i);
    });
    return result;
  }, [tools, slotCount]);

  const isSlotFull = (tool) =>
    Object.entries(tool).some(
      ([k, v]) => k !== "tool_number" && k !== "locked" && k !== "visible_fields" && v && String(v).trim()
    );

  const fullSlots = slots.filter(isSlotFull);
  const fullCount = fullSlots.length;

  // Build the union of all visible field keys across full tools, in TOOL_FIELDS order
  const allFieldKeys = useMemo(() => {
    const keys = new Set();
    for (const tool of fullSlots) {
      const visible = getEffectiveVisibleFields(tool);
      for (const f of TOOL_FIELDS) {
        if (visible[f.key] && tool[f.key]) keys.add(f.key);
      }
    }
    return TOOL_FIELDS.filter((f) => keys.has(f.key));
  }, [fullSlots]);

  if (fullCount === 0) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-center gap-2 mb-3">
            <Wrench className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold font-heading text-foreground">{machineName}</h2>
            <span className="text-xs text-muted-foreground ml-1">0/{slotCount + 1} slots filled</span>
          </div>
          <p className="text-sm text-muted-foreground">No tools in this machine yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="pt-5 pb-5">
        <div className="flex items-center gap-2 mb-4">
          <Wrench className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold font-heading text-foreground">{machineName}</h2>
          <span className="text-xs text-muted-foreground ml-1">{fullCount}/{slotCount + 1} slots filled</span>
        </div>

        <div className="border border-border rounded-lg overflow-x-auto">
          <table className="view-table w-full min-w-[600px] border-collapse">
            <thead>
              <tr>
                <th className="text-left whitespace-nowrap">T#</th>
                {allFieldKeys.map((f) => (
                  <th key={f.key} className="text-left whitespace-nowrap">{TOOL_FIELD_SHORT[f.key] || f.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fullSlots.map((tool) => {
                const visible = getEffectiveVisibleFields(tool);
                return (
                  <tr key={tool.tool_number}>
                    <td className="font-mono font-semibold whitespace-nowrap">{tool.tool_number}</td>
                    {allFieldKeys.map((f) => (
                      <td key={f.key} className="whitespace-nowrap">{visible[f.key] ? (tool[f.key] || "") : ""}</td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}