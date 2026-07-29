import { Input } from "@/components/ui/input";
import AutoResizeTextarea from "@/components/ui/AutoResizeTextarea";
import FixturingField from "./FixturingField";
import ChipGroup from "./ChipGroup";
import { CLAMP_TYPES_VMC } from "@/lib/fixturingOptions";

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
      <FixturingField label="Notes">
        <AutoResizeTextarea
          value={data.fixture_note || ""}
          onChange={(e) => update("fixture_note", e.target.value)}
          placeholder="Fixture-specific notes…"
          className="min-h-[60px] text-sm bg-background border-border/60"
        />
      </FixturingField>
    </div>
  );
}