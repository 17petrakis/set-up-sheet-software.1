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

const MACHINES = [
  { group: "Matsuura", models: ["MX-520", "MX-330", "MAM72-35 V", "H.Plus-405"] },
  { group: "Mori Seiki", models: ["NH 4000 DCG"] },
  { group: "HAAS", models: ["DT1", "VF 4SS", "DM1"] },
  { group: "OKUMA", models: ["OKUMA"] },
  { group: "HYD MECH", models: ["H-10A"] },
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

export default function GeneralInfo({ data, onChange, onReplace, machineType }) {
  const update = (field) => (value) => onChange(field, value);

  const [customerNames, setCustomerNames] = useState([]);
  const [showDeburring, setShowDeburring] = useState(!!data.has_deburring);

  useEffect(() => {
    base44.entities.Customer.list("name", 200).then(list => {
      const names = list.map(c => c.name).filter(Boolean);
      setCustomerNames([...new Set(names)]);
    });
  }, []);

  // Auto-calculate total additional time
  useEffect(() => {
    const d = parseFloat(data.deburring_time) || 0;
    const f = parseFloat(data.finishing_time) || 0;
    const w = parseFloat(data.wash_time) || 0;
    const total = d + f + w;
    if (total > 0 || data.total_additional_time !== undefined) {
      onChange("total_additional_time", total > 0 ? String(total) : "");
    }
  }, [data.deburring_time, data.finishing_time, data.wash_time]);

  const handleToggleDeburring = () => {
    const next = !showDeburring;
    setShowDeburring(next);
    onChange("has_deburring", next);
  };

  const extrasCount = (data.material_color_enabled ? 1 : 0) + (data.material_condition_enabled ? 1 : 0);
  const stockQtySpan = extrasCount === 0 ? "sm:col-span-4" : extrasCount === 1 ? "sm:col-span-3" : "sm:col-span-2";

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="pt-5 pb-5">
        <SectionHeader icon={Settings2} title="General Information" />

        {/* Row 1: Customer, Part Number, Rev */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 mb-3">
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
        </div>

        {/* Row 2: Machine, Machinist, Part Name */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-3 mb-3">
          <div>
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Machine
            </Label>
            <CascadingDropdown
              value={data.machine || ""}
              onChange={update("machine")}
              options={MACHINES}
              placeholder="Select…"
              className="w-full"
            />
          </div>

          <Field label="Machinist" value={data.programmer} onChange={update("programmer")} />
          <Field label="Part Name" value={data.part_name} onChange={update("part_name")} />
        </div>

        {/* Row 3: Material, Stock, Qty */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-x-4 gap-y-3 mb-3">
          <MaterialField data={data} onChange={onChange} />
          <Field label="Stock" value={data.stock} onChange={update("stock")} className={stockQtySpan} />
          <Field label="Qty." value={data.quantity} onChange={(v) => update("quantity")(v.slice(0, 4))} className={stockQtySpan} />
        </div>

        {/* Row 4: Program #, Program Location, CAM */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-3 mb-3">
          <Field label="Program #" value={data.program} onChange={update("program")} />
          <Field label="Program Location" value={data.program_location} onChange={update("program_location")} />
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
        </div>

        {/* Row 5: Cycle Time, Program Desc. */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-3 mb-1">
          <Field label="Cycle Time (Includes Handling)" value={data.cycle_time} onChange={update("cycle_time")} />
          <Field label="Program Desc." value={data.program_description} onChange={update("program_description")} />
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
            Add Stop
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
              {/* Times */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3">
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
                <Field label="Wash Time" value={data.wash_time} onChange={update("wash_time")} />
              </div>

              {/* Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-3">
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
                <div>
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
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