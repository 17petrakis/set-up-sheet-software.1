import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import SectionHeader from "./SectionHeader";
import { Wrench, Plus, Trash2 } from "lucide-react";
import { emptyTool } from "@/lib/setupSheetDefaults";

const columns = [
  { key: "tool_number", label: "Tool #", w: "w-16" },
  { key: "description", label: "Description", w: "w-auto" },
  { key: "diameter", label: "Diameter", w: "w-20" },
  { key: "flutes", label: "Flutes", w: "w-16" },
  { key: "exposed_length", label: "Exposed Length", w: "w-28" },
  { key: "cut_length", label: "Cut Length", w: "w-24" },
  { key: "holder", label: "Holder", w: "w-24" },
];

export default function ToolList({ tools, onChange }) {
  const addRow = () => onChange([...tools, { ...emptyTool }]);
  const removeRow = (i) => onChange(tools.filter((_, idx) => idx !== i));
  const updateCell = (i, key, val) => {
    const updated = [...tools];
    updated[i] = { ...updated[i], [key]: val };
    onChange(updated);
  };

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="pt-5 pb-5">
        <SectionHeader icon={Wrench} title="Tool List">
          <Button size="sm" variant="outline" onClick={addRow} className="h-7 text-xs gap-1.5">
            <Plus className="w-3 h-3" /> Add Tool
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
              {tools.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">
                    No tools added. Click "Add Tool" to start.
                  </TableCell>
                </TableRow>
              )}
              {tools.map((tool, i) => (
                <TableRow key={i} className="group">
                  {columns.map((c) => (
                    <TableCell key={c.key} className="py-1 px-1.5">
                      <Input
                        value={tool[c.key]}
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