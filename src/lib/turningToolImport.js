// Mapping from Excel tool type text to setup sheet tool kind + type
const EXCEL_TYPE_MAP = {
  "general turning tool": { kind: "Turn", type: "Turning" },
  "grooving tool": { kind: "Turn", type: "Groove/Cutoff" },
  "threading tool": { kind: "Turn", type: "Thread" },
  "cut off tool": { kind: "Turn", type: "Groove/Cutoff" },
  "boring tool": { kind: "Turn", type: "Boring" },
  "drilling tool": { kind: "Turn", type: "Drill" },
  "tapping tool": { kind: "Turn", type: "Taps" },
  "reaming tool": { kind: "Turn", type: "Reaming" },
  "manual tool": { kind: "Turn", type: "Manual" },
  "flat end mill": { kind: "Mill", type: "Mill" },
  "bull end mill": { kind: "Mill", type: "Mill" },
  "ball end mill": { kind: "Mill", type: "Mill" },
  "chamfer mill": { kind: "Mill", type: "Mill" },
  "face mill": { kind: "Mill", type: "Mill" },
  "center drill / spot drill": { kind: "Mill", type: "Drill" },
  "center drill": { kind: "Mill", type: "Drill" },
  "spot drill": { kind: "Mill", type: "Drill" },
  "thread mill": { kind: "Mill", type: "Taps" },
  "engraving tool": { kind: "Mill", type: "Engraving" },
  "circle mill (helical bore mill)": { kind: "Mill", type: "Mill" },
  "circle mill": { kind: "Mill", type: "Mill" },
};

function normalizeImportType(text) {
  return String(text || "").trim().toLowerCase();
}

function normalizeHeader(text) {
  return String(text || "").trim().toLowerCase();
}

// ── Mill-turn format ─────────────────────────────────────────────────────────
// A mill-turn setup sheet has a "#" column (tool numbers as T#), a tool type /
// description column to the right of it, then a Dia. column and a Rad. column.
// All imported tools are added as Mill tools. The tool_type is derived by
// scanning the descriptive name for words matching the mill tool type dropdown
// choices (Mill, Drill, Taps, Engraving).

const MILL_TYPE_KEYWORDS = [
  { type: "Drill", match: ["drill", "spot", "center drill", "spade"] },
  { type: "Taps", match: ["tap"] },
  { type: "Engraving", match: ["engrav"] },
  { type: "Mill", match: ["mill", "endmill", "face", "chamfer", "ball", "square", "radius", "roughing", "corncob", "lollipop", "t-slot", "tslot", "slitting", "form"] },
];

function matchMillType(nameText) {
  const lower = (nameText || "").toLowerCase();
  for (const { type, match } of MILL_TYPE_KEYWORDS) {
    if (match.some((w) => lower.includes(w))) return type;
  }
  return "Mill";
}

function isNumHeader(h) {
  return h === "#" || h === "t#" || h === "tool#" || h === "tool #" || h === "tool no" || h === "tool no." || h === "tool number";
}
function isDiaHeader(h) {
  return h === "dia" || h === "dia." || h === "diameter" || h === "d" || h.includes("diameter") || (h.includes("dia") && !h.includes("rad"));
}
function isRadHeader(h) {
  return h === "rad" || h === "rad." || h === "radius" || h.includes("corner rad") || h.includes("radius") || h.includes(" rad");
}
function isTypeNameHeader(h) {
  return h.includes("tool type") || h === "type" || h.includes("description") || h === "name" || h.includes("tool name") || h.includes("tool desc");
}

// Detect the mill-turn header: a "#" column together with a Dia. column.
function detectMillTurnHeader(rows) {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;
    let foundNum = -1;
    let foundDia = -1;
    let foundRad = -1;
    let foundType = -1;
    for (let c = 0; c < row.length; c++) {
      const h = normalizeHeader(row[c]);
      if (!h) continue;
      if (isNumHeader(h)) foundNum = c;
      else if (isRadHeader(h)) foundRad = c;
      else if (isDiaHeader(h)) foundDia = c;
      else if (isTypeNameHeader(h)) foundType = c;
    }
    if (foundNum >= 0 && foundDia >= 0) {
      // If no explicit type/description header, the column right after # is the tool type/name
      if (foundType < 0) foundType = foundNum + 1;
      return { headerIdx: i, numCol: foundNum, typeCol: foundType, diaCol: foundDia, radCol: foundRad };
    }
  }
  return null;
}

