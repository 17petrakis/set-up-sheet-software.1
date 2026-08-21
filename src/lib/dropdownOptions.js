import { useState, useEffect } from "react";
import {
  INVENTORY_SECTIONS,
  loadInventory,
  resolveSectionOptions,
  defaultOptionsForSection,
} from "@/lib/inventory";
import { TOOL_TYPE_OPTIONS } from "@/lib/toolTypeOptions";
import { TURN_TYPE_OPTIONS, MILL_TYPE_OPTIONS } from "@/lib/turningToolConfig";

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
  cuttingToolMill: "cutting_tool_mill",
  cuttingToolLathe: "cutting_tool_lathe",
  holderMill: "holder_mill",
  holderLathe: "holder_lathe",
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

// Reconstruct the nested cascading tree (TOOL_TYPE_OPTIONS shape) from flat
// inventory records: [{label, group, group2}].
function buildMillToolTypeOptions(items) {
  const groups = [];
  const groupMap = {};
  for (const it of items) {
    const g = it.group || "Other";
    if (!groupMap[g]) {
      groupMap[g] = { label: g, children: [] };
      groups.push(groupMap[g]);
    }
    if (it.group2) {
      let sub = groupMap[g].children.find(c => c.children && c.label === it.group2);
      if (!sub) {
        sub = { label: it.group2, children: [] };
        groupMap[g].children.push(sub);
      }
      sub.children.push({ label: it.label, value: it.label });
    } else {
      groupMap[g].children.push({ label: it.label, value: it.label });
    }
  }
  return groups;
}

// Lathe cutting tools split into Turn / Mill kinds.
function buildLatheToolTypeOptions(items) {
  return {
    turn: items.filter(i => i.subgroup !== "Mill").map(i => ({ label: i.label, value: i.label })),
    mill: items.filter(i => i.subgroup === "Mill").map(i => ({ label: i.label, value: i.label })),
  };
}

// Default option shape for a section (used before inventory loads / when empty).
function sectionDefault(section) {
  switch (section.id) {
    case "cutting_tool_mill":
      return TOOL_TYPE_OPTIONS;
    case "cutting_tool_lathe":
      return { turn: TURN_TYPE_OPTIONS, mill: MILL_TYPE_OPTIONS };
    default:
      return defaultOptionsForSection(section);
  }
}

function buildSectionOptions(section, records) {
  const resolved = resolveSectionOptions(section, records);
  if (resolved === null) return sectionDefault(section);
  switch (section.id) {
    case "cutting_tool_mill":
      return buildMillToolTypeOptions(resolved);
    case "cutting_tool_lathe":
      return buildLatheToolTypeOptions(resolved);
    default:
      return resolved;
  }
}

function buildOptions(records) {
  const opts = {};
  for (const section of INVENTORY_SECTIONS) {
    opts[section.id] = buildSectionOptions(section, records);
  }
  return opts;
}

// Backward-compatible loader (returns the options map).
export async function loadDropdownOptions(force = false) {
  const records = await loadInventory(force);
  return buildOptions(records);
}

export function useDropdownOptions() {
  const [opts, setOpts] = useState(() => buildOptions(null));
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