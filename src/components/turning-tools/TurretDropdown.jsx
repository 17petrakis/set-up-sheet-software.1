import React from "react";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

const DEFAULT_TURRET_OPTIONS = [
  { label: "Lower (Turn)", value: "Lower (Turn)" },
  { label: "Upper – Mill (B-axis)", value: "Upper – Mill (B-axis)" },
  { label: "Upper – Turn (Left)", value: "Upper – Turn (Left)" },
  { label: "Upper – Turn (Right)", value: "Upper – Turn (Right)" },
];

export default function TurretDropdown({ value, onChange, options }) {
  const opts = options || DEFAULT_TURRET_OPTIONS;
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger className="h-9 text-sm bg-background border-border/60 px-3 w-full">
        <SelectValue placeholder="Select turret type…" />
      </SelectTrigger>
      <SelectContent>
        {opts.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}