import React, { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown } from "lucide-react";

/**
 * ComboBox — type-to-filter dropdown with keyboard navigation and free-text fallback.
 * Props:
 *   value, onChange, options (string[] or {label,value}[]), placeholder, className
 * Behavior:
 *   - Focus → show all options (filtered as you type)
 *   - Arrow Up/Down → highlight option
 *   - Enter or Tab → select highlighted (or accept typed text if no matches)
 *   - Escape → close without changing
 *   - Blur → select highlighted or accept typed text
 */
export default function ComboBox({ value, onChange, options, placeholder = "Select…", className = "", allowFreeText = true }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const committedRef = useRef(false);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Normalize options
  const flatOptions = options.map(o =>
    typeof o === "string"
      ? { label: o, value: o }
      : { label: o.label ?? o.value ?? String(o), value: o.value ?? o.label ?? String(o) }
  );

  // Clear input text when opening so the user can type from scratch
  useEffect(() => {
    if (open) {
      committedRef.current = false;
      setInput("");
      setHighlighted(0);
    }
  }, [open]); // eslint-disable-line

  // Filter based on typed text
  const q = input.toLowerCase().trim();
  const filtered = q
    ? flatOptions.filter(o => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q))
    : flatOptions;

  const safeHL = Math.min(highlighted, Math.max(filtered.length - 1, 0));

  // Scroll highlighted option into view
  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-idx="${safeHL}"]`);
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [safeHL, open]);

  const commit = useCallback(() => {
    if (committedRef.current) return;
    committedRef.current = true;

    const trimmed = input.trim();
    if (!trimmed) {
      // Nothing typed — keep original value
      setOpen(false);
      return;
    }

    if (filtered.length > 0) {
      onChange(filtered[safeHL].value);
    } else if (allowFreeText) {
      onChange(trimmed);
    }
    setOpen(false);
  }, [filtered, safeHL, input, onChange]); // eslint-disable-line

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlighted(h => Math.min((h ?? 0) + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      setHighlighted(h => Math.max((h ?? 0) - 1, 0));
    } else if (e.key === "Enter") {
      if (open) { e.preventDefault(); commit(); }
    } else if (e.key === "Tab") {
      if (open) commit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  const handleBlur = () => {
    setTimeout(() => { if (open) commit(); }, 150);
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={open ? input : (value || "")}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onChange={e => { setInput(e.target.value); setOpen(true); setHighlighted(0); }}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className={`bg-background border border-border/60 rounded-md focus:outline-none focus:ring-1 focus:ring-ring ${className}`}
      />
      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
      {open && (
        <div ref={listRef} className="absolute z-[500] top-full left-0 mt-0.5 w-full min-w-[160px] bg-popover border border-border rounded-md shadow-xl py-1 max-h-60 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-1.5 text-xs text-muted-foreground italic">
              {allowFreeText ? `Press Enter to use "${input}"` : "No results found"}
            </div>
          ) : (
            filtered.map((opt, i) => (
              <div
                key={opt.value}
                data-idx={i}
                onMouseDown={e => { e.preventDefault(); committedRef.current = true; onChange(opt.value); setOpen(false); }}
                onMouseEnter={() => setHighlighted(i)}
                className={`px-3 py-1.5 text-xs cursor-pointer rounded-sm mx-1 ${i === safeHL ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent"}`}
              >
                {opt.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}