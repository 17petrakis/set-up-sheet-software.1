export const DEFAULT_CATEGORIES = [
  { key: "drawing", label: "Drawing" },
  { key: "work_holding", label: "Work Holding" },
  { key: "material_stock", label: "Material Stock" },
  { key: "iso", label: "ISO View" },
  { key: "final_part", label: "Final Part" },
];

// Includes final_part_2 for migration from old data
const MIGRATION_SLOTS = [...DEFAULT_CATEGORIES, { key: "final_part_2", label: "Final Part 2" }];

// Pick the best photo to use as a part icon.
// Priority: final_part → iso → drawing → first custom (in order of appearance)
export function getPartIconPhoto(photos) {
  if (!photos) return null;
  if (photos.__slots) {
    const slots = photos.__slots;
    const find = (cat) => slots.find(s => s.category === cat && s.url);
    const finalPart = slots.find(s => (s.category === "final_part" || s.category === "final_part_2") && s.url);
    return finalPart?.url || find("iso")?.url || find("drawing")?.url || slots.find(s => s.category === "custom" && s.url)?.url || null;
  }
  // Legacy flat structure
  if (photos.final_part) return photos.final_part;
  if (photos.final_part_2) return photos.final_part_2;
  if (photos.iso) return photos.iso;
  if (photos.drawing) return photos.drawing;
  // Custom photos: stored as photos[key] with metadata in __extra_slots
  const extra = photos.__extra_slots || [];
  for (const { key } of extra) {
    if (photos[key]) return photos[key];
  }
  return null;
}

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