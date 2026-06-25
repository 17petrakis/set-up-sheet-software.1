import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronRight, Check } from "lucide-react";

export default function CascadingDropdown({ value, onChange, options, placeholder = "Select…", className = "" }) {
  const [open, setOpen] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState(null);
  const ref = useRef(null);

  const isGrouped = options.length > 0 && typeof options[0] === "object" && options[0].group !== undefined;

  const flatOptions = isGrouped
    ? options.flatMap(g =>
        (g.models || g.options || []).map(m => {
          const label = g.group === m ? g.group : `${g.group} ${m}`;
          return { label, value: label };
        })
      )
    : options.map(o => (typeof o === "string" ? { label: o, value: o } : { label: o.label ?? o.value ?? String(o), value: o.value ?? o.label ?? String(o) }));

  const selectedLabel = flatOptions.find(o => o.value === value)?.label || value || "";

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setExpandedGroup(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
    setExpandedGroup(null);
  };

  const ACCENT = "#0d9488"; // teal-600

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="h-9 w-full flex items-center justify-between px-3 rounded-md border border-border/60 bg-background text-sm hover:border-primary/40 transition-colors"
      >
        <span className={selectedLabel ? "text-foreground" : "text-muted-foreground"}>{selectedLabel || placeholder}</span>
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute z-[500] top-full left-0 mt-0.5 flex gap-0 rounded-md shadow-xl overflow-hidden border border-border/60">
          {/* Left panel — group headers or flat options */}
          <div className="bg-popover py-1 min-w-full sm:min-w-[160px]">
            {isGrouped ? (
              options.map(g => {
                const isActive = expandedGroup === g.group;
                const hasSelected = (g.models || []).some(m => {
                  const label = g.group === m ? g.group : `${g.group} ${m}`;
                  return label === value;
                });
                return (
                  <button
                    key={g.group}
                    type="button"
                    onClick={() => setExpandedGroup(isActive ? null : g.group)}
                    className="w-full text-left px-3 py-1.5 text-xs flex items-center justify-between transition-colors"
                    style={{
                      backgroundColor: isActive ? "hsl(var(--accent))" : "transparent",
                      color: isActive ? "hsl(var(--accent-foreground))" : "hsl(var(--foreground))",
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = "hsl(var(--muted))"; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = "transparent"; }}
                  >
                    <span className="flex items-center gap-1.5">
                      {hasSelected && <Check className="w-3 h-3" style={{ color: ACCENT }} />}
                      {g.group}
                    </span>
                    <ChevronRight className="w-3 h-3" style={{ color: isActive ? "hsl(var(--accent-foreground))" : ACCENT, opacity: isActive ? 1 : 0.5 }} />
                  </button>
                );
              })
            ) : (
              flatOptions.map(opt => {
                const isSelected = value === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-1.5 transition-colors"
                    style={{
                      backgroundColor: isSelected ? "hsl(var(--muted))" : "transparent",
                      color: isSelected ? ACCENT : "hsl(var(--foreground))",
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = "hsl(var(--muted))"; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = "transparent"; }}
                  >
                    {isSelected && <Check className="w-3 h-3" style={{ color: ACCENT }} />}
                    {opt.label}
                  </button>
                );
              })
            )}
          </div>

          {/* Right panel — options for expanded group */}
          {isGrouped && expandedGroup && (
            <div className="bg-popover py-1 min-w-[140px] border-l border-border/60">
              {(options.find(g => g.group === expandedGroup)?.models || []).map(m => {
                const label = expandedGroup === m ? expandedGroup : `${expandedGroup} ${m}`;
                const isSelected = value === label;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => handleSelect(label)}
                    className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-1.5 transition-colors"
                    style={{
                      backgroundColor: isSelected ? "hsl(var(--muted))" : "transparent",
                      color: isSelected ? ACCENT : "hsl(var(--foreground))",
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = "hsl(var(--muted))"; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = "transparent"; }}
                  >
                    {isSelected && <Check className="w-3 h-3" style={{ color: ACCENT }} />}
                    {m}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}