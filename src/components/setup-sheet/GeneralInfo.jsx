import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AutoResizeTextarea from "@/components/ui/AutoResizeTextarea";
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

export default function GeneralInfo({ data, onChange, onReplace }) {
  const update = (field) => (value) => onChange(field, value);

  const [customerNames, setCustomerNames] = useState([]);
  const [customerMode, setCustomerMode] = useState("select");

  useEffect(() => {
    base44.entities.Customer.list("name", 200).then(list => {
      setCustomerNames(list.map(c => c.name).filter(Boolean));
    });
  }, []);

  // If current customer value isn't in the list, default to "new" mode
  useEffect(() => {
    if (data.customer && customerNames.length > 0) {
      const match = customerNames.some(c => c.toLowerCase() === data.customer.toLowerCase());
      setCustomerMode(match ? "select" : "new");
    }
  }, [customerNames]);

  const handleCustomerSelect = (val) => {
    if (val === "__new__") {
      setCustomerMode("new");
      onChange("customer", "");
    } else {
      onChange("customer", val === "__none__" ? "" : val);
    }
  };

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="pt-5 pb-5">
        <SectionHeader icon={Settings2} title="General Information" />

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-3">
          <Field label="Machine" value={data.machine} onChange={update("machine")} />
          <Field label="Job Number" value={data.job_number} onChange={update("job_number")} />

          {/* Customer field with dropdown or text input */}
          <div>
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Customer
            </Label>
            {customerMode === "select" ? (
              <select
                value={data.customer || ""}
                onChange={e => handleCustomerSelect(e.target.value)}
                className="w-full h-9 px-3 text-sm bg-background border border-border/60 rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="__none__">— None —</option>
                {customerNames.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
                <option value="__new__">+ New Customer…</option>
              </select>
            ) : (
              <div className="flex gap-1">
                <Input
                  value={data.customer || ""}
                  onChange={e => update("customer")(e.target.value)}
                  placeholder="Enter customer name"
                  className="h-9 text-sm bg-background border-border/60 focus:border-primary/40 transition-colors"
                />
                {customerNames.length > 0 && (
                  <button
                    onClick={() => setCustomerMode("select")}
                    className="shrink-0 px-2 text-xs text-muted-foreground hover:text-foreground border border-border/60 rounded-md bg-background"
                    title="Pick existing"
                  >
                    ↩
                  </button>
                )}
              </div>
            )}
          </div>

          <Field label="Programmer" value={data.programmer} onChange={update("programmer")} />
          <Field label="Part Number" value={data.part_number} onChange={update("part_number")} />
          <Field label="Revision" value={data.revision} onChange={update("revision")} />
          <Field label="Date" value={data.date} onChange={update("date")} type="date" />
          <Field label="Quantity" value={data.quantity} onChange={update("quantity")} />
          <Field label="Material" value={data.material} onChange={update("material")} />
          <Field label="Pre Machine Size" value={data.pre_machine_size} onChange={update("pre_machine_size")} />
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

          <div>
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Status
            </Label>
            <Select value={data.status || "Active"} onValueChange={update("status")}>
              <SelectTrigger className="h-9 text-sm bg-background border-border/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Repeating">Repeating</SelectItem>
                <SelectItem value="One Time">One Time</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="On Hold">On Hold</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-3">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Operation Description
          </Label>
          <AutoResizeTextarea
            value={data.operation_description}
            onChange={(e) => update("operation_description")(e.target.value)}
            className="min-h-[64px] text-sm bg-background border-border/60"
          />
        </div>

        <div className="mt-3">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Work Holding Notes
          </Label>
          <AutoResizeTextarea
            value={data.work_holding_notes}
            onChange={(e) => update("work_holding_notes")(e.target.value)}
            className="min-h-[64px] text-sm bg-background border-border/60"
          />
        </div>
      </CardContent>
    </Card>
  );
}