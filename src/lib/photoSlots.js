export const DEFAULT_CATEGORIES = [
  { key: "drawing", label: "Drawing" },
  { key: "work_holding", label: "Work Holding" },
  { key: "material_stock", label: "Material Stock" },
  { key: "iso", label: "ISO View" },
  { key: "final_part", label: "Final Part" },
];

// Includes final_part_2 for migration from old data
const MIGRATION_SLOTS = [...DEFAULT_CATEGORIES, { key: "final_part_2", label: "Final Part 2" }];

export function migratePhotoSlots(photos) {
  if (!photos) return [];
  if (photos.__slots) return photos.__slots;
  const slots = [];
  MIGRATION_SLOTS.forEach(({ key, label }) => {
    if (photos[key]) {
      slots.push({ id: key, category: key, label: `${label} Photo`, url: photos[key], note: photos[`${key}__note`] || "" });
    }
  });
  (photos.__extra_slots || []).forEach(({ key, label }) => {
    if (photos[key]) {
      slots.push({ id: key, category: "custom", label, url: photos[key], note: photos[`${key}__note`] || "" });
    }
  });
  return slots;
}