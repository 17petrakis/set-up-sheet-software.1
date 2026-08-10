import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getProgramMode, getProgramKeys, getProgramLabel } from "@/lib/turningMachineConfig";

export default function TurningProgramField({ data, onChange, className = "" }) {
  const mode = getProgramMode(data.machine);

  if (mode === "single") {
    return (
      <div className={className}>
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
          Program #
        </Label>
        <Input
          value={data.program || ""}
          onChange={(e) => onChange("program", e.target.value)}
          className="h-9 text-sm bg-background border-border/60 focus:border-primary/40 transition-colors"
        />
      </div>
    );
  }

  const keys = getProgramKeys(mode);
  const programNumbers = data.program_numbers || {};
  const activeKeys = keys.filter(key => (programNumbers[key] || {}).active);

  const toggleProgram = (key) => {
    const current = programNumbers[key] || { active: false, number: "" };
    const updated = { ...programNumbers, [key]: { ...current, active: !current.active } };
    onChange("program_numbers", updated);
  };

  const updateNumber = (key, number) => {
    const current = programNumbers[key] || { active: true, number: "" };
    const updated = { ...programNumbers, [key]: { ...current, number } };
    onChange("program_numbers", updated);
  };

  return (
    <>
      {/* Program # label with checkboxes inline — same pattern as Material + Color/Condition */}
      <div className={`${className} space-y-1.5`}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1.5">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Program #
          </Label>
          {keys.map(key => {
            const entry = programNumbers[key] || { active: false, number: "" };
            return (
              <label key={key} className="flex items-center gap-1 cursor-pointer select-none whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={entry.active || false}
                  onChange={() => toggleProgram(key)}
                  className="w-3.5 h-3.5 rounded border-border accent-primary"
                />
                <span className="text-xs text-muted-foreground">{getProgramLabel(key)}</span>
              </label>
            );
          })}
        </div>
      </div>
      {/* Active program number inputs — each is a separate grid cell, same size as other fields */}
      {activeKeys.map(key => {
        const entry = programNumbers[key] || { active: false, number: "" };
        return (
          <div key={key} className={className}>
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
              {getProgramLabel(key)}
            </Label>
            <Input
              value={entry.number || ""}
              onChange={(e) => updateNumber(key, e.target.value)}
              placeholder="Number…"
              className="h-9 text-sm bg-background border-border/60 focus:border-primary/40 transition-colors"
            />
          </div>
        );
      })}
    </>
  );
}