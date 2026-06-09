import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import AutoResizeTextarea from "@/components/ui/AutoResizeTextarea";
import SectionHeader from "./SectionHeader";
import { Crosshair, Plus, Trash2 } from "lucide-react";

function FieldInput({ label, value, onChange, placeholder }) {
  return (
    <div>
      <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">{label}</Label>
      <Input
        value={value ?? ""}
        onChange={onChange}
        placeholder={placeholder}
        className="h-8 text-xs text-center font-mono bg-background border-border/60"
      />
    </div>
  );
}

export default function PartZero({ data, onChange, machineType }) {
  const update = (field) => (e) => onChange({ ...data, [field]: e.target.value });

  // coord_systems is just an array of strings
  const coordSystems = data.coord_systems?.length
    ? data.coord_systems
    : [data.coordinate_system || ""];

  const updateCoordSystems = (next) => onChange({ ...data, coord_systems: next });
  const updateCS = (i, val) => { const next = [...coordSystems]; next[i] = val; updateCoordSystems(next); };
  const addCS = () => updateCoordSystems([...coordSystems, ""]);
  const removeCS = (i) => updateCoordSystems(coordSystems.filter((_, idx) => idx !== i));

  const isTurning = machineType === "turning";

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="pt-5 pb-5">
        <SectionHeader icon={Crosshair} title="Part Zero" />

        {isTurning ? (
          <>
            {/* Z axis */}
            <div className="grid grid-cols-1 gap-3 mb-4 max-w-xs">
              <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                <div className="text-sm font-semibold mb-2 text-blue-500">Z axis</div>
                <div className="grid grid-cols-2 gap-2">
                  <FieldInput label="MAX" value={data.z_max} onChange={update("z_max")} placeholder="0.0000" />
                  <FieldInput label="MIN" value={data.z_min} onChange={update("z_min")} placeholder="0.0000" />
                </div>
              </div>
            </div>

            {/* Max Depth & C Axis Offset */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Max Depth</Label>
                <Input
                  value={data.max_depth ?? data.overall_depth_range ?? ""}
                  onChange={update("max_depth")}
                  placeholder="e.g. -1.175"
                  className="h-9 text-sm bg-background border-border/60"
                />
              </div>
              <div>
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">C Axis Offset</Label>
                <Input
                  value={data.c_axis_offset ?? ""}
                  onChange={update("c_axis_offset")}
                  placeholder="e.g. 0.000"
                  className="h-9 text-sm bg-background border-border/60"
                />
              </div>
            </div>

            {/* Coordinate Systems — repeatable */}
            <div className="mb-2">
              <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                Coordinate System{coordSystems.length > 1 ? "s" : ""}
              </Label>
              {coordSystems.map((cs, i) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <Input
                    value={cs}
                    onChange={(e) => updateCS(i, e.target.value)}
                    placeholder="e.g. CS#2 — ZX plane"
                    className="h-9 text-sm bg-background border-border/60"
                  />
                  {coordSystems.length > 1 && (
                    <Button size="icon" variant="ghost" onClick={() => removeCS(i)} className="h-9 w-9 text-destructive hover:text-destructive shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button size="sm" variant="outline" onClick={addCS} className="h-7 text-xs gap-1.5">
              <Plus className="w-3 h-3" /> Add Coordinate System
            </Button>
          </>
        ) : (
          <>
            {/* Milling: Program Coordinate Zero Note */}
            <div className="mb-4">
              <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Program Coordinate Zero Note</Label>
              <AutoResizeTextarea
                value={data.program_coord_zero_note ?? ""}
                onChange={(e) => onChange({ ...data, program_coord_zero_note: e.target.value })}
                placeholder="Describe program coordinate zero location..."
                className="text-sm bg-background border-border/60 min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Coordinate System</Label>
                <Input
                  value={data.coordinate_system ?? ""}
                  onChange={update("coordinate_system")}
                  placeholder="e.g. G54"
                  className="h-9 text-sm bg-background border-border/60"
                />
              </div>
              <div>
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Overall Depth Range</Label>
                <Input
                  value={data.overall_depth_range ?? ""}
                  onChange={update("overall_depth_range")}
                  placeholder="e.g. -0.500 to -1.175"
                  className="h-9 text-sm bg-background border-border/60"
                />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}