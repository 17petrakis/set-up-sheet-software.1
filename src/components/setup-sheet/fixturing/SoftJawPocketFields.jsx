import { Input } from "@/components/ui/input";
import FixturingField from "./FixturingField";
import FixturingSelect from "./FixturingSelect";
import { JAW_MATERIALS } from "@/lib/fixturingOptions";

export default function SoftJawPocketFields({ data, onChange }) {
  const update = (field, val) => onChange({ ...data, [field]: val });

  return (
    <div className="space-y-3 pl-3 border-l-2 border-primary/20">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <FixturingField label="Jaw Material">
          <FixturingSelect value={data.jaw_material || ""} onChange={(v) => update("jaw_material", v)} options={JAW_MATERIALS} />
        </FixturingField>
        <FixturingField label="Pocket Depth">
          <Input
            value={data.pocket_depth || ""}
            onChange={(e) => update("pocket_depth", e.target.value)}
            className="h-9 text-sm bg-background border-border/60"
          />
        </FixturingField>
        <FixturingField label="Parts per Jaw Set">
          <Input
            type="number"
            value={data.parts_per_jaw_set || ""}
            onChange={(e) => update("parts_per_jaw_set", e.target.value)}
            className="h-9 text-sm bg-background border-border/60"
          />
        </FixturingField>
      </div>
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