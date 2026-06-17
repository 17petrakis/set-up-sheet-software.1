import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import AutoResizeTextarea from "@/components/ui/AutoResizeTextarea";
import SectionHeader from "./SectionHeader";
import { Settings2, ChevronRight, Plus, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";

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

// Cascading machine dropdown
function MachineDropdown({ value, onSelect }) {
  const [open, setOpen] = useState(false);
  const [hoveredGroup, setHoveredGroup] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setHoveredGroup(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setHoveredGroup(null); }}
        className="w-full h-9 px-3 text-sm bg-background border border-border/60 rounded-md text-left flex items-center justify-between hover:border-border focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <span className={value ? "text-foreground" : "text-muted-foreground"}>
          {value || "Select machine…"}
        </span>
        <ChevronRight className="w-4 h-4 text-muted-foreground rotate-90" />
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 w-44 bg-popover border border-border rounded-md shadow-lg py-1">
          {MACHINES.map(({ group, models }) => (
            <div
              key={group}
              className="relative"
              onMouseEnter={() => setHoveredGroup(group)}
              onMouseLeave={() => setHoveredGroup(null)}
            >
              <div className={`flex items-center justify-between px-3 py-2 text-sm cursor-default select-none rounded-sm mx-1 ${hoveredGroup === group ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent hover:text-accent-foreground"}`}>
                <span>{group}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>

              {hoveredGroup === group && (
                <div className="absolute left-full top-0 ml-1 w-52 bg-popover border border-border rounded-md shadow-lg py-1">
                  {models.map(m => (
                    <div
                      key={m}
                      onClick={() => { onSelect(`${group} ${m}`); setOpen(false); setHoveredGroup(null); }}
                      className="px-3 py-2 text-sm cursor-pointer rounded-sm mx-1 hover:bg-primary hover:text-primary-foreground"
                    >
                      {m}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TurningGeneralInfo({ data, onChange, onReplace }) {
  const update = (field) => (value) => onChange(field, value);

  const [customerNames, setCustomerNames] = useState([]);
  const [customerMode, setCustomerMode] = useState("select");
  const [showHandling, setShowHandling] = useState(!!data.has_deburring);

  // The three possible add-on handling tasks
  const HANDLING_TASKS = [
    { key: "wash",      label: "Wash" },
    { key: "deburr",    label: "Deburr" },
    { key: "finishing", label: "Finishing" },
  ];

  // A task is "active" if it has data or was explicitly marked active.
  // Also handle legacy fields: deburring_time -> deburr, finishing_time -> finishing
  const isTaskActive = (key) => {
    if (key === "deburr") return !!(data.deburr_time || data.deburr_notes || data.deburr_active || data.deburring_time || data.deburring_notes);
    if (key === "finishing") return !!(data.finishing_time || data.finishing_notes || data.finishing_active);
    return !!(data[`${key}_time`] || data[`${key}_notes`] || data[`${key}_active`]);
  };

  const [activeTasks, setActiveTasks] = useState(() =>
    HANDLING_TASKS.filter(t => isTaskActive(t.key)).map(t => t.key)
  );

  const addTask = (key) => {
    setActiveTasks(prev => [...prev, key]);
    onChange(`${key}_active`, true);
  };

  const removeTask = (key) => {
    setActiveTasks(prev => prev.filter(k => k !== key));
    onChange(`${key}_active`, false);
    onChange(`${key}_time`, "");
    onChange(`${key}_notes`, "");
  };

  useEffect(() => {
    base44.entities.Customer.list("name", 200).then(list => {
      const names = list.map(c => c.name).filter(Boolean);
      setCustomerNames([...new Set(names)]);
    });
  }, []);

  useEffect(() => {
    if (data.customer && customerNames.length > 0) {
      const match = customerNames.some(c => c.toLowerCase() === data.customer.toLowerCase());
      setCustomerMode(match ? "select" : "new");
    }
  }, [customerNames]);

  // Auto-calculate total additional time from all three task times (with legacy fallback for deburr)
  useEffect(() => {
    const wash = parseFloat(data.wash_time) || 0;
    const deburr = parseFloat(data.deburr_time) || parseFloat(data.deburring_time) || 0;
    const finishing = parseFloat(data.finishing_time) || 0;
    const total = wash + deburr + finishing;
    onChange("total_additional_time", total > 0 ? String(total) : "");
  }, [data.wash_time, data.deburr_time, data.deburring_time, data.finishing_time]);

  const handleToggleHandling = () => {
    const next = !showHandling;
    setShowHandling(next);
    onChange("has_deburring", next);
    // Data is preserved when hiding — only the UI collapses
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
          {/* Machine cascading dropdown */}
          <div>
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Machine
            </Label>
            <MachineDropdown value={data.machine} onSelect={update("machine")} />
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
            note="(Includes Inspection)"
            value={data.handling_time}
            onChange={update("handling_time")}
          />
          <Field label="Total Combined Cycle Time" value={data.total_cycle_time} onChange={update("total_cycle_time")} />
        </div>

        {/* Additional Handling section */}
        <div className="mt-4 border border-border/50 rounded-lg overflow-hidden">
          <label className="flex items-center gap-3 px-4 py-2.5 bg-muted/40 hover:bg-muted/60 transition-colors cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showHandling}
              onChange={handleToggleHandling}
              className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
            />
            <span className="text-sm font-medium text-foreground">Additional Handling (Deburr/Finish/Wash)</span>
          </label>

          {showHandling && (
            <div className="px-4 py-4 space-y-4">
              {/* Total Additional Time — always shown */}
              <div className="max-w-[180px]">
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

              {/* Active task cards */}
              {activeTasks.map(key => {
                const task = HANDLING_TASKS.find(t => t.key === key);
                return (
                  <div key={key} className="border border-border/40 rounded-lg">
                    <div className="flex items-center justify-between px-4 py-2 bg-muted/30 rounded-t-lg border-b border-border/30">
                      <span className="text-sm font-semibold text-foreground">{task.label}</span>
                      <button
                        type="button"
                        onClick={() => removeTask(key)}
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                        title={`Remove ${task.label}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="px-4 py-3 space-y-3">
                      <Field
                        label={`${task.label} Time`}
                        value={key === "deburr" ? (data.deburr_time || data.deburring_time || "") : data[`${key}_time`]}
                        onChange={update(`${key}_time`)}
                        className="max-w-[180px]"
                      />
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                          {task.label} Notes
                        </Label>
                        <AutoResizeTextarea
                          value={key === "deburr" ? (data.deburr_notes || data.deburring_notes || "") : (data[`${key}_notes`] || "")}
                          onChange={(e) => update(`${key}_notes`)(e.target.value)}
                          className="min-h-[56px] text-sm bg-background border-border/60"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Add task buttons for tasks not yet active */}
              {HANDLING_TASKS.filter(t => !activeTasks.includes(t.key)).length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {HANDLING_TASKS.filter(t => !activeTasks.includes(t.key)).map(t => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => addTask(t.key)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary border border-dashed border-border/60 hover:border-primary/50 rounded-md px-2.5 py-1.5 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      {t.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>


      </CardContent>
    </Card>
  );
}