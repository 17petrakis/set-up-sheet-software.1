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

  const activeKeys = keys.filter(key => (programNumbers[key] || {}).active);

  return (
    <div className={className}>
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
        Program #
      </Label>
      {/* Checkboxes — all on the same row */}
      <div className="flex flex-row items-center gap-x-3 gap-y-1 mb-1.5">
        {keys.map(key => {
          const entry = programNumbers[key] || { active: false, number: "" };
          return (
            <label key={key} className="flex items-center gap-1 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                checked={entry.active || false}
                onChange={() => toggleProgram(key)}
                className="w-3.5 h-3.5 rounded border-border accent-primary"
              />
              <span className="text-xs font-medium text-foreground">{getProgramLabel(key)}</span>
            </label>
          );
        })}
      </div>
      {/* Active inputs — same line, same size, wrap if needed */}
      {activeKeys.length > 0 && (
        <div className="flex flex-row flex-wrap items-center gap-2">
          {activeKeys.map(key => {
            const entry = programNumbers[key] || { active: false, number: "" };
            return (
              <Input
                key={key}
                value={entry.number || ""}
                onChange={(e) => updateNumber(key, e.target.value)}
                placeholder={`${getProgramLabel(key)} number…`}
                className="h-9 flex-1 min-w-[100px] text-sm bg-background border-border/60 focus:border-primary/40 transition-colors"
              />
            );
          })}
        </div>
      )}
    </div>
  );
}