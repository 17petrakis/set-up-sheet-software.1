import { Input } from "@/components/ui/input";
import AutoResizeTextarea from "@/components/ui/AutoResizeTextarea";
import FixturingField from "./FixturingField";

export default function CommonStationFields({ data, onChange, stickoutLabel = "Part Stick-out" }) {
  const update = (field, val) => onChange({ ...data, [field]: val });

  return (
    <div className="space-y-3">
      <FixturingField label={stickoutLabel}>
        <Input
          value={data.part_stickout || ""}
          onChange={(e) => update("part_stickout", e.target.value)}
          className="h-9 text-sm bg-background border-border/60"
        />
      </FixturingField>
      <FixturingField label="Station Notes">
        <AutoResizeTextarea
          value={data.notes || ""}
          onChange={(e) => update("notes", e.target.value)}
          placeholder="Station-specific notes…"
          className="min-h-[60px] text-sm bg-background border-border/60"
        />
      </FixturingField>
    </div>
  );
}