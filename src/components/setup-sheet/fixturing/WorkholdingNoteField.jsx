import { Input } from "@/components/ui/input";
import AutoResizeTextarea from "@/components/ui/AutoResizeTextarea";
import FixturingField from "./FixturingField";

/**
 * Renders a manual note field for workholding types that don't have
 * dedicated sub-field components (Mitee-Bite/Edge Clamp, Direct Clamp,
 * Dovetail Fixture, Collet/Chuck). The label is derived from the type.
 */
export default function WorkholdingNoteField({ data, onChange, fieldName = "workholding_note" }) {
  return (
    <FixturingField label={`${data.workholding_type || data.fixture_type || "Workholding"} Note`}>
      <AutoResizeTextarea
        value={data[fieldName] || ""}
        onChange={(e) => onChange({ ...data, [fieldName]: e.target.value })}
        placeholder={`Notes for ${data.workholding_type || data.fixture_type || "this workholding"}…`}
        className="text-sm font-medium bg-card border-border min-h-[60px]"
      />
    </FixturingField>
  );
}