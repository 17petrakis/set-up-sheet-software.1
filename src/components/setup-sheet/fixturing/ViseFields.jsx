import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import FixturingField from "./FixturingField";
import FixturingSelect from "./FixturingSelect";
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
            <FixturingSelect
              value={data.vise_model || ""}
              onChange={(v) => update("vise_model", v)}
              options={VISE_MODELS}
              allowEmpty={false}
            />
          </FixturingField>
        )}
        <FixturingField label="Jaw Type">
          <FixturingSelect
            value={data.jaw_type || ""}
            onChange={(v) => update("jaw_type", v)}
            options={JAW_TYPES}
          />
        </FixturingField>
        <FixturingField label="Parallels">
          <div className="flex items-center gap-3 h-9">
            <Checkbox
              id={`parallels-${showViseModel ? "full" : "mini"}`}
              checked={!!data.parallels}
              onCheckedChange={(v) => update("parallels", !!v)}
            />
            <label htmlFor={`parallels-${showViseModel ? "full" : "mini"}`} className="text-xs text-muted-foreground cursor-pointer whitespace-nowrap">
              {data.parallels ? "Yes" : "No"}
            </label>
            {data.parallels && (
              <Input
                value={data.parallel_height || ""}
                onChange={(e) => update("parallel_height", e.target.value)}
                placeholder='Height e.g. 1.000"'
                className="h-8 text-sm bg-background border-border/60 flex-1 min-w-[100px]"
              />
            )}
          </div>
        </FixturingField>
      </div>
    </div>
  );
}