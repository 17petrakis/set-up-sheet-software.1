import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AutoResizeTextarea from "@/components/ui/AutoResizeTextarea";
import SectionHeader from "./SectionHeader";
import { Wrench, ChevronRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ── Cascading Chuck Type Dropdown ──────────────────────────────────────────────
const CHUCK_OPTIONS = [
  { label: '8" 3-Jaw', value: '8" 3-Jaw' },
  { label: '6" 3-Jaw', value: '6" 3-Jaw' },
  {
    label: 'Collet', children: [
      { label: 'NL', value: 'Collet – NL' },
      { label: 'Nak', value: 'Collet – Nak' },
    ]
  },
  { label: 'Other', value: '__other__' },
];

function ChuckTypeDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(null);
  const [otherVal, setOtherVal] = useState(
    value && !['8" 3-Jaw', '6" 3-Jaw', 'Collet – NL', 'Collet – Nak'].includes(value) ? value : ""
  );
  const [showOtherInput, setShowOtherInput] = useState(
    value && !['8" 3-Jaw', '6" 3-Jaw', 'Collet – NL', 'Collet – Nak'].includes(value) && value !== ""
  );
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setHovered(null); } };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const displayValue = showOtherInput ? (otherVal || "Other") : (value || "Select…");

  const handleSelect = (val) => {
    if (val === '__other__') {
      setShowOtherInput(true);
      setOpen(false);
      setHovered(null);
      onChange(otherVal || "");
    } else {
      setShowOtherInput(false);
      onChange(val);
      setOpen(false);
      setHovered(null);
    }
  };

  if (showOtherInput) {
    return (
      <div className="flex gap-1">
        <Input
          value={otherVal}
          onChange={(e) => { setOtherVal(e.target.value); onChange(e.target.value); }}
          placeholder="Enter chuck type"
          className="h-9 text-sm bg-background border-border/60"
        />
        <button
          type="button"
          onClick={() => { setShowOtherInput(false); onChange(""); }}
          className="shrink-0 px-2 text-xs text-muted-foreground hover:text-foreground border border-border/60 rounded-md bg-background"
          title="Back to list"
        >↩</button>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setHovered(null); }}
        className="w-full h-9 px-3 text-sm bg-background border border-border/60 rounded-md text-left flex items-center justify-between hover:border-border focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <span className={value ? "text-foreground" : "text-muted-foreground"}>{displayValue}</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground rotate-90 shrink-0" />
      </button>
      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 w-44 bg-popover border border-border rounded-md shadow-lg py-1">
          {CHUCK_OPTIONS.map((opt) => (
            <div
              key={opt.label}
              className="relative"
              onMouseEnter={() => setHovered(opt.label)}
              onMouseLeave={() => setHovered(null)}
            >
              <div
                onClick={() => !opt.children && handleSelect(opt.value)}
                className={`flex items-center justify-between px-3 py-2 text-sm cursor-pointer rounded-sm mx-1 ${hovered === opt.label ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent"}`}
              >
                <span>{opt.label}</span>
                {opt.children && <ChevronRight className="w-3.5 h-3.5" />}
              </div>
              {opt.children && hovered === opt.label && (
                <div className="absolute left-full top-0 ml-1 w-40 bg-popover border border-border rounded-md shadow-lg py-1 z-50">
                  {opt.children.map(child => (
                    <div
                      key={child.value}
                      onClick={() => handleSelect(child.value)}
                      className="px-3 py-2 text-sm cursor-pointer rounded-sm mx-1 hover:bg-primary hover:text-primary-foreground"
                    >
                      {child.label}
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

// ── Cascading Accessories Dropdown ─────────────────────────────────────────────
const ACCESSORY_OPTIONS = [
  { label: 'None', value: 'None' },
  {
    label: 'Liner', children: [
      { label: 'Black', value: 'Liner – Black', hasInput: true, placeholder: 'Size' },
      { label: 'Red', value: 'Liner – Red', hasInput: true, placeholder: 'Size' },
    ]
  },
  { label: 'Coolant Plug', value: 'Coolant Plug' },
  { label: 'Work Stop', value: 'Work Stop', hasInput: true, placeholder: 'Size & Length' },
  { label: 'Ejector', value: 'Ejector' },
  { label: 'Bar Feeder', value: 'Bar Feeder' },
];

function AccessoriesDropdown({ value, extraValue, onChange, onExtraChange }) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setHovered(null); } };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const needsExtra = value && (value.startsWith('Liner') || value === 'Work Stop');

  const handleSelect = (val) => { onChange(val); onExtraChange(""); setOpen(false); setHovered(null); };

  return (
    <div className="space-y-1.5">
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => { setOpen(o => !o); setHovered(null); }}
          className="w-full h-9 px-3 text-sm bg-background border border-border/60 rounded-md text-left flex items-center justify-between hover:border-border focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <span className={value ? "text-foreground" : "text-muted-foreground"}>{value || "Select…"}</span>
          <ChevronRight className="w-4 h-4 text-muted-foreground rotate-90 shrink-0" />
        </button>
        {open && (
          <div className="absolute z-50 top-full left-0 mt-1 w-44 bg-popover border border-border rounded-md shadow-lg py-1">
            {ACCESSORY_OPTIONS.map((opt) => (
              <div
                key={opt.label}
                className="relative"
                onMouseEnter={() => setHovered(opt.label)}
                onMouseLeave={() => setHovered(null)}
              >
                <div
                  onClick={() => !opt.children && handleSelect(opt.value)}
                  className={`flex items-center justify-between px-3 py-2 text-sm cursor-pointer rounded-sm mx-1 ${hovered === opt.label ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent"}`}
                >
                  <span>{opt.label}</span>
                  {opt.children && <ChevronRight className="w-3.5 h-3.5" />}
                </div>
                {opt.children && hovered === opt.label && (
                  <div className="absolute left-full top-0 ml-1 w-44 bg-popover border border-border rounded-md shadow-lg py-1 z-50">
                    {opt.children.map(child => (
                      <div
                        key={child.value}
                        onClick={() => handleSelect(child.value)}
                        className="px-3 py-2 text-sm cursor-pointer rounded-sm mx-1 hover:bg-primary hover:text-primary-foreground"
                      >
                        {child.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {needsExtra && (
        <Input
          value={extraValue || ""}
          onChange={(e) => onExtraChange(e.target.value)}
          placeholder={value === 'Work Stop' ? 'Size & Length' : 'Size'}
          className="h-9 text-sm bg-background border-border/60"
        />
      )}
    </div>
  );
}

// ── Jaw Type Dropdown ──────────────────────────────────────────────────────────
const JAW_TYPES = ['Hard Jaw', 'Soft Jaw', 'Mounted Fixture'];

function JawTypeDropdown({ value, onChange }) {
  const [showOther, setShowOther] = useState(value && !JAW_TYPES.includes(value) && value !== "");
  const [otherVal, setOtherVal] = useState(showOther ? value : "");

  if (showOther) {
    return (
      <div className="flex gap-1">
        <Input
          value={otherVal}
          onChange={(e) => { setOtherVal(e.target.value); onChange(e.target.value); }}
          placeholder="Enter jaw type"
          className="h-9 text-sm bg-background border-border/60"
        />
        <button
          type="button"
          onClick={() => { setShowOther(false); onChange(""); }}
          className="shrink-0 px-2 text-xs text-muted-foreground hover:text-foreground border border-border/60 rounded-md bg-background"
          title="Back to list"
        >↩</button>
      </div>
    );
  }

  return (
    <Select value={value || ""} onValueChange={(v) => { if (v === '__other__') { setShowOther(true); onChange(""); } else { onChange(v); } }}>
      <SelectTrigger className="h-9 text-sm bg-background border-border/60">
        <SelectValue placeholder="Select…" />
      </SelectTrigger>
      <SelectContent>
        {JAW_TYPES.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}
        <SelectItem value="__other__">Other…</SelectItem>
      </SelectContent>
    </Select>
  );
}

// ── Bar Feeder Fields ──────────────────────────────────────────────────────────
function BarFeederFields({ data, onChange }) {
  const f = (field) => (e) => onChange({ ...data, [field]: e.target.value });
  return (
    <div className="mt-3 border border-border/50 rounded-lg overflow-hidden">
      <div className="bg-muted/40 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Bar Feeder Setup
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 px-4 py-3">
        <FieldWrap label="PCG Gripper Size">
          <Input value={data.bf_pcg_gripper_size || ""} onChange={f("bf_pcg_gripper_size")} placeholder="e.g. 12-18mm" className="h-9 text-sm bg-background border-border/60" />
        </FieldWrap>
        <FieldWrap label="Push Rod Ø">
          <Input value={data.bf_push_rod || ""} onChange={f("bf_push_rod")} placeholder='e.g. 1/2"' className="h-9 text-sm bg-background border-border/60" />
        </FieldWrap>
        <FieldWrap label="Part Library #">
          <Input value={data.bf_part_library || ""} onChange={f("bf_part_library")} className="h-9 text-sm bg-background border-border/60" />
        </FieldWrap>
        <FieldWrap label="Set Bar Ø To">
          <Input value={data.bf_set_bar_dia || ""} onChange={f("bf_set_bar_dia")} className="h-9 text-sm bg-background border-border/60" />
        </FieldWrap>
        <FieldWrap label="Total Part Feedout">
          <Input value={data.bf_total_feedout || ""} onChange={f("bf_total_feedout")} className="h-9 text-sm bg-background border-border/60" />
        </FieldWrap>
        <FieldWrap label="Top Cut Position">
          <Input value={data.bf_top_cut_pos || ""} onChange={f("bf_top_cut_pos")} className="h-9 text-sm bg-background border-border/60" />
        </FieldWrap>
        <FieldWrap label="End of Bar Signal Position">
          <Input value={data.bf_end_bar_signal || ""} onChange={f("bf_end_bar_signal")} className="h-9 text-sm bg-background border-border/60" />
        </FieldWrap>
        <FieldWrap label="Torque Rate High Feed %">
          <Input value={data.bf_torque_high_feed || ""} onChange={f("bf_torque_high_feed")} className="h-9 text-sm bg-background border-border/60" />
        </FieldWrap>
        <FieldWrap label="Torque Rate Part Feedout %">
          <Input value={data.bf_torque_feedout || ""} onChange={f("bf_torque_feedout")} className="h-9 text-sm bg-background border-border/60" />
        </FieldWrap>
      </div>
    </div>
  );
}

// ── Reusable field wrapper ─────────────────────────────────────────────────────
function FieldWrap({ label, children }) {
  return (
    <div>
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}

// ── Chuck Pressure with unit toggle ────────────────────────────────────────────
function ChuckPressureField({ value, unit, onValueChange, onUnitChange }) {
  return (
    <div className="flex gap-1">
      <Input
        value={value || ""}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder="e.g. 60"
        className="h-9 text-sm bg-background border-border/60"
      />
      <Select value={unit || "PSI"} onValueChange={onUnitChange}>
        <SelectTrigger className="h-9 text-sm bg-background border-border/60 w-20 shrink-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="PSI">PSI</SelectItem>
          <SelectItem value="Bar">Bar</SelectItem>
          <SelectItem value="MPa">MPa</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

// ── Spindle Form (shown when checkbox is checked) ──────────────────────────────
function SpindleForm({ spindleKey, label, data, onChange }) {
  const s = data[spindleKey] || {};
  const set = (field, val) => onChange({ ...data, [spindleKey]: { ...s, [field]: val } });

  return (
    <div className="mt-3 border border-border/50 rounded-lg overflow-hidden">
      <div className="bg-muted/30 px-4 py-2.5 text-sm font-semibold text-foreground border-b border-border/40">
        {label}
      </div>
      <div className="px-4 py-4 space-y-3">
        {/* Row 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-3">
          <FieldWrap label="Chuck Type">
            <ChuckTypeDropdown value={s.chuck_type || ""} onChange={(v) => set("chuck_type", v)} />
          </FieldWrap>
          <FieldWrap label="Jaw Type">
            <JawTypeDropdown value={s.jaw_type || ""} onChange={(v) => set("jaw_type", v)} />
          </FieldWrap>
          <FieldWrap label="Jaw Description">
            <Input
              value={s.jaw_description || ""}
              onChange={(e) => set("jaw_description", e.target.value)}
              placeholder='e.g. 2.5" Dia x 0.3" Steel Step Jaw'
              className="h-9 text-sm bg-background border-border/60"
            />
          </FieldWrap>
        </div>
        {/* Row 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-3">
          <FieldWrap label="Min Grip Length">
            <Input
              value={s.min_grip_length || ""}
              onChange={(e) => set("min_grip_length", e.target.value)}
              className="h-9 text-sm bg-background border-border/60"
            />
          </FieldWrap>
          <FieldWrap label="Accessories">
            <AccessoriesDropdown
              value={s.accessories || ""}
              extraValue={s.accessories_extra || ""}
              onChange={(v) => set("accessories", v)}
              onExtraChange={(v) => set("accessories_extra", v)}
            />
          </FieldWrap>
          <FieldWrap label="Chuck Pressure">
            <ChuckPressureField
              value={s.chuck_pressure || ""}
              unit={s.chuck_pressure_unit || "PSI"}
              onValueChange={(v) => set("chuck_pressure", v)}
              onUnitChange={(v) => set("chuck_pressure_unit", v)}
            />
          </FieldWrap>
        </div>
        {/* Row 3 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
          <FieldWrap label="Concentricity">
            <Input
              value={s.concentricity || ""}
              onChange={(e) => set("concentricity", e.target.value)}
              className="h-9 text-sm bg-background border-border/60"
            />
          </FieldWrap>
          <FieldWrap label="Surface Finish">
            <Input
              value={s.surface_finish || ""}
              onChange={(e) => set("surface_finish", e.target.value)}
              className="h-9 text-sm bg-background border-border/60"
            />
          </FieldWrap>
        </div>
        {/* Notes */}
        <FieldWrap label="Notes">
          <AutoResizeTextarea
            value={s.notes || ""}
            onChange={(e) => set("notes", e.target.value)}
            className="min-h-[64px] text-sm bg-background border-border/60"
          />
        </FieldWrap>

        {/* Bar Feeder extra fields */}
        {s.accessories === 'Bar Feeder' && (
          <BarFeederFields data={s} onChange={(updated) => onChange({ ...data, [spindleKey]: updated })} />
        )}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function TurningChuckSection({ data, onChange }) {
  const s1Active = !!data.wh_s1_active;
  const s2Active = !!data.wh_s2_active;

  const toggle = (field) => () => onChange({ ...data, [field]: !data[field] });

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="pt-5 pb-5">
        <SectionHeader icon={Wrench} title="Work Holding" />

        <div className="flex flex-wrap gap-6 mb-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={s1Active}
              onChange={toggle("wh_s1_active")}
              className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
            />
            <span className="text-sm font-medium text-foreground">S1 Main</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={s2Active}
              onChange={toggle("wh_s2_active")}
              className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
            />
            <span className="text-sm font-medium text-foreground">S2 Sub</span>
          </label>
        </div>

        {s1Active && (
          <SpindleForm
            spindleKey="wh_s1"
            label="S1 Main"
            data={data}
            onChange={onChange}
          />
        )}
        {s2Active && (
          <SpindleForm
            spindleKey="wh_s2"
            label="S2 Sub"
            data={data}
            onChange={onChange}
          />
        )}

        {!s1Active && !s2Active && (
          <p className="text-sm text-muted-foreground mt-2">Select S1 Main or S2 Sub to configure work holding.</p>
        )}
      </CardContent>
    </Card>
  );
}