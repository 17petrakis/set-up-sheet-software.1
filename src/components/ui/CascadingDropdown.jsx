import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

const BTN_BASE = "px-3 py-1.5 text-xs font-medium rounded border border-gray-200 whitespace-nowrap transition-colors text-blue-900";

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

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="h-9 w-full flex items-center justify-between px-3 rounded-md border border-gray-200 bg-white text-sm text-blue-900 hover:border-blue-300 transition-colors"
      >
        <span className={selectedLabel ? "text-blue-900" : "text-muted-foreground"}>{selectedLabel || placeholder}</span>
        <ChevronDown className="w-3.5 h-3.5 text-blue-900 opacity-60" />
      </button>

      {open && (
        <div className="absolute z-[500] top-full left-0 mt-0.5 p-1.5 rounded-md border border-gray-200 bg-gray-300 shadow-xl">
          {isGrouped ? (
            <div className="flex gap-1 items-start">
              <div className="flex flex-col gap-1">
                {options.map(g => (
                  <button
                    key={g.group}
                    type="button"
                    onClick={() => setExpandedGroup(expandedGroup === g.group ? null : g.group)}
                    className={`${BTN_BASE} ${expandedGroup === g.group ? "bg-emerald-100" : "bg-white hover:bg-yellow-100"}`}
                  >
                    <span className="flex items-center gap-1">
                      {g.group}
                      {expandedGroup === g.group
                        ? <ChevronDown className="w-3 h-3" />
                        : <ChevronRight className="w-3 h-3" />}
                    </span>
                  </button>
                ))}
              </div>
              {expandedGroup && (
                <div className="flex flex-col gap-1">
                  {(options.find(g => g.group === expandedGroup)?.models || []).map(m => {
                    const label = expandedGroup === m ? expandedGroup : `${expandedGroup} ${m}`;
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => handleSelect(label)}
                        className={`${BTN_BASE} ${value === label ? "bg-yellow-200" : "bg-white hover:bg-yellow-100"}`}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {flatOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`${BTN_BASE} ${value === opt.value ? "bg-yellow-200" : "bg-white hover:bg-yellow-100"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}