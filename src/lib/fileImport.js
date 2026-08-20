import { emptyTool, emptyOperation } from "@/lib/setupSheetDefaults";
import { TOOL_FIELDS, getDefaultVisibleFields } from "@/lib/toolTypeOptions";
import JSZip from 'jszip';
import { isCFB, parseCFB, extractMsodrawingData, stripAllBiffHeaders } from '@/lib/cfbParser';

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
  { label: "file name", field: "program" },
  { label: "machinist", field: "programmer" },
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
  "dia": "diameter", "diameter": "diameter", "tool dia": "diameter",
  "flutes": "flutes", "flute": "flutes",
  "flute len": "flute_length", "flute length": "flute_length", "fl len": "flute_length",
  "stickout": "stickout_length", "stickout length": "stickout_length", "stick out": "stickout_length",
  "cut length": "cut_length", "cut len": "cut_length",
  "holder": "holder", "tool holder": "holder",
  "thread pitch": "thread_pitch", "pitch": "thread_pitch",
  "thread form": "thread_form", "form": "thread_form",
  "min bore": "min_bore_diameter", "min bore dia": "min_bore_diameter", "min bore diameter": "min_bore_diameter",
  "max bore": "max_bore_diameter", "max bore dia": "max_bore_diameter", "max bore diameter": "max_bore_diameter",
  "insert count": "insert_count", "# inserts": "insert_count", "inserts": "insert_count",
  "insert type": "insert_type", "insert": "insert_type",
  "blade thickness": "blade_thickness", "blade": "blade_thickness", "blade thick": "blade_thickness",
  "arbor": "arbor_size", "arbor size": "arbor_size",
  "tip angle": "angle", "angle": "angle",
  "tool comment": "name", "comment": "name", "name": "name",
};

// Compute visible_fields overrides so that fields with imported data are shown,
// and default-visible fields with no data are hidden.
function computeImportedVisibleFields(tool) {
  const defaults = getDefaultVisibleFields(tool.tool_type);
  const overrides = {};
  for (const f of TOOL_FIELDS) {
    const hasData = tool[f.key] != null && String(tool[f.key]).trim() !== "";
    if (hasData && !defaults[f.key]) overrides[f.key] = true;
    else if (!hasData && defaults[f.key]) overrides[f.key] = false;
  }
  return overrides;
}

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
    const mapped = toolHeaderMap[h];
    if (mapped === "tool_number") hasToolNum = true;
    else if (mapped) hasToolField = true;
  }
  return hasToolNum && hasToolField;
}

