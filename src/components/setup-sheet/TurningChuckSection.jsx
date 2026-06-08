import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AutoResizeTextarea from "@/components/ui/AutoResizeTextarea";
import SectionHeader from "./SectionHeader";
import { Wrench, Plus, Trash2 } from "lucide-react";

const CHUCK_TYPES = ["3-jaw", "5C (Collet)", "FlexC 65 (Collet)", "Collet (Other)", "Other"];

const Field = ({ label, children }) => (
  <div>
    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
      {label}
    </Label>
    {children}
  </div>
);

const emptySpindle = { jaw_description: "", chuck_type: "3-jaw", chuck_pressure_psi: 60, concentricity_requirement: "" };

function SpindleRow({ spindle, index, onChange, onRemove, showRemove, label }) {
  const update = (field) => (val) => onChange({ ...spindle, [field]: val });

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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3">
        <Field label="Jaw Description">
          <Input
            value={spindle.jaw_description || ""}
            onChange={(e) => update("jaw_description")(e.target.value)}
            placeholder='e.g. 2.75″ × .145″ softjaws'
            className="h-9 text-sm bg-background border-border/60"
          />
        </Field>

        <Field label="Chuck Type">
          <Select value={spindle.chuck_type || "3-jaw"} onValueChange={update("chuck_type")}>
            <SelectTrigger className="h-9 text-sm bg-background border-border/60">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CHUCK_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Chuck Pressure PSI">
          <Input
            type="number"
            value={spindle.chuck_pressure_psi ?? 60}
            onChange={(e) => update("chuck_pressure_psi")(e.target.value)}
            className="h-9 text-sm bg-background border-border/60"
          />
        </Field>

        <Field label="Concentricity Req.">
          <Input
            value={spindle.concentricity_requirement || ""}
            onChange={(e) => update("concentricity_requirement")(e.target.value)}
            className="h-9 text-sm bg-background border-border/60"
          />
        </Field>
      </div>
    </div>
  );
}

export default function TurningChuckSection({ data, onChange }) {
  // Migrate legacy flat fields into spindles array on first render
  const spindles = data.spindles?.length
    ? data.spindles
    : [{
        jaw_description: data.jaw_description || "",
        chuck_type: data.chuck_type || "3-jaw",
        chuck_pressure_psi: data.chuck_pressure_psi ?? 60,
        concentricity_requirement: data.concentricity_requirement || "",
      }];

  const updateSpindles = (newSpindles) => onChange({ ...data, spindles: newSpindles });

  const updateSpindle = (i, updated) => {
    const next = [...spindles];
    next[i] = updated;
    updateSpindles(next);
  };

  const addSpindle = () => updateSpindles([...spindles, { ...emptySpindle }]);
  const removeSpindle = (i) => updateSpindles(spindles.filter((_, idx) => idx !== i));

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="pt-5 pb-5">
        <SectionHeader icon={Wrench} title="Chuck & Work Holding" />

        {spindles.map((spindle, i) => (
          <SpindleRow
            key={i}
            index={i}
            spindle={spindle}
            label={spindles.length > 1 ? `Spindle ${i + 1}` : "Spindle"}
            onChange={(updated) => updateSpindle(i, updated)}
            onRemove={() => removeSpindle(i)}
            showRemove={spindles.length > 1}
          />
        ))}

        <Button size="sm" variant="outline" onClick={addSpindle} className="h-7 text-xs gap-1.5 mb-4">
          <Plus className="w-3 h-3" /> Add Spindle
        </Button>

        <div className="mt-1">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Fixturing Notes
          </Label>
          <AutoResizeTextarea
            value={data.fixturing_notes || ""}
            onChange={(e) => onChange({ ...data, fixturing_notes: e.target.value })}
            className="min-h-[64px] text-sm bg-background border-border/60"
          />
        </div>
      </CardContent>
    </Card>
  );
}