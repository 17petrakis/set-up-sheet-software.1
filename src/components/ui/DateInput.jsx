import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";

// Year / Month / Day segments, in that order. Each one hands focus to the next
// as soon as it is filled in, so a date can be typed without tapping segments.
// The value kept on the record stays the same "YYYY-MM-DD" string as before.

const LIMITS = { y: 4, m: 2, d: 2 };
const LABELS = { y: "Year", m: "Month", d: "Day" };
const PLACEHOLDERS = { y: "YYYY", m: "MM", d: "DD" };

const parse = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value || "");
  return match ? { y: match[1], m: match[2], d: match[3] } : { y: "", m: "", d: "" };
};

const combine = (parts) =>
  parts.y.length === 4 && parts.m.length === 2 && parts.d.length === 2
    ? `${parts.y}-${parts.m}-${parts.d}`
    : "";

export default function DateInput({ value, onChange, viewMode }) {
  const [parts, setParts] = useState(() => parse(value));
  const yearRef = useRef(null);
  const monthRef = useRef(null);
  const dayRef = useRef(null);
  const refs = { y: yearRef, m: monthRef, d: dayRef };

  // Pull in a value that came from somewhere else (sheet loaded, revision
  // restored, import) without resetting what is being typed.
  useEffect(() => {
    if ((value || "") !== combine(parts)) setParts(parse(value));
  }, [value]);

  if (viewMode) {
    return <span className="text-sm font-semibold">{value || ""}</span>;
  }

  const set = (key, raw) => {
    const digits = raw.replace(/\D/g, "").slice(0, LIMITS[key]);
    const next = { ...parts, [key]: digits };
    setParts(next);
    onChange(combine(next));

    // Move on to the next segment once this one is complete
    if (digits.length === LIMITS[key]) {
      if (key === "y") monthRef.current?.focus();
      else if (key === "m") dayRef.current?.focus();
      else dayRef.current?.blur();
    }
  };

  // Backspace on an empty segment steps back
  const handleKeyDown = (key) => (event) => {
    if (event.key !== "Backspace" || parts[key]) return;
    if (key === "m") yearRef.current?.focus();
    if (key === "d") monthRef.current?.focus();
  };

  const segment = (key, widthClass) => (
    <Input
      ref={refs[key]}
      value={parts[key]}
      onChange={(e) => set(key, e.target.value)}
      onKeyDown={handleKeyDown(key)}
      onFocus={(e) => e.target.select()}
      inputMode="numeric"
      autoComplete="off"
      placeholder={PLACEHOLDERS[key]}
      aria-label={LABELS[key]}
      className={`h-7 text-sm font-medium border-transparent bg-transparent hover:border-border/60 focus:border-primary/40 transition-colors text-center px-1 ${widthClass}`}
    />
  );

  return (
    <div className="flex items-center px-1.5 py-1 rounded-md border border-border/60 bg-card w-full">
      {segment("y", "flex-[1.4]")}
      <span className="text-muted-foreground/50 text-xs px-0.5">/</span>
      {segment("m", "flex-1")}
      <span className="text-muted-foreground/50 text-xs px-0.5">/</span>
      {segment("d", "flex-1")}
    </div>
  );
}