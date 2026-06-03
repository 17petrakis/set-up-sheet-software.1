import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import SectionHeader from "./SectionHeader";
import { List, Plus, Trash2 } from "lucide-react";

const TOOL_TYPES = ["Drill", "End Mill", "Tap", "Reamer", "Boring", "Face Mill", "Insert", "Threading", "Grooving", "Parting", "Other"];

const emptyAxialTool = {
  tool_number: "", description: "", type: "", diameter_radius: "", angle: "", holder: "", stickout: "",
};

const emptyRadialTool = {
  tool_number: "", description: "", type: "", diameter_radius: "", angle_insert: "", holder: "", stickout: "", extension: "",
};

function ToolTypeSelect({ value, onChange }) {
  return (
    <Select value={value || ""} onValueChange={onChange}>
      <SelectTrigger className="h-8 text-xs border-transparent bg-transparent hover:border-border/60 focus:border-primary/40 focus:bg-background transition-all w-28">
        <SelectValue placeholder="Type" />
      </SelectTrigger>
      <SelectContent>
        {TOOL_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

function ToolRow({ tool, cols, onUpdate, onRemove }) {
  return (
    <TableRow className="group">
      {cols.map((c) => (
        <TableCell key={c.key} className="py-1 px-1.5">
          {c.key === "type" ? (
            <ToolTypeSelect value={tool[c.key]} onChange={(v) => onUpdate(c.key, v)} />
          ) : (
            <Input
              value={tool[c.key] ?? ""}
              onChange={(e) => onUpdate(c.key, e.target.value)}
              className="h-8 text-xs border-transparent bg-transparent hover:border-border/60 focus:border-primary/40 focus:bg-background transition-all"
            />
          )}
        </TableCell>
      ))}
      <TableCell className="py-1 px-1.5">
        <Button size="icon" variant="ghost" onClick={onRemove}
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive">
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

const axialCols = [
  { key: "tool_number", label: "T#", w: "w-14" },
  { key: "description", label: "Description", w: "w-auto" },
  { key: "type", label: "Type", w: "w-28" },
  { key: "diameter_radius", label: "Diameter / Radius", w: "w-28" },
  { key: "angle", label: "Angle", w: "w-20" },
  { key: "holder", label: "Holder", w: "w-24" },
  { key: "stickout", label: "Stickout", w: "w-20" },
];

const radialCols = [
  { key: "tool_number", label: "T#", w: "w-14" },
  { key: "description", label: "Description", w: "w-auto" },
  { key: "type", label: "Type", w: "w-28" },
  { key: "diameter_radius", label: "Diameter / Radius", w: "w-28" },
  { key: "angle_insert", label: "Angle / Insert", w: "w-24" },
  { key: "holder", label: "Holder", w: "w-24" },
  { key: "stickout", label: "Stickout", w: "w-20" },
  { key: "extension", label: "Extension", w: "w-24" },
];

export default function TurningToolList({ data = {}, onChange }) {
  const axial = data.axial || [];
  const radial = data.radial || [];

  const updateAxial = (i, key, val) => {
    const updated = [...axial];
    updated[i] = { ...updated[i], [key]: val };
    onChange({ ...data, axial: updated });
  };

  const updateRadial = (i, key, val) => {
    const updated = [...radial];
    updated[i] = { ...updated[i], [key]: val };
    onChange({ ...data, radial: updated });
  };

  const addAxial = () => onChange({ ...data, axial: [...axial, { ...emptyAxialTool }] });
  const addRadial = () => onChange({ ...data, radial: [...radial, { ...emptyRadialTool }] });
  const removeAxial = (i) => onChange({ ...data, axial: axial.filter((_, idx) => idx !== i) });
  const removeRadial = (i) => onChange({ ...data, radial: radial.filter((_, idx) => idx !== i) });

  const renderTable = (cols, rows, onUpdate, onRemove, emptyMsg) => (
    <div className="overflow-x-auto rounded-lg border border-border/50">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            {cols.map((c) => (
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
              <TableCell colSpan={cols.length + 1} className="text-center text-sm text-muted-foreground py-6">
                {emptyMsg}
              </TableCell>
            </TableRow>
          )}
          {rows.map((tool, i) => (
            <ToolRow key={i} tool={tool} cols={cols} onUpdate={(k, v) => onUpdate(i, k, v)} onRemove={() => onRemove(i)} />
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="pt-5 pb-5">
        <SectionHeader icon={List} title="Tool List (Turret)">
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={addAxial} className="h-7 text-xs gap-1.5">
              <Plus className="w-3 h-3" /> Add Axial
            </Button>
            <Button size="sm" variant="outline" onClick={addRadial} className="h-7 text-xs gap-1.5">
              <Plus className="w-3 h-3" /> Add Radial
            </Button>
          </div>
        </SectionHeader>

        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Axial Tools</p>
            {renderTable(axialCols, axial, updateAxial, removeAxial, 'No axial tools. Click "Add Axial" to start.')}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Radial Tools</p>
            {renderTable(radialCols, radial, updateRadial, removeRadial, 'No radial tools. Click "Add Radial" to start.')}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}