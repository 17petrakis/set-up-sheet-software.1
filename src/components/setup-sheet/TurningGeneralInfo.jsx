import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import AutoResizeTextarea from "@/components/ui/AutoResizeTextarea";
import ComboBox from "@/components/ui/ComboBox";
import CascadingDropdown from "@/components/ui/CascadingDropdown";
import SectionHeader from "./SectionHeader";
import { Settings2, Plus, Trash2 } from "lucide-react";
import MaterialField from "./MaterialField";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { MATERIAL_CONDITIONS } from "@/lib/materialOptions";
import TimeInput from "@/components/ui/TimeInput";
import TurningProgramField from "./TurningProgramField";
import { getProgramMode, getDefaultProgramNumbers } from "@/lib/turningMachineConfig";
import { parseTimeToSeconds, formatSecondsToTime } from "@/lib/timeFormat";

const MACHINES = [
  { group: "MORI SIEKI", models: ["NL 2000"] },
  { group: "HAAS", models: ["SL-10"] },
  { group: "Doosan", models: ["Puma 2100Y II", "Puma MX2100ST", "SMX2100"] },
  { group: "DMG Mori", models: ["RPS-NHX-4000"] },
  { group: "Citizen", models: ["L20"] },
  { group: "Nakamura", models: ["NTY3-150", "WY-150"] },
  { group: "Manual", models: ["Manual"] },
];

const PROGRAMS = ["Mastercam", "Gibbscam", "Feature Cam", "G-Code", "N/A"];

const FLAT_MACHINES = MACHINES.flatMap(({ group, models }) =>
  models.map(m => {
    const label = group === m ? group : `${group} ${m}`;
    return { label, value: label };
  })
);

const Field = ({ label, note, value, onChange, type = "text", className = "", placeholder = "", time = false }) => (
  <div className={className}>
    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
      {label}
      {note && <span className="ml-1 normal-case font-normal text-muted-foreground/70 not-uppercase">{note}</span>}
    </Label>
    {time ? (
      <TimeInput value={value} onChange={onChange} />
    ) : (
      <Input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 text-sm bg-background border-border/60 focus:border-primary/40 transition-colors"
      />
    )}
  </div>
);



