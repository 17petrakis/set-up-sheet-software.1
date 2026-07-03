import React from "react";
import { Input } from "@/components/ui/input";
import { parseTimeToSeconds } from "@/lib/timeFormat";

export default function TimeInput({ value, onChange, hrs, onHrsChange }) {
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
    <div className="flex items-center gap-1 px-2 py-1 rounded-md border border-border/60 bg-background">
      {onHrsChange && (
        <>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">Hrs</span>
            <Input
              type="number"
              min="0"
              step="0.5"
              value={hrs || ""}
              onChange={(e) => onHrsChange(e.target.value)}
              className="h-7 text-sm border-transparent bg-transparent hover:border-border/60 focus:border-primary/40 transition-colors w-10 text-center px-1"
            />
          </div>
          <div className="w-px h-5 bg-border/50 mx-0.5" />
        </>
      )}
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">Min</span>
        <Input
          type="number"
          min="0"
          value={minutes || ""}
          onChange={(e) => handleChange(e.target.value, seconds)}
          className="h-7 text-sm border-transparent bg-transparent hover:border-border/60 focus:border-primary/40 transition-colors w-12 text-center px-1"
        />
      </div>
      <div className="w-px h-5 bg-border/50 mx-0.5" />
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">Sec</span>
        <Input
          type="number"
          min="0"
          value={seconds || ""}
          onChange={(e) => handleChange(minutes, e.target.value)}
          className="h-7 text-sm border-transparent bg-transparent hover:border-border/60 focus:border-primary/40 transition-colors w-10 text-center px-1"
        />
      </div>
    </div>
  );
}