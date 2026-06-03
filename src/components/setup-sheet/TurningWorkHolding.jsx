import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AutoResizeTextarea from "@/components/ui/AutoResizeTextarea";
import SectionHeader from "./SectionHeader";
import { Wrench } from "lucide-react";

const CHUCK_TYPES = ["3-jaw", "4-jaw", "2-jaw", "Collet", "Face Plate", "Mandrel", "Other"];

export default function TurningWorkHolding({ data = {}, onChange }) {
  const update = (field) => (value) => onChange({ ...data, [field]: value });

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="pt-5 pb-5">
        <SectionHeader icon={Wrench} title="Chuck & Work Holding" />

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Jaw Description
            </Label>
            <Input
              value={data.jaw_description ?? ""}
              onChange={(e) => update("jaw_description")(e.target.value)}
              placeholder='e.g. 2.75" × .145" softjaws'
              className="h-9 text-sm bg-background border-border/60"
            />
          </div>
          <div>
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Chuck Type
            </Label>
            <Select value={data.chuck_type ?? "3-jaw"} onValueChange={update("chuck_type")}>
              <SelectTrigger className="h-9 text-sm bg-background border-border/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHUCK_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-3 border border-border/60 rounded-lg p-3 bg-muted/30">
            <div className="flex-1">
              <p className="text-xs font-medium text-muted-foreground leading-tight">Chuck pressure (PSI)</p>
            </div>
            <Input
              type="number"
              value={data.chuck_pressure ?? ""}
              onChange={(e) => update("chuck_pressure")(e.target.value)}
              placeholder="60"
              className="w-24 h-8 text-sm text-right bg-background border-border/60"
            />
          </div>
          <div className="flex items-center gap-3 border border-border/60 rounded-lg p-3 bg-muted/30">
            <div className="flex-1">
              <p className="text-xs font-medium text-muted-foreground leading-tight">Coolant pressure (PSI)</p>
            </div>
            <Input
              type="number"
              value={data.coolant_pressure ?? ""}
              onChange={(e) => update("coolant_pressure")(e.target.value)}
              placeholder="120"
              className="w-24 h-8 text-sm text-right bg-background border-border/60"
            />
          </div>
        </div>

        <div className="mb-4">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Concentricity Requirement
          </Label>
          <Input
            value={data.concentricity ?? ""}
            onChange={(e) => update("concentricity")(e.target.value)}
            placeholder="e.g. [MUST MAINTAIN 0.0004 CONCENTRICITY]"
            className="h-9 text-sm bg-background border-border/60"
          />
        </div>

        <div>
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Fixturing Notes
          </Label>
          <AutoResizeTextarea
            value={data.fixturing_notes ?? ""}
            onChange={(e) => update("fixturing_notes")(e.target.value)}
            placeholder="Additional fixturing or setup notes..."
            className="min-h-[80px] text-sm bg-background border-border/60"
          />
        </div>
      </CardContent>
    </Card>
  );
}