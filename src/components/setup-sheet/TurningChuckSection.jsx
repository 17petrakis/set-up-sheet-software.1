import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AutoResizeTextarea from "@/components/ui/AutoResizeTextarea";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import SectionHeader from "./SectionHeader";
import { Wrench, X, Plus } from "lucide-react";
import InlinePhotoField from "./InlinePhotoField";

// ── Chuck Type ComboBox ────────────────────────────────────────────────────────
const CHUCK_OPTIONS = [
  { label: '8" 3-Jaw', value: '8" 3-Jaw' },
  { label: '6" 3-Jaw', value: '6" 3-Jaw' },
  { label: 'Collet – NJ-5', value: 'Collet – NJ-5' },
  { label: 'Collet – Flex-C65', value: 'Collet – Flex-C65' },
];

// Machine → chuck type mapping. Machines not listed (Manual, Citizen) use manual input.
const MACHINE_CHUCK_MAP = {
  "Doosan Puma 2100 YII": { main: '8" 3-Jaw', sub: '8" 3-Jaw', allowSub: false },
  "Doosan Puma SMX 2100 ST": { main: '8" 3-Jaw', sub: '8" 3-Jaw', allowSub: true },
  "HAAS SL-10": { main: '6" 3-Jaw', sub: null, allowSub: false },
  "Nakamura WY-150": { main: 'Collet – Flex-C65', sub: 'Collet – Flex-C65', allowSub: true },
  "Nakamura NTY3-150": { main: 'Collet – Flex-C65', sub: 'Collet – Flex-C65', allowSub: true },
  "Mori NL-2000": { main: 'Collet – NJ-5', sub: '6" 3-Jaw', allowSub: true },
};

