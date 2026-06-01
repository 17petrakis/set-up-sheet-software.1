import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import SectionHeader from "./SectionHeader";
import { Settings2 } from "lucide-react";

const Field = ({ label, value, onChange, type = "text", className = "" }) => (
  <div className={className}>
    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
      {label}
    </Label>
    <Input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 text-sm bg-background border-border/60 focus:border-primary/40 transition-colors"
    />
  </div>
);

export default function GeneralInfo({ data, onChange }) {
  const update = (field) => (value) => onChange({ ...data, [field]: value });

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="pt-5 pb-5">
        <SectionHeader icon={Settings2} title="General Information" />

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-3">
          <Field label="Machine" value={data.machine} onChange={update("machine")} />
          <Field label="Job Number" value={data.job_number} onChange={update("job_number")} />
          <Field label="Customer" value={data.customer} onChange={update("customer")} />
          <Field label="Programmer" value={data.programmer} onChange={update("programmer")} />
          <Field label="Part Number" value={data.part_number} onChange={update("part_number")} />
          <Field label="Revision" value={data.revision} onChange={update("revision")} />
          <Field label="Date" value={data.date} onChange={update("date")} type="date" />
          <Field label="Quantity" value={data.quantity} onChange={update("quantity")} />
          <Field label="Material" value={data.material} onChange={update("material")} />
          <Field label="Program" value={data.program} onChange={update("program")} />

          <div>
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Units
            </Label>
            <Select value={data.units} onValueChange={update("units")}>
              <SelectTrigger className="h-9 text-sm bg-background border-border/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Inch">Inch</SelectItem>
                <SelectItem value="Metric">Metric</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Field label="Total Cycle Time" value={data.total_cycle_time} onChange={update("total_cycle_time")} />
        </div>

        <div className="mt-3">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Operation Description
          </Label>
          <Textarea
            value={data.operation_description}
            onChange={(e) => update("operation_description")(e.target.value)}
            className="h-16 text-sm bg-background border-border/60 resize-none"
          />
        </div>
      </CardContent>
    </Card>
  );
}