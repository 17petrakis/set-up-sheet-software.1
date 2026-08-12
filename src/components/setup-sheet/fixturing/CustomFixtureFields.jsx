import AutoResizeTextarea from "@/components/ui/AutoResizeTextarea";
import FixturingField from "./FixturingField";

export default function CustomFixtureFields({ data, onChange }) {
  const update = (field, val) => onChange({ ...data, [field]: val });

  return (
    <div className="space-y-3 pl-3 border-l-2 border-primary/20">
      <FixturingField label="Notes">
        <AutoResizeTextarea
          value={data.fixture_note || ""}
          onChange={(e) => update("fixture_note", e.target.value)}
          placeholder="Fixture-specific notes…"
          className="min-h-[100px] text-sm font-medium bg-card border-border"
        />
      </FixturingField>
    </div>
  );
}