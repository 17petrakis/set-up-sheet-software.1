import React from "react";
import ComboBox from "@/components/ui/ComboBox";

const FLAT_TURRET_OPTIONS = [
  { label: "Lower (Turn)", value: "Lower (Turn)" },
  { label: "Upper – Mill (B-axis)", value: "Upper – Mill (B-axis)" },
  { label: "Upper – Turn (Left)", value: "Upper – Turn (Left)" },
  { label: "Upper – Turn (Right)", value: "Upper – Turn (Right)" },
];

export default function TurretDropdown({ value, onChange }) {
  return (
    <ComboBox
      value={value || ""}
      onChange={onChange}
      options={FLAT_TURRET_OPTIONS}
      placeholder="Select turret type…"
      className="h-9 text-sm px-3 w-full"
    />
  );
}