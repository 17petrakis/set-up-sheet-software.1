import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import FixturingField from "./FixturingField";
import FixturingSelect from "./FixturingSelect";
import { VISE_MODELS, JAW_TYPES } from "@/lib/fixturingOptions";

/**
 * Shared vise sub-fields.
 *   numVisesOptions — array or null (null hides the "# Vises" field)
 */
export default function ViseFields({ data, onChange, numVisesOptions = null }) {
  const update = (field, val) => onChange({ ...data, [field]: val });

  return (
    <div className="space-y-3 pl-3 border-l-2 border-primary/20">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <FixturingField label="Vise Model">
          <div className="space-y-2">
            <FixturingSelect
              value={data.vise_model || "Kurt Vise"}
              onChange={(v) => update("vise_model", v)}
              options={VISE_MODELS}
              allowEmpty={false}
            />
            {data.vise_model === "Other" && (
              <Input
                value={data.vise_model_other || ""}
                onChange={(e) => update("vise_model_other", e.target.value)}
                placeholder="Specify vise model…"
                className="h-9 text-sm bg-background border-border/60"
              />
            )}
          </div>
        </FixturingField>
        <FixturingField label="Jaw Type">
          <FixturingSelect
            value={data.jaw_type || ""}
            onChange={(v) => update("jaw_type", v)}
            options={JAW_TYPES}
          />
        </FixturingField>
        <FixturingField label="Parallels">
          <div className="flex items-center gap-2 h-9">
            <Checkbox
              checked={!!data.parallels}
              onCheckedChange={(v) => update("parallels", !!v)}
            />
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {data.parallels ? "Yes" : "No"}
            </span>
            {data.parallels && (
              <Input
                value={data.parallel_height || ""}
                onChange={(e) => update("parallel_height", e.target.value)}
                placeholder='e.g. 1.000"'
                className="h-8 text-sm flex-1 min-w-[80px] bg-background border-border/60"
              />
            )}
          </div>
        </FixturingField>
      </div>
      <div className={`grid grid-cols-1 gap-3 ${numVisesOptions ? "sm:grid-cols-2" : ""}`}>
        {numVisesOptions && (
          <FixturingField label="Number of Vises">
            <FixturingSelect
              value={data.num_vises || ""}
              onChange={(v) => update("num_vises", v)}
              options={numVisesOptions}
              allowEmpty={false}
            />
          </FixturingField>
        )}
        <FixturingField label="Work Offset">
          <Input
            value={data.work_offset || ""}
            onChange={(e) => update("work_offset", e.target.value)}
            className="h-9 text-sm bg-background border-border/60"
          />
        </FixturingField>
      </div>
    </div>
  );
}