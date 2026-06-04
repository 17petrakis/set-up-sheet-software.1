import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AutoResizeTextarea from "@/components/ui/AutoResizeTextarea";
import SectionHeader from "./SectionHeader";
import { Wrench } from "lucide-react";

const Field = ({ label, children }) => (
  <div>
    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
      {label}
    </Label>
    {children}
  </div>
);

export default function TurningChuckSection({ data, onChange }) {
  const update = (field) => (val) => onChange({ ...data, [field]: val });

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="pt-5 pb-5">
        <SectionHeader icon={Wrench} title="Chuck & Work Holding" />

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-3">
          <Field label="Jaw Description">
            <Input
              value={data.jaw_description || ""}
              onChange={(e) => update("jaw_description")(e.target.value)}
              placeholder='e.g. 2.75″ × .145″ softjaws'
              className="h-9 text-sm bg-background border-border/60"
            />
          </Field>

          <Field label="Chuck Type">
            <Select value={data.chuck_type || "3-jaw"} onValueChange={update("chuck_type")}>
              <SelectTrigger className="h-9 text-sm bg-background border-border/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3-jaw">3-jaw</SelectItem>
                <SelectItem value="4-jaw">4-jaw</SelectItem>
                <SelectItem value="6-jaw">6-jaw</SelectItem>
                <SelectItem value="collet">Collet</SelectItem>
                <SelectItem value="face-plate">Face Plate</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label="Chuck Pressure PSI">
            <Input
              type="number"
              value={data.chuck_pressure_psi ?? 60}
              onChange={(e) => update("chuck_pressure_psi")(e.target.value)}
              className="h-9 text-sm bg-background border-border/60"
            />
          </Field>

          <Field label="Coolant Pressure PSI">
            <Input
              type="number"
              value={data.coolant_pressure_psi ?? 120}
              onChange={(e) => update("coolant_pressure_psi")(e.target.value)}
              className="h-9 text-sm bg-background border-border/60"
            />
          </Field>

          <Field label="Concentricity Requirement">
            <Input
              value={data.concentricity_requirement || ""}
              onChange={(e) => update("concentricity_requirement")(e.target.value)}
              className="h-9 text-sm bg-background border-border/60"
            />
          </Field>
        </div>

        <div className="mt-3">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Fixturing Notes
          </Label>
          <AutoResizeTextarea
            value={data.fixturing_notes || ""}
            onChange={(e) => update("fixturing_notes")(e.target.value)}
            className="min-h-[64px] text-sm bg-background border-border/60"
          />
        </div>
      </CardContent>
    </Card>
  );
}