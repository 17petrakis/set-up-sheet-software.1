import { useState, useEffect } from "react";
import {
  INVENTORY_SECTIONS,
  loadInventory,
  resolveSectionOptions,
  defaultOptionsForSection,
} from "@/lib/inventory";

// Dropdown keys. Values are inventory section ids (see src/lib/inventory.js).
// Consumers use these as keys into the options map returned by useDropdownOptions.
export const SETTING_KEYS = {
  millingMachine: "machine_mill",
  latheMachine: "machine_lathe",
  cmmMachine: "machine_cmm",
  millingCad: "cad",
  latheCad: "cad",
  millingVise: "vise",
  latheVise: "vise",
  millingJaw: "jaw_mill",
  latheJaw: "jaw_lathe",
  cmmPostSize: "cmm_post_size",
  cmmEquipment: "cmm_equipment",
};

// Legacy detail map kept for backward compatibility with buildEquipmentOptions.
export const DEFAULT_EQUIPMENT_DETAILS = {
  "Black Tower": { variants: [] },
  "Base Block": { variants: ["Large", "Small"] },
  "V-Block": { variants: ["X-Large", "Large", "Small"] },
  "Angle Block": { variants: ["Regular", "V-Angle"] },
  "Vice": { variants: ["Regular", "Finger", "Mini", "Max's"] },
  "Parallel Bars": { sizes: ["⅞"], sizeField: true },
  "Gauge Block": { sizes: ["0.900", "0.700", "0.950"], sizeField: true },
  "Gauge Pin": { sizes: [".1"], sizeField: true },
  "Weight": { variants: ["Round Bar"] },
  "Flat Piece": { variants: [] },
  "Double Sided Tape": { variants: [] },
};

// Build the full options map (keyed by section id) from inventory records,
// falling back to defaults for any section with no active records.
function buildOptions(records) {
  const opts = {};
  for (const section of INVENTORY_SECTIONS) {
    const resolved = resolveSectionOptions(section, records);
    opts[section.id] = resolved !== null ? resolved : defaultOptionsForSection(section);
  }
  return opts;
}

// Backward-compatible loader (returns the options map).
export async function loadDropdownOptions(force = false) {
  const records = await loadInventory(force);
  return buildOptions(records);
}

export function useDropdownOptions() {
  const [opts, setOpts] = useState(() => {
    const o = {};
    for (const section of INVENTORY_SECTIONS) o[section.id] = defaultOptionsForSection(section);
    return o;
  });
  useEffect(() => {
    let mounted = true;
    const apply = (records) => { if (mounted) setOpts(buildOptions(records)); };
    loadInventory().then(apply);
    const handler = () => loadInventory(true).then(apply);
    window.addEventListener("inventory-changed", handler);
    window.addEventListener("dropdown-options-changed", handler);
    return () => {
      mounted = false;
      window.removeEventListener("inventory-changed", handler);
      window.removeEventListener("dropdown-options-changed", handler);
    };
  }, []);
  return opts;
}

// Enrich a list of CMM equipment items with variants/sizes, falling back to the
// legacy detail map for any field not carried on the record.
export function buildEquipmentOptions(items) {
  return (items || []).map(item => {
    const label = item.label;
    const group = item.group || "Other";
    const details = DEFAULT_EQUIPMENT_DETAILS[label] || {};
    return {
      label,
      group,
      variants: item.variants && item.variants.length ? item.variants : (details.variants || []),
      sizes: item.sizes && item.sizes.length ? item.sizes : (details.sizes || []),
      sizeField: item.sizeField !== undefined ? item.sizeField : !!details.sizeField,
    };
  });
}