import React, { useState, useEffect, useContext } from "react";
import { ViewModeContext } from "@/lib/viewModeContext";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import AutoResizeTextarea from "@/components/ui/AutoResizeTextarea";
import { ClipboardList, ChevronDown } from "lucide-react";

export default function OperationNotes({ value, onChange, machineType }) {
  const viewMode = useContext(ViewModeContext);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (value && value.trim()) setOpen(true);
  }, [value]);

  if (viewMode && (!value || !value.trim())) return null;

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="pt-5 pb-5">
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <ClipboardList className="w-4 h-4 text-primary" />
              </div>
              <h2 className="text-base font-semibold text-foreground tracking-tight">Operation Notes</h2>
            </div>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <AutoResizeTextarea
              value={value || ""}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Add any operation notes here..."
              className="min-h-[96px] text-sm bg-background border-border/60"
            />
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}