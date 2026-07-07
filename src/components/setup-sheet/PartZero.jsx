import React, { useState } from "react";
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
          <Input value={offset.z || ""} onChange={setE("z")} placeholder="0.000"
            className="h-9 text-sm bg-background border-border/60 w-28 font-mono" />
        </FieldWrap>
        {/* C */}
        <FieldWrap label="C">
          <Input value={offset.c || ""} onChange={setE("c")} placeholder="C Null"
            className="h-9 text-sm bg-background border-border/60 w-28 font-mono" />
        </FieldWrap>
        {/* Z stock amount */}
        <FieldWrap label="Z stock amount">
          <Input value={offset.dist_from_jaws || ""} onChange={setE("dist_from_jaws")} placeholder="e.g. 1.250"
            className="h-9 text-sm bg-background border-border/60 w-32 font-mono" />
        </FieldWrap>
        {/* Relative Pickoff — only on subsequent stages */}
        {index > 0 && (
          <FieldWrap label="Relative Pickoff">
            <Input value={offset.relative_pickoff || ""} onChange={setE("relative_pickoff")} placeholder="0.000"
              className="h-9 text-sm bg-background border-border/60 w-32 font-mono" />
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
      </div>
      {showNote && (
        <div className="mt-2">
          <AutoResizeTextarea
            value={offset.note || ""}
            onChange={setE("note")}
            placeholder="Note: e.g. tight clearance, pullout stage description…"
            className="text-sm bg-background border-border/60 min-h-[60px]"
          />
        </div>
      )}
    </div>
  );
}

export default function PartZero({ data, onChange, machineType }) {
  const update = (field) => (e) => onChange({ ...data, [field]: e.target.value });
  const isTurning = machineType === "turning";

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
            <div className="mb-4">
              <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Program Coordinate Zero Note</Label>
              <AutoResizeTextarea
                value={data.program_coord_zero_note ?? ""}
                onChange={(e) => onChange({ ...data, program_coord_zero_note: e.target.value })}
                placeholder="Describe program coordinate zero location..."
                className="text-sm bg-background border-border/60 min-h-[80px]"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Coordinate System</Label>
                <Input
                  value={data.coordinate_system ?? ""}
                  onChange={update("coordinate_system")}
                  placeholder="e.g. G54"
                  className="h-9 text-sm bg-background border-border/60"
                />
              </div>
              <div>
                <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Overall Depth Range</Label>
                <Input
                  value={data.overall_depth_range ?? ""}
                  onChange={update("overall_depth_range")}
                  placeholder="e.g. -0.500 to -1.175"
                  className="h-9 text-sm bg-background border-border/60"
                />
              </div>
            </div>

            {/* PART ZERO checkbox */}
            <div className="mt-4 border border-border/50 rounded-lg overflow-hidden">
              <label className="flex items-center gap-3 px-4 py-2.5 bg-muted/40 hover:bg-muted/60 transition-colors cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!data.part_zero_enabled}
                  onChange={(e) => onChange({ ...data, part_zero_enabled: e.target.checked })}
                  className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                />
                <span className="text-sm font-medium text-foreground">PART ZERO</span>
              </label>

              {data.part_zero_enabled && (
                <div className="px-4 py-4">
                  <div className="border border-border/50 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted/40 border-b border-border/50">
                          <th className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-left py-2 px-3 w-16">Axis</th>
                          <th className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-left py-2 px-3">MAX</th>
                          <th className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-left py-2 px-3">MIN</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { axis: "X", maxKey: "x_max", minKey: "x_min" },
                          { axis: "Y", maxKey: "y_max", minKey: "y_min" },
                          { axis: "Z", maxKey: "z_max", minKey: "z_min" },
                        ].map(({ axis, maxKey, minKey }) => (
                          <tr key={axis} className="border-b border-border/30 last:border-0">
                            <td className="py-1.5 px-3 font-mono font-semibold text-sm text-foreground">{axis}</td>
                            <td className="py-1 px-2">
                              <Input
                                value={data[maxKey] || ""}
                                onChange={(e) => onChange({ ...data, [maxKey]: e.target.value })}
                                placeholder="0.000"
                                className="h-8 text-xs font-mono bg-transparent border-transparent hover:border-border/60 focus:border-primary/40 focus:bg-background transition-all"
                              />
                            </td>
                            <td className="py-1 px-2">
                              <Input
                                value={data[minKey] || ""}
                                onChange={(e) => onChange({ ...data, [minKey]: e.target.value })}
                                placeholder="0.000"
                                className="h-8 text-xs font-mono bg-transparent border-transparent hover:border-border/60 focus:border-primary/40 focus:bg-background transition-all"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}