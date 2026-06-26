import { Input } from "@/components/ui/input";
import AutoResizeTextarea from "@/components/ui/AutoResizeTextarea";
import FixturingField from "./FixturingField";
import FixturingSelect from "./FixturingSelect";
import ViseFields from "./ViseFields";
import { DT_FIXTURE_TYPES, DT_WORK_OFFSETS } from "@/lib/fixturingOptions";

export default function DrillTapSection({ data, onChange }) {
  const update = (field, val) => onChange({ ...data, [field]: val });

  return (
    <div className="space-y-3">
      <FixturingField label="Fixture Type">
        <FixturingSelect value={data.fixture_type || ""} onChange={(v) => update("fixture_type", v)} options={DT_FIXTURE_TYPES} />
      </FixturingField>

      {data.fixture_type === "Collet Chuck" && (
        <FixturingField label="Collet Size" className="sm:max-w-[200px]">
          <Input
            value={data.collet_size || ""}
            onChange={(e) => update("collet_size", e.target.value)}
            placeholder="e.g. ER32, ER16"
            className="h-9 text-sm bg-background border-border/60"
          />
        </FixturingField>
      )}

      {data.fixture_type === "Vise" && (
        <ViseFields data={data} onChange={onChange} showViseModel={false} />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FixturingField label="Work Offset">
          <FixturingSelect value={data.work_offset || ""} onChange={(v) => update("work_offset", v)} options={DT_WORK_OFFSETS} />
        </FixturingField>
        <FixturingField label="Part Stick-out">
          <Input
            value={data.part_stickout || ""}
            onChange={(e) => update("part_stickout", e.target.value)}
            className="h-9 text-sm bg-background border-border/60"
          />
        </FixturingField>
      </div>

      <FixturingField label="Fixturing Notes">
        <AutoResizeTextarea
          value={data.notes || ""}
          onChange={(e) => update("notes", e.target.value)}
          placeholder="Additional fixturing notes…"
          className="min-h-[80px] text-sm bg-background border-border/60"
        />
      </FixturingField>
    </div>
  );
}