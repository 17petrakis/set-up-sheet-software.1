import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import AutoResizeTextarea from "@/components/ui/AutoResizeTextarea";
import FixturingField from "./FixturingField";

export default function CommonStationFields({ data, onChange, stickoutLabel = "Part Stick-out", showStickout = false }) {
  const update = (field, val) => onChange({ ...data, [field]: val });

  return (
    <div className="space-y-3">
      {showStickout && (
        <FixturingField label={stickoutLabel}>
          <Input
            value={data.part_stickout || ""}
            onChange={(e) => update("part_stickout", e.target.value)}
            className="h-9 text-sm font-medium bg-card border-border"
          />
        </FixturingField>
      )}
      <FixturingField label="Work Stop">
        <div className="flex items-center gap-2 h-9">
          <Checkbox
            checked={!!data.work_stop}
            onCheckedChange={(v) => update("work_stop", !!v)}
          />
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {data.work_stop ? "Yes" : "No"}
          </span>
        </div>
      </FixturingField>
      <FixturingField label="Workholding Note">
        <AutoResizeTextarea
          value={data.notes || ""}
          onChange={(e) => update("notes", e.target.value)}
          placeholder="Workholding specific notes…"
          className="min-h-[60px] text-sm font-medium bg-card border-border"
        />
      </FixturingField>
    </div>
  );
}