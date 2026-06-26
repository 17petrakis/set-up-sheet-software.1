import { Input } from "@/components/ui/input";
import FixturingField from "./FixturingField";
import ChipGroup from "./ChipGroup";
import { CLAMP_TYPES_VMC, WORK_OFFSETS_FULL } from "@/lib/fixturingOptions";

export default function FixturePlateFields({ data, onChange }) {
  const update = (field, val) => onChange({ ...data, [field]: val });

  return (
    <div className="space-y-3 pl-3 border-l-2 border-primary/20">
      <FixturingField label="Fixture Plate ID">
        <Input
          value={data.fixture_plate_id || ""}
          onChange={(e) => update("fixture_plate_id", e.target.value)}
          className="h-9 text-sm bg-background border-border/60"
        />
      </FixturingField>
      <FixturingField label="Clamp Type">
        <ChipGroup value={data.clamp_type || ""} onChange={(v) => update("clamp_type", v)} options={CLAMP_TYPES_VMC} />
      </FixturingField>
      <FixturingField label="Work Offset">
        <ChipGroup value={data.work_offset || ""} onChange={(v) => update("work_offset", v)} options={WORK_OFFSETS_FULL} />
      </FixturingField>
    </div>
  );
}