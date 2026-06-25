import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import ComboBox from "@/components/ui/ComboBox";
import FixturingField from "./FixturingField";
import ChipGroup from "./ChipGroup";
import { VISE_MODELS, JAW_TYPES } from "@/lib/fixturingOptions";

/**
 * Shared vise sub-fields shown when "Vise" is selected as the workholding/fixture type.
 * showViseModel: HMC + VMC show it; Drill-Tap does not.
 */
export default function ViseFields({ data, onChange, showViseModel = true }) {
  const update = (field, val) => onChange({ ...data, [field]: val });

  return (
    <div className="space-y-3 pl-3 border-l-2 border-primary/20">
      <div className={`grid grid-cols-1 ${showViseModel ? "sm:grid-cols-3" : "sm:grid-cols-2"} gap-3`}>
        {showViseModel && (
          <FixturingField label="Vise Model">
            <ComboBox
              value={data.vise_model || ""}
              onChange={(v) => update("vise_model", v)}
              options={VISE_MODELS}
              placeholder="Select…"
              allowFreeText={false}
              className="h-9 text-sm px-3 w-full"
            />
          </FixturingField>
        )}
        <FixturingField label="Jaw Type">
          <ChipGroup value={data.jaw_type || ""} onChange={(v) => update("jaw_type", v)} options={JAW_TYPES} />
        </FixturingField>
        <FixturingField label="Parallels">
          <div className="flex items-center gap-2 h-9">
            <Switch checked={!!data.parallels} onCheckedChange={(v) => update("parallels", v)} />
            <span className="text-xs text-muted-foreground">{data.parallels ? "Yes" : "No"}</span>
          </div>
        </FixturingField>
      </div>
      {data.parallels && (
        <FixturingField label="Parallel Height" className="sm:max-w-[200px]">
          <Input
            value={data.parallel_height || ""}
            onChange={(e) => update("parallel_height", e.target.value)}
            placeholder='e.g. 1.000"'
            className="h-9 text-sm bg-background border-border/60"
          />
        </FixturingField>
      )}
    </div>
  );
}