function isOpsHeaderRow(row) {
  let hasOpNum = false;
  let hasOpField = false;
  for (let c = 0; c < row.length; c++) {
    const h = normalizeHeader(row[c]);
    if (h === "operation name") { hasOpField = true; continue; }
    const mapped = opHeaderMap[h];
    if (mapped === "op_number") hasOpNum = true;
    else if (mapped) hasOpField = true;
  }
  return hasOpNum && hasOpField;
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

        // Unmerge cells: propagate top-left value DOWN within the same column only.
        // This fixes vertically merged cells (common in TYPE columns) without
        // contaminating other columns from wide horizontal/rectangular merges.
        if (ws['!merges']) {
          for (const merge of ws['!merges']) {
            const startCellAddr = XLSX.utils.encode_cell({ r: merge.s.r, c: merge.s.c });
            const cellValue = ws[startCellAddr];
            if (cellValue) {
              for (let r = merge.s.r; r <= merge.e.r; r++) {
                const addr = XLSX.utils.encode_cell({ r, c: merge.s.c });
                if (!ws[addr]) ws[addr] = { ...cellValue };
              }
            }
          }
        }

        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

        const general = {};
        const tools = [];
        const operations = [];
        const partZero = {};
        let cycleTimeSeconds = 0;
        let hasCycleTime = false;

        // ── Detect CAM from "Set Up Sheet.G" / "Set Up Sheet.M" in cell A1 ──
        const firstCellText = normalizeText(rows[0]?.[0]);
        if (firstCellText.startsWith("setupsheetg")) {
          general.program_software = "Gibbscam";
        } else if (firstCellText.startsWith("setupsheetm")) {
          general.program_software = "Mastercam";
        }

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

          // Map columns by header text — first match wins so duplicate headers
          // (e.g. "TYPE" appearing in both tool list and operation sections on
          // the same row) don't overwrite the correct tool column.
          const colMap = {};
          for (let c = 0; c < headerRow.length; c++) {
            const h = normalizeHeader(headerRow[c]);
            const mapped = toolHeaderMap[h];
            if (mapped !== undefined && colMap[mapped] === undefined) {
              colMap[mapped] = c;
            }
          }
          if (colMap.tool_number === undefined) continue;
          processedRows.add(headerIdx);

          // Read data rows
          // tool_type is excluded from continuation row appending to prevent corruption
          const toolFieldCols = TOOL_FIELDS.map(f => f.key);
          const allFieldCols = ["tool_type", ...toolFieldCols];
          for (let j = headerIdx + 1; j < rows.length; j++) {
            if (processedRows.has(j)) break;
            const dataRow = rows[j];
            if (!dataRow) break;
            if (isSectionMarkerRow(dataRow)) break;

            const toolNum = dataRow[colMap.tool_number];
            const toolNumStr = toolNum != null ? String(toolNum).trim() : "";

            // Check if row has any data in non-number columns (including tool_type)
            const hasOtherData = allFieldCols.some(f =>
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
                lastTool.visible_fields = computeImportedVisibleFields(lastTool);
              }
              continue;
            }

            // Import tools with numerical tool numbers or "N/A"
            if (!/^\d+$/.test(toolNumStr) && toolNumStr.toUpperCase() !== "N/A" && toolNumStr.toUpperCase() !== "#N/A") continue;

            if (existingToolNumbers.has(toolNumStr)) continue;
            existingToolNumbers.add(toolNumStr);
            processedRows.add(j);

            const tool = { ...emptyTool, tool_number: toolNumStr };

            if (colMap.tool_type !== undefined && dataRow[colMap.tool_type] != null) {
              tool.tool_type = String(dataRow[colMap.tool_type]).trim();
            }
            for (const f of TOOL_FIELDS) {
              if (colMap[f.key] !== undefined && dataRow[colMap[f.key]] != null) {
                tool[f.key] = String(dataRow[colMap[f.key]]).trim();
              }
            }

            tool.visible_fields = computeImportedVisibleFields(tool);

            tools.push(tool);
          }
        }

        // ── Pass 3: Operations ──
        // Uses its own processed-rows set so that side-by-side layouts (where
        // tool list and operations share the same rows but different columns)
        // are not blocked by the tool list parser's processedRows.
        const processedOpsRows = new Set();

        for (let i = 0; i < rows.length; i++) {
          if (processedOpsRows.has(i)) continue;
          const row = rows[i];
          if (!row) continue;

          let headerIdx = -1;

          // Check for "OPERATION LIST" / "OPERATIONS" section marker
          for (let c = 0; c < row.length; c++) {
            const norm = normalizeText(row[c]);
            if (norm.includes("operationlist") || norm.includes("operations")) {
              headerIdx = i + 1;
              break;
            }
          }

          // If no marker, check if this row is itself an operations header row
          // (handles side-by-side layouts where tool list and ops share a header row)
          if (headerIdx < 0 && isOpsHeaderRow(row)) {
            headerIdx = i;
          }

          if (headerIdx < 0) continue;
          const headerRow = rows[headerIdx];
          if (!headerRow) continue;
          processedOpsRows.add(headerIdx);

          // Map columns — last match wins so that when the same header text
          // appears in both the tool list (left) and operations (right) sections,
          // the operations column (rightmost) is used.
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
          for (let j = headerIdx + 1; j < rows.length; j++) {
            if (processedOpsRows.has(j)) break;
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
              processedOpsRows.add(j);
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

            processedOpsRows.add(j);

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

// Extract a Device Independent Bitmap (DIB) from EMF/WMF binary data.
// EMF files from Excel/Mastercam typically store the actual image as a
// StretchDIBits record containing a BITMAPINFOHEADER + color table + pixel data.
// Browsers cannot natively render EMF, so we extract the embedded bitmap and
// reconstruct a proper BMP file that the browser CAN decode.
function findAllDibs(uint8) {
  const len = uint8.length;
  const dibs = [];
  // Scan for BITMAPINFOHEADER structures. biSize is a 4-byte LE int at the start:
  // 40 = BITMAPINFOHEADER, 108 = BITMAPV4HEADER, 124 = BITMAPV5HEADER
  for (let i = 0; i <= len - 40; i++) {
    const biSize = uint8[i] | (uint8[i + 1] << 8) | (uint8[i + 2] << 16) | (uint8[i + 3] << 24);
    if (biSize !== 40 && biSize !== 108 && biSize !== 124) continue;

    const biWidth = uint8[i + 4] | (uint8[i + 5] << 8) | (uint8[i + 6] << 16) | (uint8[i + 7] << 24);
    const biHeight = uint8[i + 8] | (uint8[i + 9] << 8) | (uint8[i + 10] << 16) | (uint8[i + 11] << 24);
    const biBitCount = uint8[i + 14] | (uint8[i + 15] << 8);
    const biCompression = uint8[i + 16] | (uint8[i + 17] << 8) | (uint8[i + 18] << 16) | (uint8[i + 19] << 24);

    // Validate: reasonable dimensions, valid bit depth
    if (biWidth <= 0 || biWidth > 20000 || biHeight === 0 || Math.abs(biHeight) > 20000) continue;
    if (![1, 4, 8, 16, 24, 32].includes(biBitCount)) continue;

    // For PNG/JPEG-compressed bitmaps (biCompression 3/4), the pixel data IS a PNG/JPEG
    // — the magic byte scanner already handles those. Here we handle raw DIB data (compression 0).
    if (biCompression !== 0 && biCompression !== 3) continue;

    const absHeight = Math.abs(biHeight);
    const rowSize = Math.floor((biWidth * biBitCount + 31) / 32) * 4;
    const colorTableSize = biBitCount <= 8 ? 4 * (1 << biBitCount) : 0;
    const dataSize = rowSize * absHeight;
    const totalDibSize = biSize + colorTableSize + dataSize;

    if (i + totalDibSize > len || totalDibSize < 10) continue;

    // Reconstruct a BMP file: 14-byte file header + DIB data
    const bmp = new Uint8Array(14 + totalDibSize);
    bmp[0] = 0x42; bmp[1] = 0x4D; // "BM"
    const fileSize = 14 + totalDibSize;
    bmp[2] = fileSize & 0xFF;
    bmp[3] = (fileSize >> 8) & 0xFF;
    bmp[4] = (fileSize >> 16) & 0xFF;
    bmp[5] = (fileSize >> 24) & 0xFF;
    // Reserved bytes 6-9 = 0
    const pixelOffset = 14 + biSize + colorTableSize;
    bmp[10] = pixelOffset & 0xFF;
    bmp[11] = (pixelOffset >> 8) & 0xFF;
    bmp[12] = (pixelOffset >> 16) & 0xFF;
    bmp[13] = (pixelOffset >> 24) & 0xFF;
    bmp.set(uint8.subarray(i, i + totalDibSize), 14);
    dibs.push(bmp);
    // Skip past this DIB to avoid overlapping matches
    i += totalDibSize - 1;
  }
  return dibs;
}

// Search a Uint8Array for ALL image data by magic bytes.
// Detects PNG, JPEG, BMP, GIF, EMF, and WMF.
// Catches images stored as standalone files AND images embedded inside
// OLE containers (xl/embeddings/*.bin). Collects ALL matches so the
// caller can pick the largest (the real image, not a tiny icon).
function findImagesInBytes(uint8) {
  const results = [];
  const len = uint8.length;

  // Find ALL PNGs — full 8-byte signature: \x89PNG\r\n\x1a\n
  let i = 0;
  while (i <= len - 8) {
    if (uint8[i] === 0x89 && uint8[i + 1] === 0x50 && uint8[i + 2] === 0x4E &&
        uint8[i + 3] === 0x47 && uint8[i + 4] === 0x0D && uint8[i + 5] === 0x0A &&
        uint8[i + 6] === 0x1A && uint8[i + 7] === 0x0A) {
      let end = -1;
      for (let j = i + 8; j <= len - 8; j++) {
        // IEND chunk marker
        if (uint8[j] === 0x49 && uint8[j + 1] === 0x45 && uint8[j + 2] === 0x4E &&
            uint8[j + 3] === 0x44 && uint8[j + 4] === 0xAE && uint8[j + 5] === 0x42 &&
            uint8[j + 6] === 0x60 && uint8[j + 7] === 0x82) {
          end = j + 8;
          break;
        }
      }
      if (end > 0) {
        results.push({ type: 'image/png', data: uint8.slice(i, end) });
        i = end;
        continue;
      }
    }
    i++;
  }

  // Find ALL JPEGs — \xff\xd8\xff ... \xff\xd9
  i = 0;
  while (i <= len - 3) {
    if (uint8[i] === 0xFF && uint8[i + 1] === 0xD8 && uint8[i + 2] === 0xFF) {
      let end = -1;
      for (let j = i + 3; j <= len - 2; j++) {
        if (uint8[j] === 0xFF && uint8[j + 1] === 0xD9) {
          end = j + 2;
          break;
        }
      }
      if (end > 0) {
        results.push({ type: 'image/jpeg', data: uint8.slice(i, end) });
        i = end;
        continue;
      }
    }
    i++;
  }

  // Find ALL BMPs — "BM" signature, file size at offset +2 (4 bytes LE)
  i = 0;
  while (i <= len - 6) {
    if (uint8[i] === 0x42 && uint8[i + 1] === 0x4D) {
      const fileSize = uint8[i + 2] | (uint8[i + 3] << 8) | (uint8[i + 4] << 16) | (uint8[i + 5] << 24);
      const end = fileSize > 0 && i + fileSize <= len ? i + fileSize : len;
      results.push({ type: 'image/bmp', data: uint8.slice(i, end) });
      i = end;
      continue;
    }
    i++;
  }

  // Find ALL GIFs — "GIF87a" or "GIF89a", ends with 0x3B
  i = 0;
  while (i <= len - 6) {
    if (uint8[i] === 0x47 && uint8[i + 1] === 0x49 && uint8[i + 2] === 0x46 &&
        uint8[i + 3] === 0x38 && (uint8[i + 4] === 0x37 || uint8[i + 4] === 0x39) && uint8[i + 5] === 0x61) {
      let end = len;
      for (let j = i + 6; j < len; j++) {
        if (uint8[j] === 0x3B) { end = j + 1; break; }
      }
      results.push({ type: 'image/gif', data: uint8.slice(i, end) });
      i = end;
      continue;
    }
    i++;
  }

  // Find ALL EMF — signature " EMF" (0x20 0x45 0x4D 0x46) at offset 40 from header start.
  // File size (nBytes) is at offset 48 from header start = offset +8 from the signature.
  i = 0;
  while (i <= len - 44) {
    if (uint8[i] === 0x20 && uint8[i + 1] === 0x45 && uint8[i + 2] === 0x4D && uint8[i + 3] === 0x46) {
      const headerStart = i - 40;
      if (headerStart >= 0) {
        const nBytes = uint8[headerStart + 48] | (uint8[headerStart + 49] << 8) |
                       (uint8[headerStart + 50] << 16) | (uint8[headerStart + 51] << 24);
        const end = nBytes > 0 && headerStart + nBytes <= len ? headerStart + nBytes : len;
        results.push({ type: 'image/emf', data: uint8.slice(headerStart, end) });
        i = end;
        continue;
      }
    }
    i++;
  }

  // Find ALL placeable WMFs — key 0xD7CDC69A at offset 0
  i = 0;
  while (i <= len - 4) {
    if (uint8[i] === 0xD7 && uint8[i + 1] === 0xCD && uint8[i + 2] === 0xC6 && uint8[i + 3] === 0x9A) {
      results.push({ type: 'image/wmf', data: uint8.slice(i) });
      i = len;
      continue;
    }
    i++;
  }

  return results;
}

// Check if a canvas image is blank (all-white, all-transparent, or nearly
// uniform noise). Samples a grid of pixels for efficiency. Returns true if
// the image has no meaningful visible content — defined as fewer than 12% of
// sampled pixels differing significantly (delta > 30 per channel) from the
// dominant color. The high threshold filters out garbage/noise candidates
// (OLE2 data misread as pixels) that have only a few stray colored pixels,
// while real line drawings and photos easily exceed 12% coverage.
function isImageBlank(ctx, width, height) {
  // ctx is already created with willReadFrequently: true
  if (width <= 0 || height <= 0) return true;
  const stepX = Math.max(1, Math.floor(width / 100));
  const stepY = Math.max(1, Math.floor(height / 100));
  let firstR = -1, firstG = -1, firstB = -1;
  let totalSamples = 0;
  let variedSamples = 0;
  for (let y = 0; y < height; y += stepY) {
    for (let x = 0; x < width; x += stepX) {
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const r = pixel[0], g = pixel[1], b = pixel[2], a = pixel[3];
      // Skip fully transparent pixels
      if (a < 10) continue;
      totalSamples++;
      if (firstR === -1) {
        firstR = r; firstG = g; firstB = b;
      } else {
        if (Math.abs(r - firstR) > 30 || Math.abs(g - firstG) > 30 || Math.abs(b - firstB) > 30) {
          variedSamples++;
        }
      }
    }
  }
  if (totalSamples === 0) return true; // all transparent
  // Real images have at least 12% of pixels differing significantly from the background
  return variedSamples / totalSamples < 0.12;
}

// Try to render an image blob via the browser's native decoder, rasterize to
// a PNG data URL via canvas, and reject blank/all-white images. Falls back to
// null if the browser can't decode the format or the image is blank.
function tryConvertToPng(data, mimeType) {
  return new Promise((resolve) => {
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    let settled = false;
    const cleanup = () => { URL.revokeObjectURL(url); };
    img.onload = () => {
      if (settled) return;
      settled = true;
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || 800;
      canvas.height = img.naturalHeight || 600;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
      cleanup();
      if (isImageBlank(ctx, canvas.width, canvas.height)) {
        resolve(null);
        return;
      }
      try { resolve(canvas.toDataURL('image/png')); }
      catch (e) { resolve(null); }
    };
    img.onerror = () => { if (settled) return; settled = true; cleanup(); resolve(null); };
    img.src = url;
    setTimeout(() => { if (settled) return; settled = true; cleanup(); resolve(null); }, 4000);
  });
}

function uint8ToBase64(uint8) {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < uint8.length; i += chunk) {
    binary += String.fromCharCode.apply(null, uint8.subarray(i, i + chunk));
  }
  return btoa(binary);
}

const IMAGE_EXTENSIONS = /\.(png|jpe?g|gif|bmp|webp|tiff?|emf|wmf|svg)$/i;

const EXT_TO_MIME = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
  gif: 'image/gif', bmp: 'image/bmp', webp: 'image/webp',
  tif: 'image/tiff', tiff: 'image/tiff', svg: 'image/svg+xml',
  emf: 'image/emf', wmf: 'image/wmf',
};

