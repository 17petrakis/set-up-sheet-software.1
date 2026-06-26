import { Input } from "@/components/ui/input";
import AutoResizeTextarea from "@/components/ui/AutoResizeTextarea";
import FixturingField from "./FixturingField";
import FixturingSelect from "./FixturingSelect";
import StationPhotos from "./StationPhotos";
import { BANDSAW_STOCK_TYPES, BANDSAW_BLADE_TPI } from "@/lib/fixturingOptions";

export default function BandsawSection({ data, onChange }) {
  const update = (field, val) => onChange({ ...data, [field]: val });

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <FixturingField label="Stock Type">
          <FixturingSelect value={data.stock_type || ""} onChange={(v) => update("stock_type", v)} options={BANDSAW_STOCK_TYPES} />
        </FixturingField>
        <FixturingField label="Stock Dimensions">
          <Input
            value={data.stock_dimensions || ""}
            onChange={(e) => update("stock_dimensions", e.target.value)}
            placeholder='e.g. 2.5" dia, 3" x 4"'
            className="h-9 text-sm bg-background border-border/60"
          />
        </FixturingField>
        <FixturingField label="Cut Length">
          <Input
            value={data.cut_length || ""}
            onChange={(e) => update("cut_length", e.target.value)}
            className="h-9 text-sm bg-background border-border/60"
          />
        </FixturingField>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <FixturingField label="Quantity">
          <Input
            type="number"
            value={data.quantity || ""}
            onChange={(e) => update("quantity", e.target.value)}
            className="h-9 text-sm bg-background border-border/60"
          />
        </FixturingField>
        <FixturingField label="Blade TPI">
          <FixturingSelect value={data.blade_tpi || ""} onChange={(v) => update("blade_tpi", v)} options={BANDSAW_BLADE_TPI} />
        </FixturingField>
        <FixturingField label="Fence / Stop Reference">
          <Input
            value={data.fence_stop_ref || ""}
            onChange={(e) => update("fence_stop_ref", e.target.value)}
            className="h-9 text-sm bg-background border-border/60"
          />
        </FixturingField>
      </div>
      <FixturingField label="Saw Notes">
        <AutoResizeTextarea
          value={data.notes || ""}
          onChange={(e) => update("notes", e.target.value)}
          placeholder="Saw-specific notes…"
          className="min-h-[80px] text-sm bg-background border-border/60"
        />
      </FixturingField>
      <StationPhotos photos={data.photos || []} onChange={(photos) => onChange({ ...data, photos })} />
    </div>
  );
}