function parseMillTurnRows(rows, cols) {
  const { headerIdx, numCol, typeCol, diaCol, radCol } = cols;
  const tools = [];
  for (let j = headerIdx + 1; j < rows.length; j++) {
    const dataRow = rows[j];
    if (!dataRow) break;

    const numStr = dataRow[numCol] != null ? String(dataRow[numCol]).trim() : "";
    const nameText = typeCol >= 0 && dataRow[typeCol] != null ? String(dataRow[typeCol]).trim() : "";
    const diaText = diaCol >= 0 && dataRow[diaCol] != null ? String(dataRow[diaCol]).trim() : "";
    const radText = radCol >= 0 && dataRow[radCol] != null ? String(dataRow[radCol]).trim() : "";

    // Empty row — end of section
    if (!numStr && !nameText && !diaText && !radText) break;

    // Extract number from T# format (e.g., "T1212" → "1212")
    let toolNumber = numStr;
    if (toolNumber.toUpperCase().startsWith("T")) {
      toolNumber = toolNumber.substring(1);
    }

    tools.push({
      _id: Date.now() + Math.random() + j,
      tool_kind: "Mill",
      tool_type: matchMillType(nameText),
      tool_number: toolNumber,
      name: nameText,
      dia: diaText,
      rad: radText || "",
    });
  }
  return tools;
}

export function parseTurningToolExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const XLSX = window.XLSX;
        if (!XLSX) { reject(new Error("SheetJS not loaded")); return; }
        const wb = XLSX.read(e.target.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];

        // Unmerge cells: propagate values downward within the same column
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

        // ── Mill-turn format: "#" + Dia. columns present ──
        const millTurnCols = detectMillTurnHeader(rows);
        if (millTurnCols) {
          const tools = parseMillTurnRows(rows, millTurnCols);
          resolve(tools);
          return;
        }

        // ── Standard turning format ──
        // Find header row with "#" and "Tool Type" (or "Type")
        let headerIdx = -1;
        let numCol = -1;
        let typeCol = -1;
        let nameCol = -1;
        let insertCol = -1;

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          if (!row) continue;
          let foundNum = -1;
          let foundType = -1;
          let foundName = -1;
          let foundInsert = -1;
          for (let c = 0; c < row.length; c++) {
            const h = normalizeHeader(row[c]);
            if (h === "#" || h === "t#" || h === "tool#" || h === "tool #" || h === "tool no" || h === "tool no.") {
              foundNum = c;
            } else if (h.includes("tool type") || h === "type") {
              foundType = c;
            } else if (h.includes("tool name") || h === "name") {
              foundName = c;
            } else if (h === "insert" || h.includes("insert")) {
              foundInsert = c;
            }
          }
          if (foundNum >= 0 && foundType >= 0) {
            headerIdx = i;
            numCol = foundNum;
            typeCol = foundType;
            nameCol = foundName;
            insertCol = foundInsert;
            break;
          }
        }

        if (headerIdx < 0) {
          reject(new Error("Could not find tool list header (# and Tool Type columns)"));
          return;
        }

        // If name/insert columns not found by header, use columns to the right of type
        if (nameCol < 0) nameCol = typeCol + 1;
        if (insertCol < 0) insertCol = nameCol + 1;

        const tools = [];
        let lastMapped = { kind: "Turn", type: "" };

        for (let j = headerIdx + 1; j < rows.length; j++) {
          const dataRow = rows[j];
          if (!dataRow) break;

          const numVal = dataRow[numCol];
          const numStr = numVal != null ? String(numVal).trim() : "";

          const typeText = typeCol >= 0 && dataRow[typeCol] != null ? String(dataRow[typeCol]).trim() : "";
          const nameText = nameCol >= 0 && dataRow[nameCol] != null ? String(dataRow[nameCol]).trim() : "";
          const insertText = insertCol >= 0 && dataRow[insertCol] != null ? String(dataRow[insertCol]).trim() : "";

          // Empty row — end of section
          if (!numStr && !typeText && !nameText && !insertText) break;

          // Extract number from T# format (e.g., "T1212" → "1212")
          let toolNumber = numStr;
          if (toolNumber.toUpperCase().startsWith("T")) {
            toolNumber = toolNumber.substring(1);
          }

          // Map type — if empty (merged from above), use last mapped
          let mapped;
          if (typeText) {
            mapped = EXCEL_TYPE_MAP[normalizeImportType(typeText)] || { kind: "Turn", type: "" };
            lastMapped = mapped;
          } else {
            mapped = lastMapped;
          }

          tools.push({
            _id: Date.now() + Math.random() + j,
            tool_kind: mapped.kind,
            tool_type: mapped.type,
            tool_number: toolNumber,
            name: nameText,
            insert: insertText,
          });
        }

        resolve(tools);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}