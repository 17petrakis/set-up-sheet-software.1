import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, ChevronDown, ChevronRight } from "lucide-react";
import TurretDropdown from "./TurretDropdown";
import ToolRow, { AddToolButton } from "./ToolRow";

export default function TurretBlock({ turret, onChange, onRemove, index }) {
  const [collapsed, setCollapsed] = useState(false);

  const setField = (k, v) => onChange({ ...turret, [k]: v });

  const addTool = (kind) => {
    const tools = [...(turret.tools || []), { tool_kind: kind, tool_number: "", tool_type: "" }];
    setField("tools", tools);
  };

  const updateTool = (i, updated) => {
    const tools = [...(turret.tools || [])];
    tools[i] = updated;
    setField("tools", tools);
  };

  const removeTool = (i) => {
    setField("tools", (turret.tools || []).filter((_, idx) => idx !== i));
  };

  return (
    <div className="border border-border/50 rounded-xl mb-4 shadow-sm">
      {/* Turret header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-muted/40 border-b border-border/40">
        <button type="button" onClick={() => setCollapsed(c => !c)} className="text-muted-foreground hover:text-foreground">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        <span className="text-sm font-semibold text-foreground">Turret {index + 1}</span>
        <div className="flex-1 max-w-xs">
          <TurretDropdown value={turret.turret_type || ""} onChange={(v) => setField("turret_type", v)} />
        </div>
        <Button type="button" size="icon" variant="ghost" onClick={onRemove}
          className="h-8 w-8 ml-auto text-destructive hover:text-destructive shrink-0">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {!collapsed && (
        <div className="px-4 py-4 bg-background">
          {(turret.tools || []).length === 0 && (
            <p className="text-xs text-muted-foreground mb-3">No tools added yet.</p>
          )}
          {(turret.tools || []).map((tool, i) => (
            <ToolRow
              key={i}
              tool={tool}
              onUpdate={(updated) => updateTool(i, updated)}
              onRemove={() => removeTool(i)}
            />
          ))}
          <AddToolButton onAdd={addTool} />
        </div>
      )}
    </div>
  );
}