import React, { useState } from "react";
import { ChevronRight } from "lucide-react";

const TURRET_OPTIONS = [
  { label: "Lower (Turn)", value: "Lower (Turn)" },
  {
    label: "Upper",
    children: [
      { label: "Mill (B-axis)", value: "Upper – Mill (B-axis)" },
      { label: "Turn (Left)", value: "Upper – Turn (Left)" },
      { label: "Turn (Right)", value: "Upper – Turn (Right)" },
    ],
  },
];

export default function TurretDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
    setExpanded(null);
  };

  return (
    <div
      className="relative"
      tabIndex={-1}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) { setOpen(false); setExpanded(null); } }}
    >
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setExpanded(null); }}
        className="w-full h-9 px-3 text-sm bg-background border border-border/60 rounded-md text-left flex items-center justify-between hover:border-border focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <span className={value ? "text-foreground" : "text-muted-foreground"}>{value || "Select turret type…"}</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground rotate-90 shrink-0" />
      </button>
      {open && (
        <div className="absolute z-[500] top-full left-0 mt-1 w-52 bg-popover border border-border rounded-md shadow-lg py-1">
          {TURRET_OPTIONS.map((opt) => (
            <div key={opt.label}>
              {opt.children ? (
                <>
                  <div
                    onClick={() => setExpanded(e => e === opt.label ? null : opt.label)}
                    className="flex items-center justify-between px-3 py-2 text-sm cursor-pointer rounded-sm mx-1 hover:bg-accent text-foreground"
                  >
                    <span>{opt.label}</span>
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${expanded === opt.label ? "rotate-90" : ""}`} />
                  </div>
                  {expanded === opt.label && (
                    <div className="bg-muted/40 border-y border-border/40 py-1 mb-1">
                      {opt.children.map(child => (
                        <div
                          key={child.value}
                          onClick={() => handleSelect(child.value)}
                          className="px-6 py-1.5 text-sm cursor-pointer hover:bg-primary hover:text-primary-foreground rounded-sm mx-1"
                        >
                          {child.label}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div
                  onClick={() => handleSelect(opt.value)}
                  className="px-3 py-2 text-sm cursor-pointer rounded-sm mx-1 hover:bg-primary hover:text-primary-foreground text-foreground"
                >
                  {opt.label}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}