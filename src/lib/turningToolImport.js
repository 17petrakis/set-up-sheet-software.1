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