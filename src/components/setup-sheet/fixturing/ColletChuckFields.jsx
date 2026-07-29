import { Input } from "@/components/ui/input";
import FixturingField from "./FixturingField";

export default function ColletChuckFields({ data, onChange }) {
  const update = (field, val) => onChange({ ...data, [field]: val });

  return (
    <div className="space-y-3 pl-3 border-l-2 border-primary/20">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FixturingField label="Collet Size">
          <Input
            value={data.collet_size || ""}
            onChange={(e) => update("collet_size", e.target.value)}
            placeholder="e.g. ER32, ER16"
            className="h-9 text-sm bg-background border-border/60"
          />
        </FixturingField>
        <FixturingField label="Part Stick-out">
          <Input
            value={data.part_stickout || ""}
            onChange={(e) => update("part_stickout", e.target.value)}
            className="h-9 text-sm bg-background border-border/60"
          />
        </FixturingField>
      </div>
    </div>
  );
}