// Process a list of image candidates, sorted largest-first.
// Returns { labelFound, dataUrl } for the first one that renders, or null.
async function processCandidates(candidates) {
  if (candidates.length === 0) return null;

  candidates.sort((a, b) => b.size - a.size);

  for (const candidate of candidates) {
    // For EMF/WMF — browser can't render these natively.
    // Try extracting embedded DIB (raw bitmap) data from the EMF and converting to BMP.
    if (candidate.mimeType === 'image/emf' || candidate.mimeType === 'image/wmf') {
      const dibs = findAllDibs(candidate.data);
      for (const dib of dibs) {
        const pngDataUrl = await tryConvertToPng(dib, 'image/bmp');
        if (pngDataUrl) return { labelFound: true, dataUrl: pngDataUrl };
      }
      continue;
    }

    // For all other formats (PNG, JPEG, BMP, GIF, WEBP, SVG, TIFF) — render
    // via canvas and reject blank/all-white images so we fall through to the
    // next candidate (the real image) instead of stopping at a blank placeholder.
    const pngDataUrl = await tryConvertToPng(candidate.data, candidate.mimeType);
    if (pngDataUrl) return { labelFound: true, dataUrl: pngDataUrl };
  }

  return null;
}

export async function extractExcelImage(file) {
  const arrayBuffer = await file.arrayBuffer();
  const rawBytes = new Uint8Array(arrayBuffer);
  console.log("[extractExcelImage] File:", file.name, "size:", file.size, "type:", file.type);

  // ── Strategy 1: Parse as .xlsx (zip) and look for image files ──
  try {
    const zip = await JSZip.loadAsync(arrayBuffer.slice(0));
    const allFiles = Object.keys(zip.files).filter(f => !zip.files[f].dir);
    console.log("[extractExcelImage] Zip parsed. Files:", allFiles.length, allFiles.slice(0, 30));
    const candidates = [];

    // 1a: Look in xl/media/ etc. for image files by extension
    const mediaFiles = allFiles.filter(f => IMAGE_EXTENSIONS.test(f));
    console.log("[extractExcelImage] Media files by extension:", mediaFiles);
    for (const f of mediaFiles) {
      const ext = f.toLowerCase().match(/\.([a-z]+)$/)?.[1] || '';
      const uint8 = await zip.files[f].async('uint8array');
      console.log(`[extractExcelImage]   ${f} (${ext}) → ${uint8.length} bytes`);
      candidates.push({
        file: f,
        data: uint8,
        mimeType: EXT_TO_MIME[ext] || 'application/octet-stream',
        size: uint8.length,
      });
    }

    // 1b: Scan ALL files for embedded image data by magic bytes
    for (const f of allFiles) {
      if (IMAGE_EXTENSIONS.test(f)) continue;
      const uint8 = await zip.files[f].async('uint8array');
      const images = findImagesInBytes(uint8);
      if (images.length) console.log(`[extractExcelImage]   Magic bytes in ${f}:`, images.map(i => `${i.type}(${i.data.length})`));
      for (const img of images) {
        candidates.push({ file: f, data: img.data, mimeType: img.type, size: img.data.length });
      }
    }

    console.log("[extractExcelImage] Total candidates from zip:", candidates.length);
    const result = await processCandidates(candidates);
    if (result) {
      console.log("[extractExcelImage] ✓ Extracted from zip, dataUrl length:", result.dataUrl?.length);
      return result;
    }
    console.log("[extractExcelImage] No image rendered from zip candidates");
  } catch (e) {
    console.log("[extractExcelImage] Zip parse failed (probably .xls not .xlsx):", e.message);
  }

  // ── Strategy 2: Parse as .xls (CFB/OLE2 compound document, Excel 97-2003) ──
  // .xls files are not zip-based; they use the OLE2 compound document format.
  // Images are stored in streams that may be fragmented across non-contiguous
  // sectors, and embedded inside MSODrawing BIFF records that are split across
  // CONTINUE records with 4-byte headers interspersed in the image data.
  if (isCFB(rawBytes)) {
    try {
      const streams = parseCFB(rawBytes);
      if (streams && streams.length > 0) {
        console.log("[extractExcelImage] CFB streams:", streams.map(s => `${s.name}(${s.data.length})`));
        const cfbCandidates = [];
        for (const { name, data } of streams) {
          // 2a: Scan raw stream data for image magic bytes (OLE objects, etc.)
          const imgs = findImagesInBytes(data);
          for (const img of imgs) {
            cfbCandidates.push({ file: name, data: img.data, mimeType: img.type, size: img.data.length });
          }
          // 2b: Strip BIFF record headers from MSODrawing records, then scan
          // the reconstructed contiguous OfficeArt data for images and DIBs.
          const msodGroups = extractMsodrawingData(data);
          for (const group of msodGroups) {
            const groupImgs = findImagesInBytes(group);
            for (const img of groupImgs) {
              cfbCandidates.push({ file: `${name}#msod`, data: img.data, mimeType: img.type, size: img.data.length });
            }
            const dibs = findAllDibs(group);
            for (const dib of dibs) {
              cfbCandidates.push({ file: `${name}#dib`, data: dib, mimeType: 'image/bmp', size: dib.length });
            }
          }
          // 2c: Strip ALL BIFF record headers and scan — aggressive fallback
          // that reassembles image data split across any record type's CONTINUEs.
          const stripped = stripAllBiffHeaders(data);
          const strippedImgs = findImagesInBytes(stripped);
          for (const img of strippedImgs) {
            cfbCandidates.push({ file: `${name}#stripped`, data: img.data, mimeType: img.type, size: img.data.length });
          }
          const strippedDibs = findAllDibs(stripped);
          for (const dib of strippedDibs) {
            cfbCandidates.push({ file: `${name}#stripped-dib`, data: dib, mimeType: 'image/bmp', size: dib.length });
          }
        }
        console.log("[extractExcelImage] CFB candidates:", cfbCandidates.length);
        const cfbResult = await processCandidates(cfbCandidates);
        if (cfbResult) {
          console.log("[extractExcelImage] ✓ Extracted from CFB, dataUrl length:", cfbResult.dataUrl?.length);
          return cfbResult;
        }
        console.log("[extractExcelImage] No image rendered from CFB candidates");
      }
    } catch (e) {
      console.log("[extractExcelImage] CFB parse failed:", e.message);
    }
  }

  // ── Strategy 3: Scan the raw file bytes directly ──
  console.log("[extractExcelImage] Scanning raw bytes, length:", rawBytes.length);

  // 2a: Scan for image magic bytes (PNG, JPEG, BMP, GIF, EMF, WMF)
  const rawImages = findImagesInBytes(rawBytes);
  console.log("[extractExcelImage] Raw magic-byte matches:", rawImages.map(i => `${i.type}(${i.data.length})`));
  const rawCandidates = rawImages.map(img => ({
    file: '<raw>',
    data: img.data,
    mimeType: img.type,
    size: img.data.length,
  }));

  // 2b: Also scan for embedded DIB (BITMAPINFOHEADER) structures — these are the
  // actual bitmaps inside EMF records and are more reliable than "BM" magic bytes.
  const dibs = findAllDibs(rawBytes);
  console.log("[extractExcelImage] DIB matches:", dibs.length, dibs.map(d => `${d.length}`));
  for (const dib of dibs) {
    rawCandidates.push({ file: '<dib>', data: dib, mimeType: 'image/bmp', size: dib.length });
  }

  const rawResult = await processCandidates(rawCandidates);
  if (rawResult) {
    console.log("[extractExcelImage] ✓ Extracted from raw bytes, dataUrl length:", rawResult.dataUrl?.length);
    return rawResult;
  }

  console.log("[extractExcelImage] ✗ No image could be extracted");
  return { labelFound: false, dataUrl: null };
}