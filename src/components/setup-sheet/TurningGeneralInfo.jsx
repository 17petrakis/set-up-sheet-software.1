import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import AutoResizeTextarea from "@/components/ui/AutoResizeTextarea";
import SectionHeader from "./SectionHeader";
import { Settings2 } from "lucide-react";

const MACHINES = [
  { group: "Doosan", models: ["Puma 2100 YII", "Puma SMX 2100 ST", "Puma MX 2100 ST"] },
  { group: "Mori", models: ["NL-2000"] },
  { group: "HAAS", models: ["SL-10"] },
  { group: "Nakamura", models: ["WY-150", "NTY3-150"] },
  { group: "Citizen", models: ["Swiss"] },
  { group: "Manual", models: ["Manual"] },
];

const PROGRAMS = ["Mastercam", "Gibbscam", "Feature Cam", "G-Code", "N/A"];

const Field = ({ label, note, value, onChange, type = "text", className = "" }) => (
  <div className={className}>
    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
      {label}
      {note && <span className="ml-1 normal-case font-normal text-muted-foreground/70 not-uppercase">{note}</span>}
    </Label>
    <Input
      type={type}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 text-sm bg-background border-border/60 focus:border-primary/40 transition-colors"
    />
  </div>
);

export default function TurningGeneralInfo({ data, onChange, onReplace }) {
  const update = (field) => (value) => onChange(field, value);

  const [customerNames, setCustomerNames] = useState([]);
  const [customerMode, setCustomerMode] = useState("select");
  const [showDeburring, setShowDeburring] = useState(!!data.has_deburring);

  useEffect(() => {
    base44.entities.Customer.list("name", 200).then(list => {
      setCustomerNames(list.map(c => c.name).filter(Boolean));
    });
  }, []);

  useEffect(() => {
    if (data.customer && customerNames.length > 0) {
      const match = customerNames.some(c => c.toLowerCase() === data.customer.toLowerCase());
      setCustomerMode(match ? "select" : "new");
    }
  }, [customerNames]);

  // Auto-calculate total additional time
  useEffect(() => {
    const d = parseFloat(data.deburring_time) || 0;
    const f = parseFloat(data.finishing_time) || 0;
    const total = d + f;
    if (total > 0 || data.total_additional_time !== undefined) {
      onChange("total_additional_time", total > 0 ? String(total) : "");
    }
  }, [data.deburring_time, data.finishing_time]);

  const handleToggleDeburring = () => {
    const next = !showDeburring;
    setShowDeburring(next);
    onChange("has_deburring", next);
    if (!next) {
      onChange("deburring_time", "");
      onChange("finishing_time", "");
      onChange("total_additional_time", "");
      onChange("deburring_notes", "");
      onChange("finishing_notes", "");
    }
  };

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

        {/* Row 1: Customer, Part Number, Rev */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 mb-3">
          {/* Customer */}
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
                  >↩</button>
                )}
              </div>
            )}
          </div>

          <Field label="Part Number" value={data.part_number} onChange={update("part_number")} />
          <Field label="Rev" value={data.revision} onChange={update("revision")} />
        </div>

        {/* Row 2: Machine, Machinist, Program */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 mb-3">
          {/* Machine grouped dropdown */}
          <div>
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Machine
            </Label>
            <Select value={data.machine || ""} onValueChange={update("machine")}>
              <SelectTrigger className="h-9 text-sm bg-background border-border/60">
                <SelectValue placeholder="Select machine…" />
              </SelectTrigger>
              <SelectContent>
                {MACHINES.map(({ group, models }) => (
                  <SelectGroup key={group}>
                    <SelectLabel className="text-xs font-semibold text-muted-foreground px-2 py-1">{group}</SelectLabel>
                    {models.map(m => (
                      <SelectItem key={m} value={`${group} – ${m}`} className="pl-5">
                        {m}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Field label="Machinist" value={data.programmer} onChange={update("programmer")} />

          {/* Program dropdown */}
          <div>
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Program
            </Label>
            <Select value={data.program_software || ""} onValueChange={update("program_software")}>
              <SelectTrigger className="h-9 text-sm bg-background border-border/60">
                <SelectValue placeholder="Select…" />
              </SelectTrigger>
              <SelectContent>
                {PROGRAMS.map(p => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 3: Material, Stock, Quantity, Consumed per Part */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3 mb-3">
          <Field label="Material" value={data.material} onChange={update("material")} />
          <Field label="Stock" value={data.stock} onChange={update("stock")} />
          <Field
            label="Quantity"
            note="(W/Material Insp.)"
            value={data.quantity}
            onChange={update("quantity")}
          />
          <Field label="Consumed per Part" value={data.consumed_per_part} onChange={update("consumed_per_part")} />
        </div>

        {/* Row 4: Program #, Program Location */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-3">
          <Field label="Program #" value={data.program} onChange={update("program")} />
          <Field label="Program Location" value={data.program_location} onChange={update("program_location")} />
        </div>

        {/* Row 5: Cycle Time, Handling Time, Total Combined */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 mb-3">
          <Field label="Cycle Time" value={data.cycle_time} onChange={update("cycle_time")} />
          <Field
            label="Handling Time"
            note="(W/Material Insp.)"
            value={data.handling_time}
            onChange={update("handling_time")}
          />
          <Field label="Total Combined Cycle Time" value={data.total_cycle_time} onChange={update("total_cycle_time")} />
        </div>

        {/* Deburring / Finishing checkbox */}
        <div className="mt-4 border border-border/50 rounded-lg overflow-hidden">
          <label className="flex items-center gap-3 px-4 py-2.5 bg-muted/40 hover:bg-muted/60 transition-colors cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showDeburring}
              onChange={handleToggleDeburring}
              className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
            />
            <span className="text-sm font-medium text-foreground">Deburring / Finishing</span>
          </label>

          {showDeburring && (
            <div className="px-4 py-4 space-y-3">
              {/* Times */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    Total Additional Time
                  </Label>
                  <Input
                    value={data.total_additional_time || ""}
                    readOnly
                    className="h-9 text-sm bg-muted/30 border-border/60 cursor-default"
                    placeholder="Auto-calculated"
                  />
                </div>
                <Field label="Deburring Time" value={data.deburring_time} onChange={update("deburring_time")} />
                <Field label="Finishing Time" value={data.finishing_time} onChange={update("finishing_time")} />
              </div>

              {/* Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    Deburring Notes
                  </Label>
                  <AutoResizeTextarea
                    value={data.deburring_notes || ""}
                    onChange={(e) => update("deburring_notes")(e.target.value)}
                    className="min-h-[64px] text-sm bg-background border-border/60"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    Finishing Notes
                  </Label>
                  <AutoResizeTextarea
                    value={data.finishing_notes || ""}
                    onChange={(e) => update("finishing_notes")(e.target.value)}
                    className="min-h-[64px] text-sm bg-background border-border/60"
                  />
                </div>
              </div>
            </div>
          )}
        </div>


      </CardContent>
    </Card>
  );
}