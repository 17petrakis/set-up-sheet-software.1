import React, { useState, useContext } from "react";
import { ViewModeContext } from "@/lib/viewModeContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import AutoResizeTextarea from "@/components/ui/AutoResizeTextarea";
import SectionHeader from "./SectionHeader";
import { Crosshair, Plus, Trash2 } from "lucide-react";

const G_CODES = ["G54", "G55", "G56", "G57", "G58", "G59"];

function FieldWrap({ label, children, className = "" }) {
  return (
    <div className={className}>
      <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">{label}</Label>
      {children}
    </div>
  );
}

// A single offset row (one pullout stage)
function OffsetRow({ offset, onChange, onRemove, showRemove, index }) {
  const set = (k) => (v) => onChange({ ...offset, [k]: v });
  const setE = (k) => (e) => onChange({ ...offset, [k]: e.target.value });

  const [showNote, setShowNote] = useState(!!offset.note);
  const [showC, setShowC] = useState(!!offset.c);

  const handleZChange = (e) => {
    let val = e.target.value.replace(/[^0-9.\-]/g, "");
    const parts = val.split(".");
    if (parts.length > 2) val = parts[0] + "." + parts.slice(1).join("");
    onChange({ ...offset, z: val });
  };
  const handleZBlur = (e) => {
    const val = e.target.value.trim();
    if (val === "" || val === "-" || val === ".") return;
    const num = parseFloat(val);
    if (!isNaN(num)) onChange({ ...offset, z: num.toFixed(3) });
  };

  return (
    <div className="border border-border/50 rounded-lg p-3 mb-3 bg-muted/10">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-muted-foreground">
          {index === 0 ? "Primary Offset" : `Stage ${index + 1}`}
        </span>
        {showRemove && (
          <Button type="button" size="icon" variant="ghost" onClick={onRemove}
            className="h-7 w-7 text-destructive hover:text-destructive">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
      <div className="flex flex-wrap items-end gap-x-3 gap-y-3">
        {/* G-code selector */}
        <FieldWrap label="Work Offset">
          <Select value={offset.g_code || "G54"} onValueChange={set("g_code")}>
            <SelectTrigger className="h-9 text-sm w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {G_CODES.map((g) => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldWrap>
        {/* Z */}
        <FieldWrap label="Z">
          <Input value={offset.z || ""} onChange={handleZChange} onBlur={handleZBlur} placeholder="0.000"
            className="h-9 text-sm bg-card border-border font-medium w-28 font-mono" />
        </FieldWrap>
        {/* C — toggleable */}
        {showC && (
          <FieldWrap label="C">
            <Input value={offset.c || ""} onChange={setE("c")} placeholder="Null"
              className="h-9 text-sm bg-card border-border font-medium w-28 font-mono" />
          </FieldWrap>
        )}
        {/* Z stock amount */}
        <FieldWrap label="Z stock amount">
          <Input value={offset.dist_from_jaws || ""} onChange={setE("dist_from_jaws")} placeholder="e.g. 1.250"
            className="h-9 text-sm bg-card border-border font-medium w-32 font-mono" />
        </FieldWrap>
        {/* Relative Pickoff — only on subsequent stages */}
        {index > 0 && (
          <FieldWrap label="Relative Pickoff">
            <Input value={offset.relative_pickoff || ""} onChange={setE("relative_pickoff")} placeholder="0.000"
              className="h-9 text-sm bg-card border-border font-medium w-32 font-mono" />
          </FieldWrap>
        )}
        {/* + Note */}
        <Button
          type="button"
          size="sm"
          variant={showNote ? "secondary" : "outline"}
          onClick={() => {
            const next = !showNote;
            setShowNote(next);
            if (!next) set("note")("");
          }}
          className={`h-9 text-xs gap-1 ${showNote ? "text-primary" : "text-muted-foreground"}`}
        >
          <Plus className="w-3 h-3" /> Note
        </Button>
        {/* + C toggle */}
        <Button
          type="button"
          size="sm"
          variant={showC ? "secondary" : "outline"}
          onClick={() => {
            const next = !showC;
            setShowC(next);
            if (!next) set("c")("");
          }}
          className={`h-9 text-xs gap-1 ${showC ? "text-primary" : "text-muted-foreground"}`}
        >
          <Plus className="w-3 h-3" /> C
        </Button>
      </div>
      {showNote && (
        <div className="mt-2">
          <AutoResizeTextarea
            value={offset.note || ""}
            onChange={setE("note")}
            placeholder="Note: e.g. tight clearance, pullout stage description…"
            className="text-sm bg-card border-border font-medium min-h-[60px]"
          />
        </div>
      )}
    </div>
  );
}

export default function PartZero({ data, onChange, machineType }) {
  const viewMode = useContext(ViewModeContext);
  const update = (field) => (e) => onChange({ ...data, [field]: e.target.value });
  const isTurning = machineType === "turning";

  const hasPartZeroData = (d) => {
    if (!d) return false;
    for (const [key, val] of Object.entries(d)) {
      if (key === "offsets") {
        if (Array.isArray(val) && val.some(o => o && Object.entries(o).some(([k, v]) => k !== "g_code" && v && String(v).trim()))) return true;
      } else if (typeof val === "string" && val.trim()) {
        return true;
      }
    }
    return false;
  };
  if (viewMode && !hasPartZeroData(data)) return null;

  // Offsets array for turning
  const offsets = (data.offsets && data.offsets.length > 0)
    ? data.offsets
    : [{ g_code: "G54", z: "", c: "", dist_from_jaws: "" }]; // C defaults to "C Null" via placeholder

  const updateOffset = (i, updated) => {
    const next = [...offsets];
    next[i] = updated;
    onChange({ ...data, offsets: next });
  };
  const addOffset = () => onChange({ ...data, offsets: [...offsets, { g_code: "G54", z: "", c: "", dist_from_jaws: "" }] }); // C Null by default
  const removeOffset = (i) => onChange({ ...data, offsets: offsets.filter((_, idx) => idx !== i) });

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="pt-5 pb-5">
        <SectionHeader icon={Crosshair} title="Offsets" />

        {isTurning ? (
          <>
            {offsets.map((offset, i) => (
              <OffsetRow
                key={i}
                index={i}
                offset={offset}
                onChange={(updated) => updateOffset(i, updated)}
                onRemove={() => removeOffset(i)}
                showRemove={offsets.length > 1}
              />
            ))}
            <Button size="sm" variant="outline" onClick={addOffset} className="h-7 text-xs gap-1.5 mt-1">
              <Plus className="w-3 h-3" /> Add Pullout Stage
            </Button>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Program Coordinate Zero Note</Label>
                <AutoResizeTextarea
                  value={data.program_coord_zero_note ?? ""}
                  onChange={(e) => onChange({ ...data, program_coord_zero_note: e.target.value })}
                  placeholder="Describe program coordinate zero location..."
                  className="text-sm bg-card border-border font-medium min-h-[80px]"
                />
              </div>
              <div>
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Work Coordinate System</Label>
                <AutoResizeTextarea
                  value={data.work_coordinate_system ?? ""}
                  onChange={(e) => onChange({ ...data, work_coordinate_system: e.target.value })}
                  placeholder="i.e. Fixed jaw center of part"
                  className="text-sm bg-card border-border font-medium min-h-[80px]"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Coordinate System</Label>
                <Input
                  value={data.coordinate_system ?? ""}
                  onChange={update("coordinate_system")}
                  placeholder="e.g. G54"
                  className="h-9 text-sm bg-card border-border font-medium"
                />
              </div>
              <div>
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Overall Depth Range</Label>
                <Input
                  value={data.overall_depth_range ?? ""}
                  onChange={update("overall_depth_range")}
                  placeholder="e.g. -0.500 to -1.175"
                  className="h-9 text-sm bg-card border-border font-medium"
                />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}