import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import SectionHeader from "./SectionHeader";
import { Layers, Plus, Trash2 } from "lucide-react";

const columns = [
  { key: "n_block", label: "N-Block", w: "w-20" },
  { key: "op_number", label: "OP #", w: "w-14" },
  { key: "operation_name", label: "Operation Name", w: "w-auto" },
  { key: "comment", label: "Comment", w: "w-auto" },
  { key: "tool_number", label: "Tool #", w: "w-16" },
  { key: "cs_number", label: "CS #", w: "w-16" },
  { key: "speed", label: "Speed", w: "w-20" },
  { key: "feed", label: "Feed", w: "w-20" },
];

const emptyTurningOp = { n_block: "", op_number: "", operation_name: "", comment: "", tool_number: "", cs_number: "", speed: "", feed: "" };

export default function TurningOperationsList({ operations, onChange }) {
  const addRow = () => onChange([...operations, { ...emptyTurningOp }]);
  const removeRow = (i) => onChange(operations.filter((_, idx) => idx !== i));
  const updateCell = (i, key, val) => {
    const updated = [...operations];
    updated[i] = { ...updated[i], [key]: val };
    onChange(updated);
  };

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="pt-5 pb-5">
        <SectionHeader icon={Layers} title="Operations">
          <Button size="sm" variant="outline" onClick={addRow} className="h-7 text-xs gap-1.5">
            <Plus className="w-3 h-3" /> Add Operation
          </Button>
        </SectionHeader>

        <div className="overflow-x-auto rounded-lg border border-border/50">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                {columns.map((c) => (
                  <TableHead key={c.key} className={`${c.w} text-xs font-semibold uppercase tracking-wider text-muted-foreground py-2 px-2`}>
                    {c.label}
                  </TableHead>
                ))}
                <TableHead className="w-10 py-2 px-2" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {operations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length + 1} className="text-center text-sm text-muted-foreground py-8">
                    No operations added. Click "Add Operation" to start.
                  </TableCell>
                </TableRow>
              )}
              {operations.map((op, i) => (
                <TableRow key={i} className="group">
                  {columns.map((c) => (
                    <TableCell key={c.key} className="py-1 px-1.5">
                      <Input
                        value={op[c.key] || ""}
                        onChange={(e) => updateCell(i, c.key, e.target.value)}
                        className="h-8 text-xs border-transparent bg-transparent hover:border-border/60 focus:border-primary/40 focus:bg-background transition-all"
                      />
                    </TableCell>
                  ))}
                  <TableCell className="py-1 px-1.5">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeRow(i)}
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}