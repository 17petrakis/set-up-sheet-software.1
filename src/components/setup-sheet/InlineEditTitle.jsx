import React, { useState, useRef, useEffect } from "react";
import { Pencil } from "lucide-react";

export default function InlineEditTitle({ value, onChange, placeholder = "CNC Setup Sheet" }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");
  const inputRef = useRef(null);

  useEffect(() => { setDraft(value || ""); }, [value]);
  useEffect(() => {
    if (editing && inputRef.current) { inputRef.current.focus(); inputRef.current.select(); }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft.trim() !== (value || "").trim()) onChange(draft.trim());
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") { setDraft(value || ""); setEditing(false); }
        }}
        className="text-sm md:text-lg font-bold tracking-tight text-foreground leading-none bg-transparent border-b border-primary outline-none w-[180px] shrink-0"
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="group flex items-center gap-1.5 text-sm md:text-lg font-bold tracking-tight text-foreground leading-none shrink-0 whitespace-nowrap"
    >
      <span>{value || placeholder}</span>
      <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}