import { Input } from "@/components/ui/input";
import FixturingField from "./FixturingField";
import ChipGroup from "./ChipGroup";
import { CLAMP_TYPES_HMC } from "@/lib/fixturingOptions";

export default function CustomFixtureFields({ data, onChange }) {
  const update = (field, val) => onChange({ ...data, [field]: val });

  return (
    <div className="space-y-3 pl-3 border-l-2 border-primary/20">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FixturingField label="Fixture Block ID / Name">
          <Input
            value={data.fixture_block_id || ""}
            onChange={(e) => update("fixture_block_id", e.target.value)}
            className="h-9 text-sm bg-background border-border/60"
          />
        </FixturingField>
        <FixturingField label="Parts per Face">
          <Input
            type="number"
            value={data.parts_per_face || ""}
            onChange={(e) => update("parts_per_face", e.target.value)}
            className="h-9 text-sm bg-background border-border/60"
          />
        </FixturingField>
      </div>
      <FixturingField label="Clamp Type">
        <ChipGroup value={data.clamp_type || ""} onChange={(v) => update("clamp_type", v)} options={CLAMP_TYPES_HMC} />
      </FixturingField>
      <FixturingField label="Work Offset">
        <Input
          value={data.work_offset || ""}
          onChange={(e) => update("work_offset", e.target.value)}
          className="h-9 text-sm bg-background border-border/60"
        />
      </FixturingField>
    </div>
  );
}