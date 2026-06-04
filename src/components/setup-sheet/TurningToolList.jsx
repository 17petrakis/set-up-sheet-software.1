import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import SectionHeader from "./SectionHeader";
import { Wrench, Plus, Trash2 } from "lucide-react";

const AXIAL_TYPES = ["Drill", "Tap", "Reamer", "Boring Bar", "End Mill", "Center Drill", "Other"];
const RADIAL_TYPES = ["OD Turning", "ID Boring", "Grooving", "Threading", "Parting", "Face Grooving", "Other"];

const emptyAxial = { tool_number: "", description: "", type: "", diameter_radius: "", angle: "", holder: "", stickout: "" };
const emptyRadial = { tool_number: "", description: "", type: "", diameter_radius: "", angle_insert: "", holder: "", stickout: "", extension: "" };

const AXIAL_COLS = [
  { key: "tool_number", label: "T#", w: "w-14" },
  { key: "description", label: "Description", w: "w-auto" },
  { key: "type", label: "Type", w: "w-32", isSelect: true, options: AXIAL_TYPES },
  { key: "diameter_radius", label: "Dia / Radius", w: "w-24" },
  { key: "angle", label: "Angle", w: "w-20" },
  { key: "holder", label: "Holder", w: "w-24" },
  { key: "stickout", label: "Stickout", w: "w-20" },
];

const RADIAL_COLS = [
  { key: "tool_number", label: "T#", w: "w-14" },
  { key: "description", label: "Description", w: "w-auto" },
  { key: "type", label: "Type", w: "w-32", isSelect: true, options: RADIAL_TYPES },
  { key: "diameter_radius", label: "Dia / Radius", w: "w-24" },
  { key: "angle_insert", label: "Angle / Insert", w: "w-28" },
  { key: "holder", label: "Holder", w: "w-24" },
  { key: "stickout", label: "Stickout", w: "w-20" },
  { key: "extension", label: "Extension", w: "w-20" },
];

function ToolSubTable({ title, columns, rows, onAdd, onRemove, onUpdate, emptyRow }) {
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
        <Button size="sm" variant="outline" onClick={() => onAdd(emptyRow)} className="h-7 text-xs gap-1.5">
          <Plus className="w-3 h-3" /> Add Tool
        </Button>
      </div>
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
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="text-center text-sm text-muted-foreground py-6">
                  No tools added yet.
                </TableCell>
              </TableRow>
            )}
            {rows.map((row, i) => (
              <TableRow key={i} className="group">
                {columns.map((c) => (
                  <TableCell key={c.key} className="py-1 px-1.5">
                    {c.isSelect ? (
                      <Select value={row[c.key] || ""} onValueChange={(val) => onUpdate(i, c.key, val)}>
                        <SelectTrigger className="h-8 text-xs border-transparent bg-transparent hover:border-border/60 focus:border-primary/40 focus:bg-background transition-all">
                          <SelectValue placeholder="Select…" />
                        </SelectTrigger>
                        <SelectContent>
                          {c.options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={row[c.key] || ""}
                        onChange={(e) => onUpdate(i, c.key, e.target.value)}
                        className="h-8 text-xs border-transparent bg-transparent hover:border-border/60 focus:border-primary/40 focus:bg-background transition-all"
                      />
                    )}
                  </TableCell>
                ))}
                <TableCell className="py-1 px-1.5">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onRemove(i)}
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
    </div>
  );
}

export default function TurningToolList({ tools, onChange }) {
  const axial = tools?.axial || [];
  const radial = tools?.radial || [];

  const updateAxial = (newAxial) => onChange({ axial: newAxial, radial });
  const updateRadial = (newRadial) => onChange({ axial, radial: newRadial });

  const addAxial = (empty) => updateAxial([...axial, { ...empty }]);
  const removeAxial = (i) => updateAxial(axial.filter((_, idx) => idx !== i));
  const updateAxialCell = (i, key, val) => { const r = [...axial]; r[i] = { ...r[i], [key]: val }; updateAxial(r); };

  const addRadial = (empty) => updateRadial([...radial, { ...empty }]);
  const removeRadial = (i) => updateRadial(radial.filter((_, idx) => idx !== i));
  const updateRadialCell = (i, key, val) => { const r = [...radial]; r[i] = { ...r[i], [key]: val }; updateRadial(r); };

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="pt-5 pb-5">
        <SectionHeader icon={Wrench} title="Tool List (Turret)" />
        <ToolSubTable
          title="Axial Tools"
          columns={AXIAL_COLS}
          rows={axial}
          emptyRow={emptyAxial}
          onAdd={addAxial}
          onRemove={removeAxial}
          onUpdate={updateAxialCell}
        />
        <ToolSubTable
          title="Radial Tools"
          columns={RADIAL_COLS}
          rows={radial}
          emptyRow={emptyRadial}
          onAdd={addRadial}
          onRemove={removeRadial}
          onUpdate={updateRadialCell}
        />
      </CardContent>
    </Card>
  );
}