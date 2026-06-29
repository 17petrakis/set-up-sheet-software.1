import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import ComboBox from "@/components/ui/ComboBox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { MATERIAL_OPTIONS, MATERIAL_CONDITIONS } from "@/lib/materialOptions";

export default function MaterialField({ data, onChange }) {
  const update = (field) => (value) => onChange(field, value);

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
        Material
      </Label>
      <ComboBox
        value={data.material || ""}
        onChange={update("material")}
        options={MATERIAL_OPTIONS}
        placeholder="Select or type…"
        className="h-9 text-sm px-3 w-full"
      />
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <Checkbox
            checked={!!data.material_color_enabled}
            onCheckedChange={(v) => onChange("material_color_enabled", !!v)}
          />
          <span className="text-xs text-muted-foreground">Color</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <Checkbox
            checked={!!data.material_condition_enabled}
            onCheckedChange={(v) => onChange("material_condition_enabled", !!v)}
          />
          <span className="text-xs text-muted-foreground">Condition</span>
        </label>
      </div>
      {data.material_color_enabled && (
        <Input
          value={data.material_color || ""}
          onChange={(e) => update("material_color")(e.target.value)}
          placeholder="e.g. Black, Gold anodized…"
          className="h-9 text-sm bg-background border-border/60 focus:border-primary/40 transition-colors"
        />
      )}
      {data.material_condition_enabled && (
        <Select
          value={data.material_condition || ""}
          onValueChange={(v) => onChange("material_condition", v)}
        >
          <SelectTrigger className="h-9 text-sm bg-background border-border/60">
            <SelectValue placeholder="Select condition…" />
          </SelectTrigger>
          <SelectContent>
            {MATERIAL_CONDITIONS.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}