import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronRight, Check, Pencil } from "lucide-react";

const ACCENT = "#0d9488";

function MenuButton({ item, value, onSelect, onClose }) {
  const [hovered, setHovered] = useState(false);
  const hasChildren = !!item.children;
  const isSelected = !hasChildren && item.value === value;

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        onClick={() => {
          if (!hasChildren) {
            onSelect(item.value);
            onClose();
          }
        }}
        className="w-full text-left px-3 py-1.5 text-xs flex items-center justify-between gap-2 transition-colors whitespace-nowrap"
        style={{
          backgroundColor: isSelected ? "hsl(var(--muted))" : "transparent",
          color: isSelected ? ACCENT : "hsl(var(--foreground))",
        }}
      >
        <span className="flex items-center gap-1.5">
          {isSelected && <Check className="w-3 h-3 shrink-0" style={{ color: ACCENT }} />}
          {item.label}
        </span>
        {hasChildren && <ChevronRight className="w-3 h-3 opacity-50 shrink-0" />}
      </button>
      {hasChildren && hovered && (
        <div className="absolute left-full top-0 z-10">
          <MenuPanel items={item.children} value={value} onSelect={onSelect} onClose={onClose} />
        </div>
      )}
    </div>
  );
}

function MenuPanel({ items, value, onSelect, onClose }) {
  return (
    <div className="bg-popover py-1 rounded-md border border-border/60 shadow-xl min-w-[150px]">
      {items.map((item, i) => (
        <MenuButton key={i} item={item} value={value} onSelect={onSelect} onClose={onClose} />
      ))}
    </div>
  );
}

export default function TreeCascadingDropdown({ value, onChange, options, placeholder = "Select…", className = "", allowCustom = false }) {
  const [open, setOpen] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const [customText, setCustomText] = useState("");
  const ref = useRef(null);
  const customInputRef = useRef(null);

  const findLabel = (items) => {
    for (const item of items) {
      if (item.value === value) return item.label;
      if (item.children) {
        const found = findLabel(item.children);
        if (found) return found;
      }
    }
    return null;
  };
  const selectedLabel = findLabel(options) || value || "";

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setCustomMode(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (customMode && customInputRef.current) {
      customInputRef.current.focus();
      customInputRef.current.select();
    }
  }, [customMode]);

  const commitCustom = () => {
    const trimmed = customText.trim();
    if (trimmed) {
      onChange(trimmed);
      setOpen(false);
    }
    setCustomMode(false);
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="h-8 w-full flex items-center justify-between px-2 rounded-md border border-border/60 bg-background text-xs hover:border-primary/40 transition-colors view-display"
      >
        <span className={`truncate ${selectedLabel ? "text-foreground" : "text-muted-foreground"}`}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      </button>
      {open && (
        <div className="absolute z-[500] top-full left-0 mt-0.5">
          <MenuPanel items={options} value={value} onSelect={onChange} onClose={() => setOpen(false)} />
          {allowCustom && (
            <div className="bg-popover border-t border-border/60 rounded-b-md shadow-xl">
              {customMode ? (
                <div className="p-1.5 flex items-center gap-1">
                  <input
                    ref={customInputRef}
                    type="text"
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); commitCustom(); }
                      if (e.key === "Escape") { setCustomMode(false); setCustomText(""); }
                    }}
                    placeholder="Type tool name…"
                    className="h-7 flex-1 px-2 text-xs rounded border border-border/60 bg-background focus:outline-none focus:border-primary/40"
                  />
                  <button
                    type="button"
                    onClick={commitCustom}
                    className="h-7 px-2 text-xs font-medium text-primary hover:bg-primary/10 rounded"
                  >
                    OK
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setCustomText(value && !findLabel(options) ? value : "");
                    setCustomMode(true);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-1.5 hover:bg-muted transition-colors text-muted-foreground"
                >
                  <Pencil className="w-3 h-3 shrink-0" />
                  Custom…
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}