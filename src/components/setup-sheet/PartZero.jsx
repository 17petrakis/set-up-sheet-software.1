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

        <div className="grid grid-cols-3 gap-3">
          {axes.map(({ axis, max, min, color }) => (
            <div key={axis} className="space-y-2">
              <div className="text-center">
                <span className={`text-sm font-bold font-mono ${color}`}>{axis}</span>
              </div>
              <div>
                <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1 block">
                  Max
                </Label>
                <Input
                  value={data[max]}
                  onChange={update(max)}
                  className="h-8 text-xs text-center font-mono bg-background border-border/60"
                />
              </div>
              <div>
                <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1 block">
                  Min
                </Label>
                <Input
                  value={data[min]}
                  onChange={update(min)}
                  className="h-8 text-xs text-center font-mono bg-background border-border/60"
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}