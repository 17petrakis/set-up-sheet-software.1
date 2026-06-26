import { Input } from "@/components/ui/input";
import FixturingField from "./FixturingField";
import ChipGroup from "./ChipGroup";
import { WORK_OFFSETS_2 } from "@/lib/fixturingOptions";

export default function ColletChuckFields({ data, onChange }) {
  const update = (field, val) => onChange({ ...data, [field]: val });

  return (
    <div className="space-y-3 pl-3 border-l-2 border-primary/20">
      <FixturingField label="Collet Size" className="sm:max-w-[200px]">
        <Input
          value={data.collet_size || ""}
          onChange={(e) => update("collet_size", e.target.value)}
          placeholder="e.g. ER32, ER16"
          className="h-9 text-sm bg-background border-border/60"
        />
      </FixturingField>
      <FixturingField label="Work Offset">
        <ChipGroup value={data.work_offset || ""} onChange={(v) => update("work_offset", v)} options={WORK_OFFSETS_2} />
      </FixturingField>
    </div>
  );
}