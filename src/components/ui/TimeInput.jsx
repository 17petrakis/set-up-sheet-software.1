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
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground whitespace-nowrap">Minutes</span>
      <Input
        type="number"
        min="0"
        value={minutes || ""}
        onChange={(e) => handleChange(e.target.value, seconds)}
        className="h-9 text-sm bg-background border-border/60 focus:border-primary/40 transition-colors w-16 text-center"
      />
      <span className="text-xs text-muted-foreground whitespace-nowrap">Seconds</span>
      <Input
        type="number"
        min="0"
        value={seconds || ""}
        onChange={(e) => handleChange(minutes, e.target.value)}
        className="h-9 text-sm bg-background border-border/60 focus:border-primary/40 transition-colors w-14 text-center"
      />
    </div>
  );
}