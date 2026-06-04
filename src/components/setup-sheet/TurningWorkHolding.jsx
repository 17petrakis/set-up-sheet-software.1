import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AutoResizeTextarea from "@/components/ui/AutoResizeTextarea";
import SectionHeader from "./SectionHeader";
import { Wrench } from "lucide-react";

const CHUCK_TYPES = ["3-jaw", "4-jaw", "Collet", "Face plate", "Tailstock", "Other"];

const Field = ({ label, value, onChange, placeholder = "", type = "text" }) => (
  <div>
    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">{label}</Label>
    <Input
      type={type}
      value={value || ""}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-9 text-sm bg-background border-border/60"
    />
  </div>
);

export default function TurningWorkHolding({ data, onChange }) {
  const update = (field) => (value) => onChange({ ...data, [field]: value });

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="pt-5 pb-5">
        <SectionHeader icon={Wrench} title="Chuck & Work Holding" />

        <div className="grid grid-cols-2 gap-4 mb-3">
          <Field
            label="Jaw Description"
            value={data.jaw_description}
            onChange={update("jaw_description")}
            placeholder='e.g. 2.75" × .145" softjaws'
          />
          <div>
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Chuck Type</Label>
            <select
              value={data.chuck_type || "3-jaw"}
              onChange={e => update("chuck_type")(e.target.value)}
              className="w-full h-9 px-3 text-sm bg-background border border-border/60 rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {CHUCK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Chuck Pressure (PSI)</Label>
            <Input
              type="number"
              value={data.chuck_pressure || ""}
              onChange={e => update("chuck_pressure")(e.target.value)}
              placeholder="e.g. 60"
              className="h-9 text-sm bg-background border-border/60"
            />
          </div>
          <div>
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Coolant Pressure (PSI)</Label>
            <Input
              type="number"
              value={data.coolant_pressure || ""}
              onChange={e => update("coolant_pressure")(e.target.value)}
              placeholder="e.g. 120"
              className="h-9 text-sm bg-background border-border/60"
            />
          </div>
        </div>

        <div className="mb-3">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Concentricity Requirement</Label>
          <Input
            value={data.concentricity_requirement || ""}
            onChange={e => update("concentricity_requirement")(e.target.value)}
            placeholder="e.g. [MUST MAINTAIN 0.0004 CONCENTRICITY]"
            className="h-9 text-sm bg-background border-border/60"
          />
        </div>

        <div>
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Fixturing Notes</Label>
          <AutoResizeTextarea
            value={data.fixturing_notes || ""}
            onChange={e => update("fixturing_notes")(e.target.value)}
            placeholder="Additional fixturing or setup notes..."
            className="min-h-[80px] text-sm bg-background border-border/60"
          />
        </div>
      </CardContent>
    </Card>
  );
}