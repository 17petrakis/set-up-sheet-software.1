import { emptyTool, emptyOperation } from "@/lib/setupSheetDefaults";
import { TOOL_TYPE_OPTIONS } from "@/lib/toolTypeOptions";
import JSZip from 'jszip';

// Build a lookup of valid tool types (lowercase → correct case)
const TOOL_TYPE_LOOKUP = {};
TOOL_TYPE_OPTIONS.forEach(group => {
  group.children.forEach(child => {
    TOOL_TYPE_LOOKUP[child.value.toLowerCase()] = child.value;
  });
});

function normalizeText(text) {
  return String(text || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizeHeader(text) {
  return String(text || "").trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Find a label in a cell and determine if the value is in the same cell or the next cell(s).
 * Returns { sameCell: true, value } | { sameCell: false } | null
 */
function findLabelInCell(cellText, label) {
  const lower = cellText.toLowerCase();
  const idx = lower.indexOf(label);
  if (idx < 0) return null;

  // Character before must not be a letter (avoid matching inside words)
  if (idx > 0) {
    const prev = lower[idx - 1];
    if (prev >= "a" && prev <= "z") return null;
  }
  // Character after must not be a letter (avoid partial-word matches like "prog" in "programmer")
  const afterIdx = idx + label.length;
  if (afterIdx < lower.length) {
    const next = lower[afterIdx];
    if (next >= "a" && next <= "z") return null;
  }

  const after = cellText.substring(afterIdx).trim();
  if (after === "" || after === ":") return { sameCell: false };
  const colonMatch = after.match(/^[:=]\s*(.*)/);
  if (colonMatch) {
    if (colonMatch[1].trim()) return { sameCell: true, value: colonMatch[1].trim() };
    return { sameCell: false };
  }
  return null;
}

function rowValuesAfter(row, startCol) {
  const parts = [];
  for (let c = startCol; c < (row?.length || 0); c++) {
    if (row[c] != null && String(row[c]).trim()) {
      parts.push(String(row[c]).trim());
    }
  }
  return parts.join(" ");
}

function isSectionMarkerRow(row) {
  if (!row) return false;
  for (let c = 0; c < row.length; c++) {
    const norm = normalizeText(row[c]);
    if (norm.includes("toollist") || norm.includes("operationlist") ||
        norm.includes("operations") || norm.includes("partzero")) {
      return true;
    }
  }
  return false;
}

// ── General info labels (order doesn't matter; findLabelInCell prevents partial matches) ──
const generalLabels = [
  { label: "program location", field: "program_location" },
  { label: "programmer", field: "programmer" },
  { label: "program", field: "program" },
  { label: "prog", field: "program" },
  { label: "customer", field: "customer" },
  { label: "part number", field: "part_number" },
  { label: "part #", field: "part_number" },
  { label: "part#", field: "part_number" },
  { label: "part name", field: "part_name" },
  { label: "machine", field: "machine" },
  { label: "mach", field: "machine" },
  { label: "material", field: "material" },
  { label: "rev", field: "revision" },
  { label: "qty", field: "quantity" },
  { label: "date", field: "date" },
  { label: "operation", field: "program_description" },
];

// ── Tool header column mapping (raw lowercased text) ──
const toolHeaderMap = {
  "#": "tool_number", "t#": "tool_number", "tool#": "tool_number",
  "tool no": "tool_number", "tool no.": "tool_number",
  "type": "tool_type",
  "dia": "diameter", "diameter": "diameter",
  "flutes": "flutes",
  "stickout": "stickout_length", "stickout length": "stickout_length",
  "name": "name",
};

// ── Operation header column mapping ──
const opHeaderMap = {
  "op #": "op_number", "op#": "op_number", "op no": "op_number", "op no.": "op_number",
  "operation name": "operation_name",
  "comment": "comment",
  "tool #": "tool_number", "tool#": "tool_number", "tool": "tool_number",
  "min-z": "min_z", "min z": "min_z",
  "cycle time": "cycle_time",
  "type": "type",
  "feed": "feed",
  "max rpm": "max_rpm",
  "cut time": "cut_time",
};

function isToolHeaderRow(row) {
  let hasToolNum = false;
  let hasToolField = false;
  for (let c = 0; c < row.length; c++) {
    const h = normalizeHeader(row[c]);
    if (["#", "t#", "tool#", "tool no", "tool no."].includes(h)) hasToolNum = true;
    if (["type", "dia", "diameter", "flutes", "stickout", "stickout length", "name"].includes(h)) hasToolField = true;
  }
  return hasToolNum && hasToolField;
}

export function parseExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const XLSX = window.XLSX;
        if (!XLSX) { reject(new Error("SheetJS not loaded")); return; }
        const wb = XLSX.read(e.target.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

        const general = {};
        const tools = [];
        const operations = [];
        const partZero = {};
        let cycleTimeSeconds = 0;
        let hasCycleTime = false;

        // ── Pass 1: General info, CYCLE TIME, TIME ──
        rows.forEach((row) => {
          if (!row) return;
          for (let c = 0; c < row.length; c++) {
            const cellVal = row[c];
            if (cellVal == null) continue;
            const cellText = String(cellVal).trim();
            if (!cellText) continue;

            let matched = false;

            // CYCLE TIME (checked before TIME to avoid conflict)
            const ctResult = findLabelInCell(cellText, "cycle time");
            if (ctResult) {
              matched = true;
              let val = ctResult.sameCell ? ctResult.value : null;
              if (!val && row[c + 1] != null) val = String(row[c + 1]).trim();
              if (val) {
                const num = parseFloat(val);
                if (!isNaN(num) && num > 0 && num < 1) {
                  cycleTimeSeconds += Math.round(num * 86400);
                  hasCycleTime = true;
                } else {
                  const parts = val.split(/[:.]/).map(p => parseInt(p) || 0);
                  if (parts.length >= 3) {
                    cycleTimeSeconds += parts[0] * 3600 + parts[1] * 60 + parts[2];
                    hasCycleTime = true;
                  } else if (parts.length === 2) {
                    cycleTimeSeconds += parts[0] * 60 + parts[1];
                    hasCycleTime = true;
                  }
                }
              }
            }

            // TIME (num HOURS, num MINUTES, num SECONDS — may appear multiple times)
            if (!matched) {
              const tResult = findLabelInCell(cellText, "time");
              if (tResult) {
                let val = tResult.sameCell ? tResult.value : null;
                if (!val) val = rowValuesAfter(row, c + 1);
                if (val) {
                  const hMatch = val.match(/(\d+)\s*hours?/i);
                  const mMatch = val.match(/(\d+)\s*minutes?/i);
                  const sMatch = val.match(/(\d+)\s*seconds?/i);
                  if (hMatch || mMatch || sMatch) {
                    cycleTimeSeconds += (parseInt(hMatch?.[1]) || 0) * 3600
                      + (parseInt(mMatch?.[1]) || 0) * 60
                      + (parseInt(sMatch?.[1]) || 0);
                    hasCycleTime = true;
                    matched = true;
                  }
                }
              }
            }

            // General info labels
            if (!matched) {
              for (const { label, field } of generalLabels) {
                const result = findLabelInCell(cellText, label);
                if (result) {
                  let val = result.sameCell ? result.value : null;
                  if (!val) val = rowValuesAfter(row, c + 1);
                  if (val) {
                    if (field === "date" && row[c + 1] instanceof Date) {
                      val = row[c + 1].toISOString().split("T")[0];
                    }
                    general[field] = val;
                  }
                  matched = true;
                  break;
                }
              }
            }
          }
        });

        if (hasCycleTime) {
          const hrs = Math.floor(cycleTimeSeconds / 3600);
          const min = Math.floor((cycleTimeSeconds % 3600) / 60);
          const sec = cycleTimeSeconds % 60;
          general.cycle_time_hrs = String(hrs);
          general.cycle_time = `${min}:${String(sec).padStart(2, "0")}`;
        }

        // ── Pass 2: Tool lists ──
        const existingToolNumbers = new Set();
        const processedRows = new Set();

        for (let i = 0; i < rows.length; i++) {
          if (processedRows.has(i)) continue;
          const row = rows[i];
          if (!row) continue;

          let headerIdx = -1;

          // Check for "TOOL LIST" section marker
          for (let c = 0; c < row.length; c++) {
            if (normalizeText(row[c]).includes("toollist")) {
              headerIdx = i + 1;
              break;
            }
          }

          // If no section marker, check if this row is a tool header
          if (headerIdx < 0 && isToolHeaderRow(row)) {
            headerIdx = i;
          }

          if (headerIdx < 0) continue;
          const headerRow = rows[headerIdx];
          if (!headerRow) continue;

          // Map columns by header text
          const colMap = {};
          for (let c = 0; c < headerRow.length; c++) {
            const h = normalizeHeader(headerRow[c]);
            if (toolHeaderMap[h] !== undefined) {
              colMap[toolHeaderMap[h]] = c;
            }
          }
          if (colMap.tool_number === undefined) continue;
          processedRows.add(headerIdx);

          // Read data rows
          const toolFieldCols = ["tool_type", "diameter", "flutes", "stickout_length", "name"];
          for (let j = headerIdx + 1; j < rows.length; j++) {
            if (processedRows.has(j)) break;
            const dataRow = rows[j];
            if (!dataRow) break;
            if (isSectionMarkerRow(dataRow)) break;

            const toolNum = dataRow[colMap.tool_number];
            const toolNumStr = toolNum != null ? String(toolNum).trim() : "";

            // Check if row has any data in non-number columns
            const hasOtherData = toolFieldCols.some(f =>
              colMap[f] !== undefined && dataRow[colMap[f]] != null && String(dataRow[colMap[f]]).trim() !== ""
            );

            if (toolNumStr === "") {
              if (!hasOtherData) break; // completely empty row — end of section
              // Continuation row — append text to previous tool
              processedRows.add(j);
              if (tools.length > 0) {
                const lastTool = tools[tools.length - 1];
                for (const f of toolFieldCols) {
                  if (colMap[f] !== undefined && dataRow[colMap[f]] != null) {
                    const val = String(dataRow[colMap[f]]).trim();
                    if (val) lastTool[f] = lastTool[f] ? lastTool[f] + " " + val : val;
                  }
                }
              }
              continue;
            }

            // Only import tools with numerical tool numbers
            if (!/^\d+$/.test(toolNumStr)) continue;

            if (existingToolNumbers.has(toolNumStr)) continue;
            existingToolNumbers.add(toolNumStr);
            processedRows.add(j);

            const tool = { ...emptyTool, tool_number: toolNumStr };

            if (colMap.tool_type !== undefined && dataRow[colMap.tool_type] != null) {
              const typeStr = String(dataRow[colMap.tool_type]).trim();
              const correctCase = TOOL_TYPE_LOOKUP[typeStr.toLowerCase()];
              if (correctCase) tool.tool_type = correctCase;
            }
            if (colMap.diameter !== undefined && dataRow[colMap.diameter] != null) {
              tool.diameter = String(dataRow[colMap.diameter]).trim();
            }
            if (colMap.flutes !== undefined && dataRow[colMap.flutes] != null) {
              tool.flutes = String(dataRow[colMap.flutes]).trim();
            }
            if (colMap.stickout_length !== undefined && dataRow[colMap.stickout_length] != null) {
              tool.stickout_length = String(dataRow[colMap.stickout_length]).trim();
            }
            if (colMap.name !== undefined && dataRow[colMap.name] != null) {
              tool.name = String(dataRow[colMap.name]).trim();
            }

            tools.push(tool);
          }
        }

        // ── Pass 3: Operations ──
        for (let i = 0; i < rows.length; i++) {
          if (processedRows.has(i)) continue;
          const row = rows[i];
          if (!row) continue;

          let isOpsSection = false;
          for (let c = 0; c < row.length; c++) {
            const norm = normalizeText(row[c]);
            if (norm.includes("operationlist") || norm.includes("operations")) {
              isOpsSection = true;
              break;
            }
          }
          if (!isOpsSection) continue;
          processedRows.add(i);

          const headerRow = rows[i + 1];
          if (!headerRow) continue;
          processedRows.add(i + 1);

          const colMap = {};
          for (let c = 0; c < headerRow.length; c++) {
            const h = normalizeHeader(headerRow[c]);
            if (h === "operation name") {
              colMap.operation_name = c;
            } else if (opHeaderMap[h] !== undefined) {
              colMap[opHeaderMap[h]] = c;
            } else if (h === "operation" && colMap.operation_name === undefined) {
              colMap.operation_name = c;
            }
          }
          if (colMap.op_number === undefined) continue;

          const fieldCols = [
            "operation_name", "comment", "tool_number", "min_z",
            "cycle_time", "type", "feed", "max_rpm", "cut_time",
          ];
          for (let j = i + 2; j < rows.length; j++) {
            if (processedRows.has(j)) break;
            const dataRow = rows[j];
            if (!dataRow) break;
            if (isSectionMarkerRow(dataRow)) break;

            const opNum = dataRow[colMap.op_number];
            const opNumStr = opNum != null ? String(opNum).trim() : "";

            // Check if row has any data in non-number columns
            const hasOtherData = fieldCols.some(f =>
              colMap[f] !== undefined && dataRow[colMap[f]] != null && String(dataRow[colMap[f]]).trim() !== ""
            );

            if (opNumStr === "") {
              if (!hasOtherData) break; // completely empty row — end of section
              // Continuation row — append text to previous operation
              processedRows.add(j);
              if (operations.length > 0) {
                const lastOp = operations[operations.length - 1];
                for (const f of fieldCols) {
                  if (colMap[f] !== undefined && dataRow[colMap[f]] != null) {
                    const val = String(dataRow[colMap[f]]).trim();
                    if (val) lastOp[f] = lastOp[f] ? lastOp[f] + " " + val : val;
                  }
                }
              }
              continue;
            }

            processedRows.add(j);

            const op = { ...emptyOperation };
            op.op_number = opNumStr;

            for (const f of fieldCols) {
              if (colMap[f] !== undefined && dataRow[colMap[f]] != null) {
                op[f] = String(dataRow[colMap[f]]).trim();
              }
            }
            operations.push(op);
          }
        }

        // ── Pass 4: Part Zero ──
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          if (!row) continue;
          let isPartZero = false;
          for (let c = 0; c < row.length; c++) {
            if (normalizeText(row[c]).includes("partzero")) { isPartZero = true; break; }
          }
          if (!isPartZero) continue;

          const axisLabels = { x: "x", y: "y", z: "z" };
          for (let j = i + 1; j < Math.min(i + 10, rows.length); j++) {
            const dataRow = rows[j];
            if (!dataRow) continue;
            if (isSectionMarkerRow(dataRow)) break;
            for (let c = 0; c < dataRow.length; c++) {
              const cellNorm = normalizeText(dataRow[c]);
              if (axisLabels[cellNorm]) {
                const axis = axisLabels[cellNorm];
                const vals = [];
                for (let cc = c + 1; cc < dataRow.length && vals.length < 2; cc++) {
                  if (dataRow[cc] != null && String(dataRow[cc]).trim()) {
                    vals.push(String(dataRow[cc]).trim());
                  }
                }
                if (vals.length >= 2) {
                  partZero[`${axis}_max`] = vals[0];
                  partZero[`${axis}_min`] = vals[1];
                } else if (vals.length === 1) {
                  partZero[`${axis}_max`] = vals[0];
                }
                break;
              }
            }
          }
          if (Object.keys(partZero).length > 0) {
            partZero.part_zero_enabled = true;
          }
          break;
        }

        resolve({ general, tools, partZero, operations });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export async function extractExcelImage(file) {
  try {
    const XLSX = window.XLSX;
    if (!XLSX) return null;

    // Read arrayBuffer once
    const arrayBuffer = await file.arrayBuffer();

    // Step 1: Check for IMG: or PICTURE: label in the sheet
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const ws = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
    let hasImageLabel = false;
    for (const row of rows) {
      if (!row) continue;
      for (const cell of row) {
        if (cell == null) continue;
        const norm = String(cell).trim().toLowerCase().replace(/[^a-z]/g, "");
        if (norm === "img" || norm === "picture") {
          hasImageLabel = true;
          break;
        }
      }
      if (hasImageLabel) break;
    }
    if (!hasImageLabel) {
      console.log("[extractExcelImage] No IMG: or PICTURE: label found, skipping image extraction");
      return null;
    }

    // Step 2: Extract embedded image via JSZip (use slice to avoid buffer mutation)
    const zip = await JSZip.loadAsync(arrayBuffer.slice(0));

    // List all files for debugging
    const allFiles = Object.keys(zip.files);
    const mediaFiles = allFiles.filter(f => f.startsWith('xl/media/') || f.startsWith('xl/embeddings/'));
    console.log("[extractExcelImage] All media/embedding files:", mediaFiles);

    if (mediaFiles.length === 0) {
      console.log("[extractExcelImage] No media files found in xl/media/ or xl/embeddings/");
      return null;
    }

    // Helper: scan binary data for embedded raster image signatures
    // EMF/WMF files from CAD pastes often contain embedded PNG or JPEG data
    const extractRasterFromBinary = (uint8) => {
      const pngSig = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
      const jpgSig = [0xFF, 0xD8, 0xFF];

      // Search for PNG signature
      for (let i = 0; i < uint8.length - 8; i++) {
        if (uint8[i] === pngSig[0] && uint8[i+1] === pngSig[1] && uint8[i+2] === pngSig[2] && uint8[i+3] === pngSig[3]) {
          // Find IEND chunk to get the end of PNG data
          const iendMarker = [0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82];
          for (let j = i + 8; j < uint8.length - 8; j++) {
            if (uint8[j] === iendMarker[0] && uint8[j+1] === iendMarker[1] && uint8[j+2] === iendMarker[2] && uint8[j+3] === iendMarker[3]) {
              const pngData = uint8.slice(i, j + 8);
              console.log("[extractExcelImage] Found embedded PNG in binary data, size:", pngData.length);
              return { data: pngData, mimeType: 'image/png' };
            }
          }
        }
      }

      // Search for JPEG signature (FFD8FF...FFD9)
      for (let i = 0; i < uint8.length - 3; i++) {
        if (uint8[i] === jpgSig[0] && uint8[i+1] === jpgSig[1] && uint8[i+2] === jpgSig[2]) {
          // Find JPEG end marker (FFD9)
          for (let j = uint8.length - 2; j > i; j--) {
            if (uint8[j] === 0xFF && uint8[j+1] === 0xD9) {
              const jpgData = uint8.slice(i, j + 2);
              console.log("[extractExcelImage] Found embedded JPEG in binary data, size:", jpgData.length);
              return { data: jpgData, mimeType: 'image/jpeg' };
            }
          }
        }
      }

      return null;
    };

    // Collect all candidate images (direct displayable + raster extracted from EMF/WMF)
    const candidates = [];
    for (const f of mediaFiles) {
      const entry = zip.files[f];
      if (!entry || entry.dir) continue;
      const uint8 = await entry.async('uint8array');
      const ext = f.split('.').pop().toLowerCase();

      if (['png', 'jpg', 'jpeg', 'gif', 'bmp'].includes(ext)) {
        const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'gif' ? 'image/gif' : ext === 'bmp' ? 'image/bmp' : 'image/png';
        candidates.push({ name: f, data: uint8, mimeType, size: uint8.length });
        console.log("[extractExcelImage] Direct displayable image:", f, "size:", uint8.length);
      } else if (['emf', 'wmf'].includes(ext)) {
        // Try to extract embedded raster from EMF/WMF
        console.log("[extractExcelImage] EMF/WMF file found, scanning for embedded raster:", f);
        const raster = extractRasterFromBinary(uint8);
        if (raster) {
          candidates.push({ name: f + ' (extracted raster)', data: raster.data, mimeType: raster.mimeType, size: raster.data.length });
        } else {
          console.log("[extractExcelImage] No embedded raster found in", f);
        }
      } else {
        // For .bin or other files (OLE objects), also try scanning for embedded images
        console.log("[extractExcelImage] Scanning unknown format for embedded image:", f);
        const raster = extractRasterFromBinary(uint8);
        if (raster) {
          candidates.push({ name: f + ' (extracted raster)', data: raster.data, mimeType: raster.mimeType, size: raster.data.length });
        }
      }
    }

    if (candidates.length === 0) {
      console.log("[extractExcelImage] No displayable images could be extracted");
      return null;
    }

    // Use the largest candidate
    candidates.sort((a, b) => b.size - a.size);
    const best = candidates[0];
    console.log("[extractExcelImage] Best image:", best.name, "size:", best.size, "type:", best.mimeType);

    // Convert to base64 data URL
    let base64 = '';
    const chunkSize = 8192;
    for (let i = 0; i < best.data.length; i += chunkSize) {
      const chunk = best.data.subarray(i, i + chunkSize);
      base64 += String.fromCharCode.apply(null, chunk);
    }
    return `data:${best.mimeType};base64,${btoa(base64)}`;
  } catch (e) {
    console.error("[extractExcelImage] Error:", e);
  }
  return null;
}