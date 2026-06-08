import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import SectionHeader from "./SectionHeader";
import { Crosshair, Plus, Trash2 } from "lucide-react";

const emptyCS = { coordinate_system: "", max_depth: "", c_axis_offset: "" };

function CoordSystemRow({ cs, index, onChange, onRemove, showRemove, label }) {
  const update = (field) => (e) => onChange({ ...cs, [field]: e.target.value });

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
        {showRemove && (
          <Button size="icon" variant="ghost" onClick={onRemove} className="h-6 w-6 text-destructive hover:text-destructive">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Coordinate System
          </Label>
          <Input
            value={cs.coordinate_system ?? ""}
            onChange={update("coordinate_system")}
            placeholder="e.g. CS#2 — ZX plane"
            className="h-9 text-sm bg-background border-border/60"
          />
        </div>
        <div>
          <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Max Depth
          </Label>
          <Input
            value={cs.max_depth ?? ""}
            onChange={update("max_depth")}
            placeholder="e.g. -1.175"
            className="h-9 text-sm bg-background border-border/60"
          />
        </div>
        <div>
          <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
            C Axis Offset
          </Label>
          <Input
            value={cs.c_axis_offset ?? ""}
            onChange={update("c_axis_offset")}
            placeholder="e.g. 0.000"
            className="h-9 text-sm bg-background border-border/60"
          />
        </div>
      </div>
    </div>
  );
}

export default function PartZero({ data, onChange }) {
  // Z axis only (X and Y removed)
  const update = (field) => (e) => onChange({ ...data, [field]: e.target.value });

  // Migrate legacy coordinate_system / overall_depth_range into coord_systems array
  const coordSystems = data.coord_systems?.length
    ? data.coord_systems
    : [{
        coordinate_system: data.coordinate_system || "",
        max_depth: data.overall_depth_range || "",
        c_axis_offset: data.c_axis_offset || "",
      }];

  const updateCoordSystems = (next) => onChange({ ...data, coord_systems: next });
  const updateCS = (i, updated) => { const next = [...coordSystems]; next[i] = updated; updateCoordSystems(next); };
  const addCS = () => updateCoordSystems([...coordSystems, { ...emptyCS }]);
  const removeCS = (i) => updateCoordSystems(coordSystems.filter((_, idx) => idx !== i));

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="pt-5 pb-5">
        <SectionHeader icon={Crosshair} title="Part Zero" />

        {/* Z axis only */}
        <div className="grid grid-cols-1 gap-3 mb-4 max-w-xs">
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
            <div className="text-sm font-semibold mb-2 text-blue-500">Z axis</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                  MAX
                </Label>
                <Input
                  value={data.z_max ?? ""}
                  onChange={update("z_max")}
                  placeholder="0.0000"
                  className="h-8 text-xs text-center font-mono bg-background border-border/60"
                />
              </div>
              <div>
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                  MIN
                </Label>
                <Input
                  value={data.z_min ?? ""}
                  onChange={update("z_min")}
                  placeholder="0.0000"
                  className="h-8 text-xs text-center font-mono bg-background border-border/60"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Coordinate Systems */}
        {coordSystems.map((cs, i) => (
          <CoordSystemRow
            key={i}
            index={i}
            cs={cs}
            label={coordSystems.length > 1 ? `Coordinate System ${i + 1}` : "Coordinate System"}
            onChange={(updated) => updateCS(i, updated)}
            onRemove={() => removeCS(i)}
            showRemove={coordSystems.length > 1}
          />
        ))}

        <Button size="sm" variant="outline" onClick={addCS} className="h-7 text-xs gap-1.5">
          <Plus className="w-3 h-3" /> Add Coordinate System
        </Button>
      </CardContent>
    </Card>
  );
}