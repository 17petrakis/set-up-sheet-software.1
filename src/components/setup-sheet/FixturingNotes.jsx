import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import SectionHeader from "./SectionHeader";
import { Wrench } from "lucide-react";
import { getMachineGroup } from "@/lib/machineGroups";
import HmcFixturing from "./fixturing/HmcFixturing";
import VmcSection from "./fixturing/VmcSection";
import DrillTapSection from "./fixturing/DrillTapSection";
import BandsawSection from "./fixturing/BandsawSection";

export default function FixturingNotes({ data, onChange, machine }) {
  const group = getMachineGroup(machine);

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="pt-5 pb-5">
        <SectionHeader icon={Wrench} title="Fixturing Notes" />

        {!group ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            Select a machine in General Info to load fixturing options.
          </p>
        ) : group === "hmc" ? (
          <HmcFixturing data={data} onChange={onChange} />
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