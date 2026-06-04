import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SectionHeader from "./SectionHeader";
import { ClipboardList, Plus, Trash2 } from "lucide-react";
import { emptyTurningOperation } from "@/lib/setupSheetDefaults";

const COLS = ["N-Block", "OP #", "Operation Name", "Comment", "Tool #", "CS#", "Min Z", "Max Z"];
const KEYS = ["n_block", "op_number", "operation_name", "comment", "tool_number", "cs_number", "min_z", "max_z"];

export default function TurningOperationsList({ operations, onChange }) {
  const update = (i, k, v) => onChange(operations.map((op, idx) => idx === i ? { ...op, [k]: v } : op));
  const remove = (i) => onChange(operations.filter((_, idx) => idx !== i));
  const add = () => onChange([...operations, { ...emptyTurningOperation }]);

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="pt-5 pb-5">
        <div className="flex items-center justify-between mb-3">
          <SectionHeader icon={ClipboardList} title="Operations" />
          <Button size="sm" variant="outline" onClick={add} className="h-7 text-xs gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Operation
          </Button>
        </div>
        {operations.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No operations yet.</p>
        ) : (
          <div className="overflow-x-auto rounded border border-border/40">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-muted/50">
                  {COLS.map(c => (
                    <th key={c} className="border border-border/40 px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                      {c}
                    </th>
                  ))}
                  <th className="border border-border/40 w-8" />
                </tr>
              </thead>
              <tbody>
                {operations.map((op, i) => (
                  <tr key={i}>
                    {KEYS.map(k => (
                      <td key={k} className="border border-border/40 p-0">
                        <Input
                          value={op[k] || ""}
                          onChange={e => update(i, k, e.target.value)}
                          className="h-8 text-xs border-0 rounded-none bg-transparent focus-visible:ring-1 focus-visible:ring-inset min-w-[60px]"
                        />
                      </td>
                    ))}
                    <td className="border border-border/40 p-1 text-center w-8">
                      <button onClick={() => remove(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}