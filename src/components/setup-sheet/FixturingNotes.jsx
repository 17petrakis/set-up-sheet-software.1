import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AutoResizeTextarea from "@/components/ui/AutoResizeTextarea";
import SectionHeader from "./SectionHeader";
import { Wrench } from "lucide-react";

export default function FixturingNotes({ data, onChange }) {
  const update = (field) => (e) => onChange({ ...data, [field]: e.target.value });

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="pt-5 pb-5">
        <SectionHeader icon={Wrench} title="Fixturing Notes" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div>
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Fixture
            </Label>
            <Input
              value={data.fixture ?? ""}
              onChange={update("fixture")}
              placeholder="e.g. Tombstone, Fixture Plate #2"
              className="h-9 text-sm bg-background border-border/60"
            />
          </div>
          <div>
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Vise
            </Label>
            <Input
              value={data.vise ?? ""}
              onChange={update("vise")}
              placeholder="e.g. 5&quot; Kurt Vise, Self-Centering"
              className="h-9 text-sm bg-background border-border/60"
            />
          </div>
        </div>

        <div>
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Work Holding Notes
          </Label>
          <AutoResizeTextarea
            value={data.work_holding_notes ?? ""}
            onChange={update("work_holding_notes")}
            placeholder="Ex: self centering vice on the tombstone, held in place by bolts on E9, E13. Stock is held on the 5&quot; width, extending 1.65&quot; out from top of vise. Torque vice to 65 FT LBS"
            className="min-h-[80px] text-sm bg-background border-border/60"
          />
        </div>
      </CardContent>
    </Card>
  );
}