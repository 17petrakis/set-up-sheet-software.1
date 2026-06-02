import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import SectionHeader from "./SectionHeader";
import { ClipboardList } from "lucide-react";

export default function OperationNotes({ value, onChange }) {
  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="pt-5 pb-5">
        <SectionHeader icon={ClipboardList} title="Operation Notes" />
        <Textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Add any operation notes here..."
          className="h-24 text-sm bg-background border-border/60 resize-none"
        />
      </CardContent>
    </Card>
  );
}