export default function TurningGeneralInfo({ data, onChange, onReplace }) {
  const update = (field) => (value) => onChange(field, value);

  const [customerNames, setCustomerNames] = useState([]);
  const [showDeburring, setShowDeburring] = useState(!!data.has_deburring);

  useEffect(() => {
    base44.entities.Customer.list("name", 200).then(list => {
      const names = list.map(c => c.name).filter(Boolean);
      setCustomerNames([...new Set(names)]);
    });
  }, []);

  // Auto-calculate total combined cycle time
  useEffect(() => {
    const c = parseTimeToSeconds(data.cycle_time);
    const h = parseTimeToSeconds(data.handling_time);
    const total = c + h;
    onChange("total_cycle_time", total > 0 ? formatSecondsToTime(total) : "");
  }, [data.cycle_time, data.handling_time]);

  // Auto-calculate total additional time
  useEffect(() => {
    const d = parseTimeToSeconds(data.deburring_time);
    const f = parseTimeToSeconds(data.finishing_time);
    const w = parseTimeToSeconds(data.wash_time);
    const total = d + f + w;
    if (total > 0 || data.total_additional_time !== undefined) {
      onChange("total_additional_time", total > 0 ? formatSecondsToTime(total) : "");
    }
  }, [data.deburring_time, data.finishing_time, data.wash_time]);

  const handleToggleDeburring = () => {
    const next = !showDeburring;
    setShowDeburring(next);
    onChange("has_deburring", next);
    // Data is preserved when hiding — only the UI collapses
  };

  const showExtrasRow = data.material_color_enabled || data.material_condition_enabled;

  const handleMachineChange = (value) => {
    onChange("machine", value);
    const mode = getProgramMode(value);
    onChange("program_numbers", mode !== "single" ? getDefaultProgramNumbers(mode) : null);
  };

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="pt-5 pb-5">
        <SectionHeader icon={Settings2} title="General Information" />

        {/* Row 1: Customer, Part Number, Rev, Part Name */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3 mb-3">
          {/* Customer */}
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

          <Field label="Part Number" value={data.part_number} onChange={update("part_number")} />
          <Field label="Rev" value={data.revision} onChange={(v) => update("revision")(v.slice(0, 5))} />
          <Field label="Part Name" value={data.part_name} onChange={update("part_name")} />
        </div>

        {/* Row 2: Machine, Machinist, CAM, Automated */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3 mb-3">
          {/* Machine select */}
          <div>
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Machine
            </Label>
            <CascadingDropdown
              value={data.machine || ""}
              onChange={handleMachineChange}
              options={MACHINES}
              placeholder="Select…"
              className="w-full"
            />
          </div>

          <Field label="Machinist" value={data.programmer} onChange={update("programmer")} />

          {/* CAM select */}
          <div>
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
              CAM
            </Label>
            <CascadingDropdown
              value={data.program_software || ""}
              onChange={update("program_software")}
              options={PROGRAMS}
              placeholder="Select…"
              className="w-full"
            />
          </div>

          {/* Automated select */}
          <div>
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Automated
            </Label>
            <CascadingDropdown
              value={data.automation || ""}
              onChange={update("automation")}
              options={["Fully", "Semi", "No"]}
              placeholder="—"
              className="w-full"
            />
          </div>
        </div>

        {/* Row 3: Material, Stock, Qty., Length/1pc (always 4 fields) */}
        <div className="grid grid-cols-2 sm:grid-cols-12 gap-x-4 gap-y-3 mb-3">
          <MaterialField data={data} onChange={onChange} materialSpan="sm:col-span-3" hideExtras />
          <Field label="Stock" value={data.stock} onChange={update("stock")} className="sm:col-span-3" />
          <Field label="Qty." value={data.quantity} onChange={(v) => update("quantity")(v.slice(0, 4))} className="sm:col-span-3" />
          <Field label="Length/1pc" value={data.consumed_per_part} onChange={(v) => update("consumed_per_part")(v.slice(0, 6))} className="sm:col-span-3" />
        </div>

        {/* Row 4: [Color+Condition] (material width), Program #, Program Location, Program Desc. */}
        {showExtrasRow ? (
          <div className="grid grid-cols-2 sm:grid-cols-12 gap-x-4 gap-y-3 mb-3">
            <div className="sm:col-span-3">
              <div className={`grid gap-x-2 ${data.material_color_enabled && data.material_condition_enabled ? "grid-cols-2" : "grid-cols-1"}`}>
                {data.material_color_enabled && (
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                      Color
                    </Label>
                    <Input
                      value={data.material_color || ""}
                      onChange={(e) => onChange("material_color", e.target.value)}
                      placeholder="e.g. Black…"
                      className="h-9 text-sm bg-background border-border/60 focus:border-primary/40 transition-colors"
                    />
                  </div>
                )}
                {data.material_condition_enabled && (
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                      Condition
                    </Label>
                    <Select
                      value={data.material_condition || ""}
                      onValueChange={(v) => onChange("material_condition", v)}
                    >
                      <SelectTrigger className="h-9 text-sm bg-background border-border/60">
                        <span className={data.material_condition ? "" : "text-muted-foreground"}>
                          {data.material_condition || "Select…"}
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        {MATERIAL_CONDITIONS.map((c) => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
            <TurningProgramField data={data} onChange={onChange} className="sm:col-span-3" />
            <Field label="Program Location" value={data.program_location} onChange={update("program_location")} className="sm:col-span-3" />
            <div className="sm:col-span-3">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                Program Desc.
              </Label>
              <Input
                value={data.program_description || ""}
                onChange={(e) => update("program_description")(e.target.value)}
                placeholder="i.e. Roughing"
                className="h-9 text-sm bg-background border-border/60 focus:border-primary/40 transition-colors"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-3 mb-3">
            <TurningProgramField data={data} onChange={onChange} />
            <Field label="Program Location" value={data.program_location} onChange={update("program_location")} />
            <div>
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                Program Desc.
              </Label>
              <Input
                value={data.program_description || ""}
                onChange={(e) => update("program_description")(e.target.value)}
                placeholder="i.e. Roughing"
                className="h-9 text-sm bg-background border-border/60 focus:border-primary/40 transition-colors"
              />
            </div>
          </div>
        )}

        {/* Row 5: Cycle Time, Handling Time, Total Combined */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 mb-1">
          <Field label="Cycle Time" value={data.cycle_time} onChange={update("cycle_time")} time />
          <Field
            label="Handling Time"
            note="(Includes Stops)"
            value={data.handling_time}
            onChange={update("handling_time")}
            time
          />
          <div>
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Total Combined Cycle Time
            </Label>
            <Input
              value={data.total_cycle_time || ""}
              readOnly
              className="h-9 text-sm bg-muted/30 border-border/60 cursor-default"
              placeholder="Auto-calculated"
            />
          </div>
        </div>

        {/* Stops */}
        <div className="mb-3">
          {(data.stops || []).map((stop, i) => (
            <div key={i} className="flex items-start gap-2 mt-2">
              <div className="flex-1">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">
                  Stop #{i + 1}
                </Label>
                <Input
                  value={stop || ""}
                  onChange={(e) => {
                    const next = [...(data.stops || [])];
                    next[i] = e.target.value;
                    onChange("stops", next);
                  }}
                  placeholder={`Stop #${i + 1} notes…`}
                  className="h-9 text-sm bg-background border-border/60 focus:border-primary/40 transition-colors"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = (data.stops || []).filter((_, idx) => idx !== i);
                  onChange("stops", next);
                }}
                className="mt-6 p-1.5 text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => onChange("stops", [...(data.stops || []), ""])}
            className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Program Stop
          </button>
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
            <span className="text-sm font-medium text-foreground">Additional Handling (Deburr/Finish/Wash)</span>
          </label>

          {showDeburring && (
            <div className="px-4 py-4 space-y-3">
              {/* Row 1: Total Additional Time */}
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

              {/* Row 2: Individual times, Row 3: notes directly below each */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-3">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    Deburring Time
                  </Label>
                  <TimeInput value={data.deburring_time} onChange={update("deburring_time")} />
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block mt-3">
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
                    Finishing Time
                  </Label>
                  <TimeInput value={data.finishing_time} onChange={update("finishing_time")} />
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block mt-3">
                    Finishing Notes
                  </Label>
                  <AutoResizeTextarea
                    value={data.finishing_notes || ""}
                    onChange={(e) => update("finishing_notes")(e.target.value)}
                    className="min-h-[64px] text-sm bg-background border-border/60"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    Wash Time
                  </Label>
                  <TimeInput value={data.wash_time} onChange={update("wash_time")} />
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block mt-3">
                    Wash Notes
                  </Label>
                  <AutoResizeTextarea
                    value={data.wash_notes || ""}
                    onChange={(e) => update("wash_notes")(e.target.value)}
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