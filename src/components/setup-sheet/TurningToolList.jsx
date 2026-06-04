import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SectionHeader from "./SectionHeader";
import { List, Plus, Trash2 } from "lucide-react";
import { emptyTurningAxialTool, emptyTurningRadialTool } from "@/lib/setupSheetDefaults";

const TOOL_TYPES = ["Drill", "Tap", "Reamer", "End Mill", "Boring Bar", "Insert", "Grooving", "Threading", "Facing", "OD Turn", "ID Turn", "Other"];

const AxialCols = ["T#", "Description", "Type", "Diameter / Radius", "Angle", "Holder", "Stickout"];
const AxialKeys = ["tool_number", "description", "type", "diameter_radius", "angle", "holder", "stickout"];

const RadialCols = ["T#", "Description", "Type", "Diameter / Radius", "Angle / Insert", "Holder", "Stickout", "Extension"];
const RadialKeys = ["tool_number", "description", "type", "diameter_radius", "angle_insert", "holder", "stickout", "extension"];

function ToolRow({ tool, keys, onUpdate, onDelete, showTypeDropdown }) {
  return (
    <tr>
      {keys.map((k) => (
        <td key={k} className="border border-border/40 p-0">
          {k === "type" ? (
            <select
              value={tool[k] || ""}
              onChange={e => onUpdate(k, e.target.value)}
              className="w-full h-8 px-2 text-xs bg-background border-0 text-foreground focus:outline-none focus:ring-1 focus:ring-ring min-w-[80px]"
            >
              <option value="">— Type —</option>
              {TOOL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          ) : (
            <Input
              value={tool[k] || ""}
              onChange={e => onUpdate(k, e.target.value)}
              className="h-8 text-xs border-0 rounded-none bg-transparent focus-visible:ring-1 focus-visible:ring-inset min-w-[60px]"
            />
          )}
        </td>
      ))}
      <td className="border border-border/40 p-1 text-center w-8">
        <button onClick={onDelete} className="text-muted-foreground hover:text-destructive transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </td>
    </tr>
  );
}

function ToolTable({ title, cols, keys, tools, onAdd, onUpdate, onDelete, emptyTool }) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{title}</p>
        <Button size="sm" variant="outline" onClick={onAdd} className="h-6 text-[10px] gap-1 px-2">
          <Plus className="w-3 h-3" /> Add
        </Button>
      </div>
      {tools.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">No tools yet.</p>
      ) : (
        <div className="overflow-x-auto rounded border border-border/40">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-muted/50">
                {cols.map(c => (
                  <th key={c} className="border border-border/40 px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                    {c}
                  </th>
                ))}
                <th className="border border-border/40 w-8" />
              </tr>
            </thead>
            <tbody>
              {tools.map((tool, i) => (
                <ToolRow
                  key={i}
                  tool={tool}
                  keys={keys}
                  onUpdate={(k, v) => onUpdate(i, k, v)}
                  onDelete={() => onDelete(i)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function TurningToolList({ axialTools, radialTools, onChange }) {
  const updateAxial = (i, k, v) => {
    const updated = axialTools.map((t, idx) => idx === i ? { ...t, [k]: v } : t);
    onChange({ axialTools: updated, radialTools });
  };
  const deleteAxial = (i) => onChange({ axialTools: axialTools.filter((_, idx) => idx !== i), radialTools });
  const addAxial = () => onChange({ axialTools: [...axialTools, { ...emptyTurningAxialTool }], radialTools });

  const updateRadial = (i, k, v) => {
    const updated = radialTools.map((t, idx) => idx === i ? { ...t, [k]: v } : t);
    onChange({ axialTools, radialTools: updated });
  };
  const deleteRadial = (i) => onChange({ axialTools, radialTools: radialTools.filter((_, idx) => idx !== i) });
  const addRadial = () => onChange({ axialTools, radialTools: [...radialTools, { ...emptyTurningRadialTool }] });

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="pt-5 pb-5">
        <SectionHeader icon={List} title="Tool List (Turret)" />
        <ToolTable
          title="Axial Tools"
          cols={AxialCols}
          keys={AxialKeys}
          tools={axialTools}
          onAdd={addAxial}
          onUpdate={updateAxial}
          onDelete={deleteAxial}
        />
        <ToolTable
          title="Radial Tools"
          cols={RadialCols}
          keys={RadialKeys}
          tools={radialTools}
          onAdd={addRadial}
          onUpdate={updateRadial}
          onDelete={deleteRadial}
        />
      </CardContent>
    </Card>
  );
}