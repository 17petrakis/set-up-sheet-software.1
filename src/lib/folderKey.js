// One stable identity per part folder: the folder id, or a derived key for
// legacy sheets saved before folder ids existed. Every screen that groups,
// opens, updates or deletes a folder uses this so a part can never be
// re-grouped differently between two screens.
export const folderKeyOf = (sheet) =>
  sheet?.folder_id || `legacy__${sheet?.part_number || ""}__${sheet?.customer || ""}`;