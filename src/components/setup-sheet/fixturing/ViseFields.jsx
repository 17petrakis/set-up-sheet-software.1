import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { X, Plus, Trash2 } from "lucide-react";
import FixturingField from "./FixturingField";
import FixturingSelect from "./FixturingSelect";
import { VISE_MODELS, JAW_TYPES } from "@/lib/fixturingOptions";

function ViseModelField({ viseData, onChangeVise }) {
  return (
    <FixturingField label="Vise Model">
      {viseData.vise_model === "Other" ? (
        <div className="flex gap-1.5">
          <Input
            value={viseData.vise_model_other || ""}
            onChange={(e) => onChangeVise({ ...viseData, vise_model_other: e.target.value })}
            placeholder="Specify vise model…"
            className="h-9 text-sm bg-card border-border font-medium"
            autoFocus
          />
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={() => onChangeVise({ ...viseData, vise_model: "Kurt Vise", vise_model_other: "" })}
            className="h-9 w-9 shrink-0"
            title="Back to list"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      ) : (
        <FixturingSelect
          value={viseData.vise_model || "Kurt Vise"}
          onChange={(v) => onChangeVise({ ...viseData, vise_model: v })}
          options={VISE_MODELS}
          allowEmpty={false}
        />
      )}
    </FixturingField>
  );
}

function SingleViseFields({ viseData, onChangeVise, trailing }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <ViseModelField viseData={viseData} onChangeVise={onChangeVise} />
        <FixturingField label="Jaw Type">
          <FixturingSelect
            value={viseData.jaw_type || ""}
            onChange={(v) => onChangeVise({ ...viseData, jaw_type: v })}
            options={JAW_TYPES}
          />
        </FixturingField>
        <FixturingField label="Parallels">
          <div className="flex items-center gap-2 h-9">
            <Checkbox
              checked={!!viseData.parallels}
              onCheckedChange={(v) => onChangeVise({ ...viseData, parallels: !!v })}
            />
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {viseData.parallels ? "Yes" : "No"}
            </span>
            {viseData.parallels && (
              <Input
                value={viseData.parallel_height || ""}
                onChange={(e) => onChangeVise({ ...viseData, parallel_height: e.target.value })}
                placeholder='e.g. 1.000"'
                className="h-8 text-sm flex-1 min-w-[80px] bg-card border-border font-medium"
              />
            )}
          </div>
        </FixturingField>
      </div>
      {trailing && <div className="flex items-end">{trailing}</div>}
    </div>
  );
}

export default function ViseFields({ data, onChange }) {
  const additionalVises = data.additional_vises || [];

  const addVise = () => {
    const lastVise = additionalVises.length > 0
      ? additionalVises[additionalVises.length - 1]
      : { vise_model: data.vise_model, vise_model_other: data.vise_model_other, jaw_type: data.jaw_type, parallels: data.parallels, parallel_height: data.parallel_height };
    const newVise = { ...lastVise };
    onChange({ ...data, additional_vises: [...additionalVises, newVise] });
  };

  const updateAdditionalVise = (index, updated) => {
    const next = [...additionalVises];
    next[index] = updated;
    onChange({ ...data, additional_vises: next });
  };

  const removeAdditionalVise = (index) => {
    onChange({ ...data, additional_vises: additionalVises.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-3 pl-3 border-l-2 border-primary/20">
      <SingleViseFields
        viseData={data}
        onChangeVise={onChange}
        trailing={
          additionalVises.length === 0 ? (
            <Button type="button" size="sm" variant="outline" onClick={addVise} className="h-9 text-xs gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Add Vise
            </Button>
          ) : null
        }
      />

      {additionalVises.map((vise, i) => (
        <div key={i} className="border border-border/40 rounded-lg p-3 space-y-3 bg-background/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Vise {i + 2}
            </span>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => removeAdditionalVise(i)}
              className="h-7 w-7 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
          <SingleViseFields
            viseData={vise}
            onChangeVise={(updated) => updateAdditionalVise(i, updated)}
            trailing={
              i === additionalVises.length - 1 && additionalVises.length < 2 ? (
                <Button type="button" size="sm" variant="outline" onClick={addVise} className="h-9 text-xs gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Add Vise
                </Button>
              ) : null
            }
          />
        </div>
      ))}
    </div>
  );
}