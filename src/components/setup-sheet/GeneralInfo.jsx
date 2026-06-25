import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ComboBox from "@/components/ui/ComboBox";
import AutoResizeTextarea from "@/components/ui/AutoResizeTextarea";
import { Card, CardContent } from "@/components/ui/card";
import SectionHeader from "./SectionHeader";
import { Settings2 } from "lucide-react";
import { MATERIAL_OPTIONS } from "@/lib/materialOptions";

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

export default function GeneralInfo({ data, onChange, onReplace, machineType }) {
  const update = (field) => (value) => onChange(field, value);

  const [customerNames, setCustomerNames] = useState([]);

  useEffect(() => {
    base44.entities.Customer.list("name", 200).then(list => {
      const names = list.map(c => c.name).filter(Boolean);
      setCustomerNames([...new Set(names)]);
    });
  }, []);

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="pt-5 pb-5">
        <SectionHeader icon={Settings2} title="General Information" />

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-3">
          <Field label="Machine" value={data.machine} onChange={update("machine")} />
          <Field label="Job Number" value={data.job_number} onChange={update("job_number")} />

          {/* Customer field with ComboBox */}
          <div>
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Customer
            </Label>
            <ComboBox
              value={data.customer || ""}
              onChange={update("customer")}
              options={customerNames}
              placeholder="Select or type…"
              className="h-9 text-sm px-3 w-full"
            />
          </div>

          <Field label="Programmer" value={data.programmer} onChange={update("programmer")} />
          <Field label="Part Number" value={data.part_number} onChange={update("part_number")} />
          <Field label="Revision" value={data.revision} onChange={update("revision")} />
          <Field label="Date" value={data.date} onChange={update("date")} type="date" />
          <Field label="Quantity" value={data.quantity} onChange={update("quantity")} />
          <div>
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Material
            </Label>
            <ComboBox
              value={data.material || ""}
              onChange={update("material")}
              options={MATERIAL_OPTIONS}
              placeholder="Select or type…"
              className="h-9 text-sm px-3 w-full"
            />
          </div>
          <Field label="Pre Machine Size" value={data.pre_machine_size} onChange={update("pre_machine_size")} />
          <Field label="Program" value={data.program} onChange={update("program")} />

          <div>
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Units
            </Label>
            <select
              value={data.units || ""}
              onChange={(e) => update("units")(e.target.value)}
              className="h-9 text-sm bg-background border border-border/60 rounded-md px-3 w-full focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="" disabled>Select…</option>
              <option value="Inch">Inch</option>
              <option value="Metric">Metric</option>
            </select>
          </div>

          <Field label="Total Cycle Time" value={data.total_cycle_time} onChange={update("total_cycle_time")} />

          <div>
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Status
            </Label>
            <select
              value={data.status || "Active"}
              onChange={(e) => update("status")(e.target.value)}
              className="h-9 text-sm bg-background border border-border/60 rounded-md px-3 w-full focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="" disabled>Select…</option>
              <option value="Active">Active</option>
              <option value="Repeating">Repeating</option>
              <option value="One Time">One Time</option>
              <option value="Completed">Completed</option>
              <option value="On Hold">On Hold</option>
            </select>
          </div>
        </div>

        <div className="mt-3">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
            {machineType === "turning" ? "Pre-machining Notes" : "Operation Description"}
          </Label>
          <AutoResizeTextarea
            value={data.operation_description}
            onChange={(e) => update("operation_description")(e.target.value)}
            className="min-h-[64px] text-sm bg-background border-border/60"
          />
        </div>


      </CardContent>
    </Card>
  );
}