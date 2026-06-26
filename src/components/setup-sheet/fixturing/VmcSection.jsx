import { Input } from "@/components/ui/input";
import AutoResizeTextarea from "@/components/ui/AutoResizeTextarea";
import FixturingField from "./FixturingField";
import FixturingSelect from "./FixturingSelect";
import ViseFields from "./ViseFields";
import { VMC_FIXTURE_TYPES, VMC_WORK_OFFSETS } from "@/lib/fixturingOptions";

export default function VmcSection({ data, onChange }) {
  const update = (field, val) => onChange({ ...data, [field]: val });

  return (
    <div className="space-y-3">
      <FixturingField label="Fixture Type">
        <FixturingSelect value={data.fixture_type || ""} onChange={(v) => update("fixture_type", v)} options={VMC_FIXTURE_TYPES} />
      </FixturingField>

      {data.fixture_type === "Vise" && (
        <ViseFields data={data} onChange={onChange} showViseModel />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FixturingField label="Work Offset">
          <FixturingSelect value={data.work_offset || ""} onChange={(v) => update("work_offset", v)} options={VMC_WORK_OFFSETS} />
        </FixturingField>
        <FixturingField label="Part Stick-out from Vise">
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