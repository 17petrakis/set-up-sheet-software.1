import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

/**
 * Standard (non-typeable) dropdown for the fixturing section.
 * Pass `allowEmpty` to include a "—" clear option at the top.
 */
export default function FixturingSelect({ value, onChange, options, placeholder = "Select…", allowEmpty = true }) {
  return (
    <Select
      value={value || ""}
      onValueChange={(v) => onChange(v === "__none__" ? "" : v)}
    >
      <SelectTrigger className="h-9 text-sm font-medium bg-card border-border">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allowEmpty && (
          <SelectItem value="__none__">—</SelectItem>
        )}
        {options.map((opt) => (
          <SelectItem key={opt} value={opt}>
            {opt}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}