import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import FixturingField from "./FixturingField";
import FixturingSelect from "./FixturingSelect";
import ChipGroup from "./ChipGroup";
import { VISE_MODELS, JAW_TYPES, WORK_OFFSETS_FULL } from "@/lib/fixturingOptions";

/**
 * Shared vise sub-fields. Configurable via props:
 *   numVisesOptions — array or null (null hides the "# Vises" field)
 *   workOffsetOptions — chip values for Work Offset
 */
export default function ViseFields({ data, onChange, numVisesOptions = null, workOffsetOptions = WORK_OFFSETS_FULL }) {
  const update = (field, val) => onChange({ ...data, [field]: val });

  return (
    <div className="space-y-3 pl-3 border-l-2 border-primary/20">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <FixturingField label="Vise Model">
          <FixturingSelect
            value={data.vise_model || ""}
            onChange={(v) => update("vise_model", v)}
            options={VISE_MODELS}
            allowEmpty={false}
          />
        </FixturingField>
        <FixturingField label="Jaw Type">
          <ChipGroup value={data.jaw_type || ""} onChange={(v) => update("jaw_type", v)} options={JAW_TYPES} />
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
            <ChipGroup value={data.num_vises || ""} onChange={(v) => update("num_vises", v)} options={numVisesOptions} />
          </FixturingField>
        )}
        <FixturingField label="Work Offset">
          <ChipGroup value={data.work_offset || ""} onChange={(v) => update("work_offset", v)} options={workOffsetOptions} />
        </FixturingField>
      </div>
    </div>
  );
}