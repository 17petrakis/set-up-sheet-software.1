// Turning machine → multi-program / turret configuration.
// getProgramMode returns: "upper_lower" | "triple" | "single"

const UPPER_LOWER_MACHINES = [
  "Doosan SMX2100",
  "Doosan Puma 2100Y II",
  "Nakamura WY-150",
];

const TRIPLE_TURRET_MACHINES = [
  "Nakamura NTY3-150",
];

const normalize = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

const UPPER_LOWER_NORM = new Set(UPPER_LOWER_MACHINES.map(normalize));
const TRIPLE_NORM = new Set(TRIPLE_TURRET_MACHINES.map(normalize));

export function getProgramMode(machine) {
  if (!machine) return "single";
  const n = normalize(machine);
  if (UPPER_LOWER_NORM.has(n)) return "upper_lower";
  if (TRIPLE_NORM.has(n)) return "triple";
  return "single";
}

export function getDefaultProgramNumbers(mode) {
  if (mode === "upper_lower") {
    return {
      upper: { active: false, number: "" },
      lower: { active: false, number: "" },
    };
  }
  if (mode === "triple") {
    return {
      upper_left: { active: false, number: "" },
      upper_right: { active: false, number: "" },
      lower: { active: false, number: "" },
    };
  }
  return null;
}

export function getProgramKeys(mode) {
  if (mode === "upper_lower") return ["lower", "upper"];
  if (mode === "triple") return ["lower", "upper_left", "upper_right"];
  return [];
}

export function getProgramLabel(key) {
  const labels = {
    upper: "Upper Prg.",
    lower: "Lower Prg.",
    upper_left: "Upper Left Prg.",
    upper_right: "Upper Right Prg.",
  };
  return labels[key] || key;
}

export function getTurretTypeForProgram(key) {
  const map = {
    lower: "Lower (Turn)",
    upper: "Upper – Mill (B-axis)",
    upper_left: "Upper – Turn (Left)",
    upper_right: "Upper – Turn (Right)",
  };
  return map[key] || "";
}

export function getPreferredTurretOrder(mode) {
  if (mode === "upper_lower") return ["Lower (Turn)", "Upper – Mill (B-axis)"];
  if (mode === "triple") return ["Lower (Turn)", "Upper – Turn (Left)", "Upper – Turn (Right)"];
  return [];
}

export function getTurretOptionsForMode(mode) {
  if (mode === "upper_lower") {
    return [
      { label: "Lower (Turn)", value: "Lower (Turn)" },
      { label: "Upper – Mill (B-axis)", value: "Upper – Mill (B-axis)" },
    ];
  }
  if (mode === "triple") {
    return [
      { label: "Lower (Turn)", value: "Lower (Turn)" },
      { label: "Upper – Turn (Left)", value: "Upper – Turn (Left)" },
      { label: "Upper – Turn (Right)", value: "Upper – Turn (Right)" },
    ];
  }
  return [
    { label: "Lower (Turn)", value: "Lower (Turn)" },
    { label: "Upper – Mill (B-axis)", value: "Upper – Mill (B-axis)" },
    { label: "Upper – Turn (Left)", value: "Upper – Turn (Left)" },
    { label: "Upper – Turn (Right)", value: "Upper – Turn (Right)" },
  ];
}