function ChuckTypeDropdown({ value, onChange }) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger className="h-9 text-sm bg-background border-border/60 px-3 w-full">
        <SelectValue placeholder="Select…" />
      </SelectTrigger>
      <SelectContent>
        {CHUCK_OPTIONS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

// ── Accessories ComboBox ───────────────────────────────────────────────────────
function getAccessoryOptions(spindleKey) {
  const isMain = spindleKey === "wh_s1";
  const isSub = spindleKey === "wh_s2";
  const options = ['None', 'Coolant Plug Front', 'Coolant Plug Back', 'Work Stop'];
  if (isMain) {
    options.push('Liner (Black +.03)', 'Liner (Red +.05)', 'Bar Feeder');
  }
  if (isSub) {
    options.push('Ejector');
  }
  return options;
}

function AccessoriesDropdown({ value, onChange, spindleKey }) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger className="h-9 text-sm bg-background border-border/60 px-3 w-full">
        <SelectValue placeholder="Select…" />
      </SelectTrigger>
      <SelectContent>
        {getAccessoryOptions(spindleKey).map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

// ── Jaw Type ComboBox ──────────────────────────────────────────────────────────
const JAW_TYPES = ['Hard Jaw', 'Soft Jaw', 'Mounted Fixture'];

function JawTypeDropdown({ value, onChange }) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger className="h-9 text-sm bg-background border-border/60 px-3 w-full">
        <SelectValue placeholder="Select…" />
      </SelectTrigger>
      <SelectContent>
        {JAW_TYPES.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

// ── Bar Feeder Fields ──────────────────────────────────────────────────────────
function BarFeederFields({ data, onChange }) {
  const f = (field) => (e) => onChange({ ...data, [field]: e.target.value });
  return (
    <div className="mt-3 border border-border/50 rounded-lg">
      <div className="bg-muted/40 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground rounded-t-lg">
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
      <select
        value={unit || "PSI"}
        onChange={(e) => onUnitChange(e.target.value)}
        className="h-9 text-sm px-3 w-20 shrink-0 bg-background border border-border/60 rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <option value="PSI">PSI</option>
        <option value="Bar">Bar</option>
        <option value="MPa">MPa</option>
      </select>
    </div>
  );
}

// ── Optional add-on fields for spindle ────────────────────────────────────────
const OPTIONAL_SPINDLE_FIELDS = [
  { key: "concentricity", label: "Concentricity", type: "input", placeholder: "" },
  { key: "surface_finish", label: "Surface Finish", type: "input", placeholder: "" },
  { key: "parts_catcher", label: "Parts Catcher", type: "input", placeholder: "" },
  { key: "photo", label: "Photo", type: "photo" },
  { key: "notes", label: "Notes", type: "textarea" },
];

// ── Spindle Form (shown when checkbox is checked) ──────────────────────────────
function SpindleForm({ spindleKey, label, data, onChange }) {
  const s = data[spindleKey] || {};
  const machineConfig = MACHINE_CHUCK_MAP[data.machine];
  const isChuckLocked = !!machineConfig;
  const set = (field, val) => onChange({ ...data, [spindleKey]: { ...s, [field]: val } });
  const setAndClear = (field, val) => onChange({ ...data, [spindleKey]: { ...s, [field]: val } });

  const [localAccessories, setLocalAccessories] = useState(s.accessories || "");

  useEffect(() => { setLocalAccessories(s.accessories || ""); }, [s.accessories]);

  const handleAccessoriesChange = (val) => {
    setLocalAccessories(val);
    set("accessories", val);
    set("accessories_extra", "");
  };

  const needsExtra = localAccessories.startsWith('Liner') || localAccessories === 'Work Stop';

  const chuckType = s.chuck_type || "";
  const jawType = s.jaw_type || "";
  const isColletChuck = chuckType.includes("NJ-5") || chuckType.includes("FlexC");

  let descLabel = "Jaw Description";
  let showFixtureDesc = false;
  if (jawType === "Soft Jaw") {
    descLabel = "Jaw Description";
    showFixtureDesc = true;
  } else if (jawType === "Mounted Fixture") {
    descLabel = "Fixture Description";
  } else if (chuckType.includes("3-Jaw")) {
    descLabel = "Collet Description";
  }

  // Track which optional fields are visible (added). A field is visible if it has a value saved OR was added this session.
  const [addedFields, setAddedFields] = useState(() =>
    OPTIONAL_SPINDLE_FIELDS.filter(f => !!s[f.key]).map(f => f.key)
  );

  const isFieldVisible = (key) => addedFields.includes(key) || !!s[key];
  const addField = (key) => setAddedFields(prev => [...prev, key]);
  const removeField = (key) => {
    setAddedFields(prev => prev.filter(k => k !== key));
    set(key, "");
  };

  const hiddenFields = OPTIONAL_SPINDLE_FIELDS.filter(f => !isFieldVisible(f.key));

  return (
    <div className="mt-3 border border-border/50 rounded-lg">
      <div className="bg-muted/30 px-4 py-2.5 text-sm font-semibold text-foreground border-b border-border/40 rounded-t-lg">
        {label}
      </div>
      <div className="px-4 py-4 space-y-3">
        {/* Row 1: Chuck Type, Jaw Type, Chuck Pressure, Initial Stickout */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_1.5fr] gap-x-4 gap-y-3">
          <FieldWrap label="Chuck Type">
            {isChuckLocked ? (
              <Input
                value={s.chuck_type || ""}
                readOnly
                className="h-9 text-sm bg-muted/30 border-border/60 cursor-default"
              />
            ) : (
              <Input
                value={s.chuck_type || ""}
                onChange={(e) => set("chuck_type", e.target.value)}
                placeholder="Enter chuck type…"
                className="h-9 text-sm bg-background border-border/60"
              />
            )}
          </FieldWrap>
          <FieldWrap label={isColletChuck ? "Collet" : "Jaw Type"}>
            {isColletChuck ? (
              <Input
                value={s.jaw_type || ""}
                onChange={(e) => set("jaw_type", e.target.value)}
                placeholder="Enter collet…"
                className="h-9 text-sm bg-background border-border/60"
              />
            ) : (
              <JawTypeDropdown value={s.jaw_type || ""} onChange={(v) => set("jaw_type", v)} />
            )}
          </FieldWrap>
          <FieldWrap label="Chuck Pressure">
            <ChuckPressureField
              value={s.chuck_pressure || ""}
              unit={s.chuck_pressure_unit || "PSI"}
              onValueChange={(v) => set("chuck_pressure", v)}
              onUnitChange={(v) => set("chuck_pressure_unit", v)}
            />
          </FieldWrap>
          <FieldWrap label="Initial Stickout">
            <Input
              value={s.initial_stickout || ""}
              onChange={(e) => set("initial_stickout", e.target.value)}
              placeholder='e.g. 2.500"'
              className="h-9 text-sm bg-background border-border/60"
            />
          </FieldWrap>
        </div>
        {/* Row 2: Jaw Description (wide), Min Grip Length, Spindle Accessories */}
        <div className={`grid grid-cols-1 gap-x-4 gap-y-3 ${showFixtureDesc ? 'sm:grid-cols-3' : 'sm:grid-cols-[2fr_1fr_1fr]'}`}>
          <FieldWrap label={descLabel}>
            <Input
              value={s.jaw_description || ""}
              onChange={(e) => set("jaw_description", e.target.value)}
              placeholder='e.g. 2.5" Dia x 0.3" Steel Step Jaw'
              className="h-9 text-sm bg-background border-border/60"
            />
          </FieldWrap>
          {showFixtureDesc && (
            <FieldWrap label="Fixture Description">
              <Input
                value={s.fixture_description || ""}
                onChange={(e) => set("fixture_description", e.target.value)}
                placeholder="Describe fixture…"
                className="h-9 text-sm bg-background border-border/60"
              />
            </FieldWrap>
          )}
          <FieldWrap label="Min Grip Length">
            <Input
              value={s.min_grip_length || ""}
              onChange={(e) => set("min_grip_length", e.target.value)}
              className="h-9 text-sm bg-background border-border/60"
            />
          </FieldWrap>
          <FieldWrap label="Spindle Accessories">
            <AccessoriesDropdown
              value={localAccessories}
              onChange={handleAccessoriesChange}
              spindleKey={spindleKey}
            />
          </FieldWrap>
        </div>

        {/* Size input for Liner / Work Stop */}
        {needsExtra && (
          <Input
            value={s.accessories_extra || ""}
            onChange={(e) => set("accessories_extra", e.target.value)}
            placeholder={localAccessories === 'Work Stop' ? 'Work Stop Description' : 'Size'}
            className="h-9 text-sm bg-background border-border/60"
          />
        )}



        {/* Bar Feeder fields */}
        {localAccessories === 'Bar Feeder' && (
          <BarFeederFields data={s} onChange={(updated) => onChange({ ...data, [spindleKey]: updated })} />
        )}

        {/* Optional added fields */}
        {OPTIONAL_SPINDLE_FIELDS.filter(f => isFieldVisible(f.key)).map(f => (
          <div key={f.key} className="flex items-start gap-2">
            <div className="flex-1">
              {f.type === "photo" ? (
                <InlinePhotoField
                  value={s[f.key] || ""}
                  note={s[`${f.key}__note`] || ""}
                  onUpload={(url) => set(f.key, url)}
                  onRemove={() => { set(f.key, ""); set(`${f.key}__note`, ""); }}
                  onNoteChange={(n) => set(`${f.key}__note`, n)}
                />
              ) : (
                <FieldWrap label={f.label}>
                  {f.type === "textarea" ? (
                    <AutoResizeTextarea
                      value={s[f.key] || ""}
                      onChange={(e) => set(f.key, e.target.value)}
                      className="min-h-[64px] text-sm bg-background border-border/60"
                    />
                  ) : (
                    <Input
                      value={s[f.key] || ""}
                      onChange={(e) => set(f.key, e.target.value)}
                      placeholder={f.placeholder || ""}
                      className="h-9 text-sm bg-background border-border/60"
                    />
                  )}
                </FieldWrap>
              )}
            </div>
            <button
              type="button"
              onClick={() => removeField(f.key)}
              className={`p-1.5 text-muted-foreground hover:text-destructive transition-colors shrink-0 ${f.type === "photo" ? "mt-2" : "mt-5"}`}
              title={`Remove ${f.label}`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {/* Add field buttons */}
        {hiddenFields.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {hiddenFields.map(f => (
              <button
                key={f.key}
                type="button"
                onClick={() => addField(f.key)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary border border-dashed border-border/60 hover:border-primary/50 rounded-md px-2.5 py-1.5 transition-colors"
              >
                <Plus className="w-3 h-3" />
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function TurningChuckSection({ data, onChange }) {
  const s1Active = !!data.wh_s1_active;
  const s2Active = !!data.wh_s2_active;
  const machineConfig = MACHINE_CHUCK_MAP[data.machine];
  const subAllowed = machineConfig ? machineConfig.allowSub : true;

  const toggle = (field) => () => onChange({ ...data, [field]: !data[field] });

  // Auto-set chuck type and deactivate S2 when machine doesn't allow sub
  useEffect(() => {
    const config = MACHINE_CHUCK_MAP[data.machine];
    if (!config) return;
    let needsUpdate = false;
    const updated = { ...data };
    if (!config.allowSub && data.wh_s2_active) {
      updated.wh_s2_active = false;
      needsUpdate = true;
    }
    if (data.wh_s1_active) {
      const s1 = { ...(data.wh_s1 || {}) };
      if (s1.chuck_type !== config.main) {
        s1.chuck_type = config.main;
        updated.wh_s1 = s1;
        needsUpdate = true;
      }
    }
    if (config.allowSub && data.wh_s2_active) {
      const s2 = { ...(data.wh_s2 || {}) };
      if (s2.chuck_type !== config.sub) {
        s2.chuck_type = config.sub;
        updated.wh_s2 = s2;
        needsUpdate = true;
      }
    }
    if (needsUpdate) onChange(updated);
  }, [data.machine]); // eslint-disable-line

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
          <label className={`flex items-center gap-2 select-none ${subAllowed ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}>
            <input
              type="checkbox"
              checked={s2Active}
              onChange={toggle("wh_s2_active")}
              disabled={!subAllowed}
              className="w-4 h-4 rounded border-border accent-primary cursor-pointer disabled:cursor-not-allowed"
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