import React from "react";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { TURN_TYPE_OPTIONS, MILL_TYPE_OPTIONS } from "@/lib/turningToolConfig";

export function isHoleMaking() { return false; }

export function ToolBlockSelect({ value, onChange }) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger className="h-8 text-xs px-2 w-36 shrink-0 bg-background border-border/60">
        <SelectValue placeholder="Tool Block…" />
      </SelectTrigger>
      <SelectContent>
        {["Turn OD", "Bore OD", "Part off OD", "Axial Face"].map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

export default function ToolTypeDropdown({ toolKind, value, onChange }) {
  const options = toolKind === "Mill" ? MILL_TYPE_OPTIONS : TURN_TYPE_OPTIONS;
  const truncate = (str, max = 5) => str && str.length > max ? str.slice(0, max) + "…" : str;
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger className="h-9 text-xs px-2 w-[5.5rem] min-w-[5.5rem] max-w-[5.5rem] bg-background border-border/60">
        <SelectValue placeholder="Type…">
          {value ? truncate(value) : "Type…"}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}