import React, { useContext } from "react";
import { ViewModeContext } from "@/lib/viewModeContext";
import { Card, CardContent } from "@/components/ui/card";
import SectionHeader from "./SectionHeader";
import { Wrench } from "lucide-react";
import { getMachineGroup } from "@/lib/machineGroups";
import HmcFixturing from "./fixturing/HmcFixturing";
import VmcSection from "./fixturing/VmcSection";
import DrillTapSection from "./fixturing/DrillTapSection";
import BandsawSection from "./fixturing/BandsawSection";

const hasData = (d) => {
  if (d === null || d === undefined || d === '') return false;
  if (typeof d === 'string') return d.trim() !== '';
  if (typeof d === 'number') return d !== 0;
  if (typeof d === 'boolean') return d;
  if (Array.isArray(d)) return d.length > 0 && d.some(hasData);
  if (typeof d === 'object') return Object.values(d).some(hasData);
  return false;
};

export default function FixturingNotes({ data, onChange, machine }) {
  const viewMode = useContext(ViewModeContext);
  const group = getMachineGroup(machine);

  if (viewMode && !hasData(data)) return null;

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="pt-5 pb-5">
        <SectionHeader icon={Wrench} title="Fixturing Notes" />

        {!group ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            Select a machine in General Info to load fixturing options.
          </p>
        ) : group === "hmc" ? (
          <HmcFixturing data={data} onChange={onChange} machine={machine} />
        ) : group === "vmc" ? (
          <VmcSection data={data} onChange={onChange} />
        ) : group === "drill_tap" ? (
          <DrillTapSection data={data} onChange={onChange} />
        ) : group === "bandsaw" ? (
          <BandsawSection data={data} onChange={onChange} />
        ) : null}
      </CardContent>
    </Card>
  );
}