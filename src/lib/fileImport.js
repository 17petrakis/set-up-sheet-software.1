function dayFractionToHMS(val) {
  if (!val || isNaN(val)) return "";
  const totalSeconds = Math.round(Number(val) * 86400);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function matchLabel(text, label) {
  if (!text || !label) return false;
  return String(text).trim().toLowerCase().replace(/[^a-z0-9]/g, "") ===
    label.toLowerCase().replace(/[^a-z0-9]/g, "");
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

        // Each entry: [normalizedLabelKey, fieldName]
        // Value is ONLY column 1 of that row — never concatenated with other columns.
        const labelMap = [
          ["machine",    "machine"],
          ["job#",       "job_number"],
          ["customer",   "customer"],
          ["programmer", "programmer"],
          ["part#",      "part_number"],
          ["rev",        "revision"],
          ["date",       "date"],
          ["qty",        "quantity"],
          ["material",   "material"],
          ["operation",  "operation_description"],
          ["program",    "program"],
          ["units",      "units"],
        ];

        let toolHeaderIdx = -1;
        let partZeroIdx = -1;
        let opsIdx = -1;

        rows.forEach((row, i) => {
          const cell0 = row[0] != null ? String(row[0]).trim() : "";
          const key = cell0.toLowerCase().replace(/[^a-z0-9]/g, "");

          // Match general fields — value is strictly column 1 only
          for (const [lbl, field] of labelMap) {
            if (key === lbl) {
              // column 1 only — do NOT read col 2 or beyond
              let val = row[1] != null ? String(row[1]).trim() : "";
              if (field === "date" && row[1] instanceof Date) {
                val = row[1].toISOString().split("T")[0];
              }
              general[field] = val;
            }
          }

          if (key.includes("totalcycletime") || (cell0.toLowerCase().includes("total") && cell0.toLowerCase().includes("cycle"))) {
            general.total_cycle_time = dayFractionToHMS(row[1]);
          }

          if (matchLabel(cell0, "Tool #") || matchLabel(cell0, "Tool#")) toolHeaderIdx = i;
          if (matchLabel(cell0, "PART ZERO")) partZeroIdx = i;
          if (cell0.toLowerCase().includes("operations:") || matchLabel(cell0, "OPERATIONS")) opsIdx = i;
        });

        // Parse tools
        const tools = [];
        if (toolHeaderIdx >= 0) {
          for (let i = toolHeaderIdx + 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || !row[0] || String(row[0]).trim() === "") break;
            tools.push({
              tool_number: row[0] != null ? String(row[0]).trim() : "",
              description: row[1] != null ? String(row[1]).trim() : "",
              diameter: row[2] != null ? String(row[2]).trim() : "",
              flutes: row[3] != null ? String(row[3]).trim() : "",
              length: row[4] != null ? String(row[4]).trim() : "",
              corner_radius: "",
              holder: "",
            });
          }
        }

        // Parse part zero
        const partZero = {};
        if (partZeroIdx >= 0) {
          const axes = ["x", "y", "z"];
          for (let offset = 2; offset <= 4; offset++) {
            const row = rows[partZeroIdx + offset];
            if (!row) continue;
            const axis = axes[offset - 2];
            if (axis) {
              partZero[`${axis}_max`] = row[1] != null ? String(row[1]).trim() : "";
              partZero[`${axis}_min`] = row[2] != null ? String(row[2]).trim() : "";
            }
          }
        }

        // Parse operations
        const operations = [];
        if (opsIdx >= 0) {
          const opsRow = rows[opsIdx];
          const commentRow = rows[opsIdx + 1];
          const rpmRow = rows.find((r, i) => i > opsIdx && r && String(r[0] || "").toLowerCase().includes("spindle"));
          const timeRow = rows.find((r, i) => i > opsIdx && r && String(r[0] || "").toLowerCase().includes("op time"));

          if (opsRow) {
            for (let c = 1; c < opsRow.length; c++) {
              const opVal = opsRow[c];
              if (opVal == null || String(opVal).trim() === "") continue;
              operations.push({
                op_number: String(c),
                operation_name: String(opVal).trim(),
                comment: commentRow && commentRow[c] != null ? String(commentRow[c]).trim() : "",
                tool_number: "",
                min_z: "",
                max_z: "",
                cycle_time: timeRow && timeRow[c] != null ? dayFractionToHMS(timeRow[c]) : "",
                spindle_rpm: rpmRow && rpmRow[c] != null ? String(rpmRow[c]).trim() : "",
              });
            }
          }
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

function extractPDFFields(text) {
  const labels = [
    { key: "job_number",            pattern: "JOB #" },
    { key: "customer",              pattern: "CUSTOMER" },
    { key: "programmer",            pattern: "PROGRAMMER" },
    { key: "part_number",           pattern: "PART #" },
    { key: "revision",              pattern: "REV" },
    { key: "date",                  pattern: "DATE" },
    { key: "quantity",              pattern: "QTY" },
    { key: "material",              pattern: "MATERIAL" },
    { key: "operation_description", pattern: "OPERATION" },
    { key: "program",               pattern: "PROGRAM" },
    { key: "machine",               pattern: "Machine" },
    { key: "total_cycle_time",      pattern: "TOTAL CYCLE TIME" },
  ];

  // Build boundary alternation from all label patterns
  const allPatterns = labels.map((l) => l.pattern.replace(/[#]/g, "\\#")).join("|");

  const result = {};

  for (const { key, pattern } of labels) {
    const escaped = pattern.replace(/[.*+?^${}()|[\]\\#]/g, "\\$&");
    // Capture everything after "LABEL:" up to where the next known label begins
    const re = new RegExp(
      escaped + "\\s*:?\\s*(.*?)(?=\\s*(?:" + allPatterns + ")\\s*:|$)",
      "is"
    );
    const m = text.match(re);
    if (m) {
      result[key] = m[1].trim().replace(/\s+/g, " ");
    }
  }

  // Convert "0 HOURS, 5 MINUTES, 12 SECONDS" → "HH:MM:SS"
  if (result.total_cycle_time) {
    const hm = result.total_cycle_time.match(
      /(\d+)\s*HOURS?,\s*(\d+)\s*MINUTES?,\s*(\d+)\s*SECONDS?/i
    );
    if (hm) {
      result.total_cycle_time =
        String(hm[1]).padStart(2, "0") + ":" +
        String(hm[2]).padStart(2, "0") + ":" +
        String(hm[3]).padStart(2, "0");
    }
  }

  // Machine may appear before "GENERAL INFORMATION" as "Machine: <name>"
  const machineMatch = text.match(/Machine:\s*([^\n]+)/i);
  if (machineMatch) result.machine = machineMatch[1].trim();

  return result;
}

export async function parsePDF(file) {
  const pdfjsLib = window.pdfjsLib;
  if (!pdfjsLib) throw new Error("PDF.js not loaded");
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    fullText += content.items.map((item) => item.str).join(" ") + "\n";
  }

  const general = extractPDFFields(fullText);

  // Tool list
  const tools = [];
  const toolSection = fullText.match(/TOOL\s*LIST([\s\S]*?)(?:OPERATION|PART\s*ZERO|$)/i);
  if (toolSection) {
    const lines = toolSection[1].split("\n").filter((l) => l.trim());
    for (const line of lines) {
      const m = line.match(/^\s*(\d+)\s+(.+)/);
      if (m) {
        const parts = m[2].trim().split(/\s{2,}/);
        tools.push({
          tool_number: m[1],
          description: parts[0] || "",
          diameter: parts[1] || "",
          flutes: parts[2] || "",
          length: parts[3] || "",
          corner_radius: "",
          holder: "",
        });
      }
    }
  }

  // Part zero
  const partZero = {};
  const pzSection = fullText.match(/PART\s*ZERO([\s\S]*?)(?:OPERATION|TOOL|$)/i);
  if (pzSection) {
    const xMatch = pzSection[1].match(/X\s*[:\s]*([+-]?[\d.]+)\s+([+-]?[\d.]+)/i);
    const yMatch = pzSection[1].match(/Y\s*[:\s]*([+-]?[\d.]+)\s+([+-]?[\d.]+)/i);
    const zMatch = pzSection[1].match(/Z\s*[:\s]*([+-]?[\d.]+)\s+([+-]?[\d.]+)/i);
    if (xMatch) { partZero.x_max = xMatch[1]; partZero.x_min = xMatch[2]; }
    if (yMatch) { partZero.y_max = yMatch[1]; partZero.y_min = yMatch[2]; }
    if (zMatch) { partZero.z_max = zMatch[1]; partZero.z_min = zMatch[2]; }
  }

  // Operations
  const operations = [];
  const opsSection = fullText.match(/OPERATION\s*LIST([\s\S]*?)$/i);
  if (opsSection) {
    const lines = opsSection[1].split("\n").filter((l) => l.trim());
    for (const line of lines) {
      const m = line.match(/^\s*(\d+)\s+(.+)/);
      if (m) {
        const parts = m[2].trim().split(/\s{2,}/);
        operations.push({
          op_number: m[1],
          operation_name: parts[0] || "",
          comment: parts[1] || "",
          tool_number: parts[2] || "",
          min_z: parts[3] || "",
          max_z: parts[4] || "",
          cycle_time: parts[5] || "",
          spindle_rpm: "",
        });
      }
    }
  }

  return { general, tools, partZero, operations };
}