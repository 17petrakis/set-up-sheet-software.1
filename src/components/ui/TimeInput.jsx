import React from "react";
import { Input } from "@/components/ui/input";
import { parseTimeToSeconds } from "@/lib/timeFormat";

export default function TimeInput({ value, onChange }) {
  const totalSeconds = parseTimeToSeconds(value);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);

  const handleChange = (newMin, newSec) => {
    const m = parseInt(newMin) || 0;
    const s = parseInt(newSec) || 0;
    if (m === 0 && s === 0) {
      onChange("");
    } else {
      onChange(`${m}:${String(s).padStart(2, "0")}`);
    }
  };

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-border/60 bg-background">
      <span className="text-xs text-muted-foreground whitespace-nowrap">Min</span>
      <Input
        type="number"
        min="0"
        value={minutes || ""}
        onChange={(e) => handleChange(e.target.value, seconds)}
        className="h-7 text-sm border-transparent bg-transparent hover:border-border/60 focus:border-primary/40 transition-colors w-14 text-center px-1"
      />
      <span className="text-xs text-muted-foreground whitespace-nowrap">Sec</span>
      <Input
        type="number"
        min="0"
        value={seconds || ""}
        onChange={(e) => handleChange(minutes, e.target.value)}
        className="h-7 text-sm border-transparent bg-transparent hover:border-border/60 focus:border-primary/40 transition-colors w-12 text-center px-1"
      />
    </div>
  );
}