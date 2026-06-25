/**
 * Single-select chip group. Clicking the active chip deselects it.
 */
export default function ChipGroup({ value, onChange, options }) {
  return (
    <div className="flex flex-wrap gap-1.5 pt-0.5">
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(active ? "" : opt)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
              active
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border/60 hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}