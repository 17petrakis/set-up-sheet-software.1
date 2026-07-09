import { useContext } from "react";
import { Input } from "@/components/ui/input";
import { ViewModeContext } from "@/lib/viewModeContext";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import ComboBox from "@/components/ui/ComboBox";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { MATERIAL_OPTIONS, MATERIAL_CONDITIONS } from "@/lib/materialOptions";

export default function MaterialField({ data, onChange, materialSpan = "sm:col-span-4", hideExtras = false }) {
  const viewMode = useContext(ViewModeContext);
  const update = (field) => (value) => onChange(field, value);

  if (viewMode && !data.material && !data.material_color && !data.material_condition) return null;

  return (
    <>
      <div className={`${materialSpan} space-y-1.5`}>
        <div className="flex items-center gap-3 mb-1.5">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Material
          </Label>
          {(!viewMode || data.material_color_enabled || data.material_color) && (
          <label className="flex items-center gap-1 cursor-pointer select-none">
            <Checkbox
              checked={!!data.material_color_enabled}
              onCheckedChange={(v) => onChange("material_color_enabled", !!v)}
            />
            <span className="text-xs text-muted-foreground">Color</span>
          </label>
          )}
          {(!viewMode || data.material_condition_enabled || data.material_condition) && (
          <label className="flex items-center gap-1 cursor-pointer select-none">
            <Checkbox
              checked={!!data.material_condition_enabled}
              onCheckedChange={(v) => onChange("material_condition_enabled", !!v)}
            />
            <span className="text-xs text-muted-foreground">Condition</span>
          </label>
          )}
        </div>
        <ComboBox
          value={data.material || ""}
          onChange={update("material")}
          options={MATERIAL_OPTIONS}
          placeholder="Select or type…"
          className="h-9 text-sm px-3 w-full"
        />
      </div>
      {!hideExtras && data.material_color_enabled && (
        <div className="sm:col-span-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Color
          </Label>
          <Input
            value={data.material_color || ""}
            onChange={(e) => update("material_color")(e.target.value)}
            placeholder="e.g. Black…"
            className="h-9 text-sm bg-background border-border/60 focus:border-primary/40 transition-colors"
          />
        </div>
      )}
      {!hideExtras && data.material_condition_enabled && (
        <div className="sm:col-span-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Condition
          </Label>
          <Select
            value={data.material_condition || ""}
            onValueChange={(v) => onChange("material_condition", v)}
          >
            <SelectTrigger className="h-9 text-sm bg-background border-border/60">
              <span className={data.material_condition ? "" : "text-muted-foreground"}>
                {data.material_condition || "Select…"}
              </span>
            </SelectTrigger>
            <SelectContent>
              {MATERIAL_CONDITIONS.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </>
  );
}