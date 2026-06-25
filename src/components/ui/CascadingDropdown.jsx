import React from "react";

export default function CascadingDropdown({ value, onChange, options, placeholder = "Select…", className = "" }) {
  const isGrouped = options.length > 0 && typeof options[0] === "object" && options[0].group !== undefined;

  const flatOptions = isGrouped
    ? options.flatMap(g =>
        (g.models || g.options || []).map(m => {
          const label = g.group === m ? g.group : `${g.group} ${m}`;
          return { label, value: label };
        })
      )
    : options.map(o => (typeof o === "string" ? { label: o, value: o } : { label: o.label ?? o.value ?? String(o), value: o.value ?? o.label ?? String(o) }));

  return (
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className={`h-9 text-sm bg-background border border-border/60 rounded-md px-3 w-full focus:outline-none focus:ring-1 focus:ring-ring ${className}`}
    >
      <option value="" disabled>{placeholder}</option>
      {isGrouped
        ? options.map(g => (
            <optgroup key={g.group} label={g.group}>
              {(g.models || g.options || []).map(m => {
                const label = g.group === m ? g.group : `${g.group} ${m}`;
                return <option key={label} value={label}>{m}</option>;
              })}
            </optgroup>
          ))
        : flatOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)
      }
    </select>
  );
}