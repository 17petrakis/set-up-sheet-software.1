import { Input } from "@/components/ui/input";
import FixturingField from "./FixturingField";

export default function TallonGripFields({ data, onChange }) {
  const update = (field, val) => onChange({ ...data, [field]: val });

  return (
    <div className="space-y-3 pl-3 border-l-2 border-primary/20">
      <FixturingField label="Grip Size">
        <Input
          value={data.grip_size || ""}
          onChange={(e) => update("grip_size", e.target.value)}
          className="h-9 text-sm bg-background border-border/60"
        />
      </FixturingField>
    </div>
  );
}