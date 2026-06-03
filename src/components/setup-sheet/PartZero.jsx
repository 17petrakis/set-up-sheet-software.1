import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SectionHeader from "./SectionHeader";
import { Crosshair } from "lucide-react";

const axes = [
  { axis: "X", max: "x_max", min: "x_min", color: "text-red-500" },
  { axis: "Y", max: "y_max", min: "y_min", color: "text-green-500" },
  { axis: "Z", max: "z_max", min: "z_min", color: "text-blue-500" },
];

export default function PartZero({ data, onChange }) {
  const update = (field) => (e) => onChange({ ...data, [field]: e.target.value });

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="pt-5 pb-5">
        <SectionHeader icon={Crosshair} title="Part Zero" />

        {/* Axis boxes */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {axes.map(({ axis, max, min, color }) => (
            <div key={axis} className="rounded-lg border border-border/60 bg-muted/30 p-3">
              <div className={`text-sm font-semibold mb-2 ${color}`}>{axis} axis</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                    MAX
                  </Label>
                  <Input
                    value={data[max] ?? ""}
                    onChange={update(max)}
                    placeholder="0.0000"
                    className="h-8 text-xs text-center font-mono bg-background border-border/60"
                  />
                </div>
                <div>
                  <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
                    MIN
                  </Label>
                  <Input
                    value={data[min] ?? ""}
                    onChange={update(min)}
                    placeholder="0.0000"
                    className="h-8 text-xs text-center font-mono bg-background border-border/60"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Coordinate System
            </Label>
            <Input
              value={data.coordinate_system ?? ""}
              onChange={update("coordinate_system")}
              placeholder="e.g. CS#2 — ZX plane"
              className="h-9 text-sm bg-background border-border/60"
            />
          </div>
          <div>
            <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Overall Depth Range
            </Label>
            <Input
              value={data.overall_depth_range ?? ""}
              onChange={update("overall_depth_range")}
              placeholder="e.g. MAX .25 / MIN -1.175"
              className="h-9 text-sm bg-background border-border/60"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}