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

  return (
    <div className={className}>
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
        Program #
      </Label>
      <div className="flex flex-row flex-wrap items-start gap-4">
        {keys.map(key => {
          const entry = programNumbers[key] || { active: false, number: "" };
          return (
            <div key={key} className="space-y-1 min-w-[140px]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={entry.active || false}
                  onChange={() => toggleProgram(key)}
                  className="w-3.5 h-3.5 rounded border-border accent-primary"
                />
                <span className="text-xs font-medium text-foreground">{getProgramLabel(key)}</span>
              </label>
              {entry.active && (
                <Input
                  value={entry.number || ""}
                  onChange={(e) => updateNumber(key, e.target.value)}
                  placeholder={`${getProgramLabel(key)} number…`}
                  className="h-9 text-sm bg-background border-border/60 focus:border-primary/40 transition-colors"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}