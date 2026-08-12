import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export default function AutoResizeTextarea({ className, value, onChange, ...props }) {
  const ref = useRef(null);

  const resize = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  };

  useEffect(() => { resize(); }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={onChange}
      onInput={resize}
      rows={1}
      className={cn(
        "flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm font-medium shadow-sm transition-colors placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:border-primary/40 disabled:cursor-not-allowed disabled:opacity-50 resize-none overflow-hidden",
        className
      )}
      {...props}
    />
  );
}