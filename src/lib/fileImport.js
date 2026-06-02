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
  // Labels ordered as they actually appear in the document top-to-bottom.
  // The boundary stop regex uses this order — a label's value stops when the
  // NEXT label in this list is encountered, so order matters.
  const labels = [
    { key: "machine",               pattern: "MACHINE" },
    { key: "job_number",            pattern: "JOB #" },
    { key: "customer",              pattern: "CUSTOMER" },
    { key: "programmer",            pattern: "PROGRAMMER" },
    { key: "quantity",              pattern: "QTY" },
    { key: "date",                  pattern: "DATE" },
    { key: "material",              pattern: "MATERIAL" },
    { key: "operation_description", pattern: "OPERATION" },
    { key: "program",               pattern: "PROGRAM" },
    { key: "part_number",           pattern: "PART #" },
    { key: "revision",              pattern: "REV" },
    { key: "units",                 pattern: "UNITS" },
    { key: "total_cycle_time",      pattern: "TOTAL CYCLE TIME" },
  ];

  // Escape each pattern for use in a regex alternation
  const escapedPatterns = labels.map((l) =>
    l.pattern.replace(/[.*+?^${}()|[\]\\#]/g, "\\$&")
  );
  // Boundary: lookahead for any known label followed by optional colon
  const boundaryAlt = escapedPatterns.join("|");

  const result = {};

  for (let i = 0; i < labels.length; i++) {
    const { key, pattern } = labels[i];
    const escaped = escapedPatterns[i];

    // Match: <LABEL> followed by optional colon/spaces, then capture until
    // the next known label+colon boundary or end-of-string.
    const re = new RegExp(
      escaped + "\\s*:?\\s*(.*?)(?=\\s*(?:" + boundaryAlt + ")\\s*:?\\s|$)",
      "is"
    );
    const m = text.match(re);
    if (m) {
      const val = m[1].trim().replace(/\s+/g, " ");
      // Reject if the captured value looks like it bled into a section header
      if (val && !/^(GENERAL INFORMATION|OPERATION LIST|TOOL LIST|IMAGE)/i.test(val)) {
        result[key] = val;
      }
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

  // ── OPERATION LIST ─────────────────────────────────────────────────────────
  // PDF columns: OP #  OPERATION NAME  COMMENT  TOOL #  MIN-Z  CYCLE TIME
  // Each data row starts with an integer OP number.
  // Operation name may contain spaces; TOOL # is a bare integer; MIN-Z is a
  // signed decimal; CYCLE TIME is HH:MM:SS.
  const operations = [];
  const opsSectionMatch = fullText.match(/OPERATION\s*LIST([\s\S]*?)(?:TOOL\s*LIST|$)/i);
  if (opsSectionMatch) {
    // Skip the header row (OP # OPERATION NAME COMMENT TOOL # MIN-Z CYCLE TIME)
    const lines = opsSectionMatch[1]
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !/^OP\s*#/i.test(l));

    for (const line of lines) {
      // Row pattern: <op_num>  <op_name (may contain spaces)>  <comment>  <tool#>  <min_z>  <HH:MM:SS>
      // CYCLE TIME is always HH:MM:SS at the end — anchor on that.
      const m = line.match(
        /^(\d+)\s+(.*?)\s{2,}(.*?)\s{2,}(\d+)\s+([-\d.]+)\s+(\d{2}:\d{2}:\d{2})/
      );
      if (m) {
        operations.push({
          op_number:      m[1].trim(),
          operation_name: m[2].trim(),
          comment:        m[3].trim(),
          tool_number:    m[4].trim(),
          min_z:          m[5].trim(),
          max_z:          "",
          cycle_time:     m[6].trim(),
          spindle_rpm:    "",
        });
        continue;
      }
      // Fallback: split on 2+ spaces
      const fb = line.match(/^(\d+)\s+(.+)/);
      if (fb) {
        const parts = fb[2].split(/\s{2,}/);
        operations.push({
          op_number:      fb[1],
          operation_name: parts[0] || "",
          comment:        parts[1] || "",
          tool_number:    parts[2] || "",
          min_z:          parts[3] || "",
          max_z:          "",
          cycle_time:     parts[4] || "",
          spindle_rpm:    "",
        });
      }
    }
  }

  // ── TOOL LIST ───────────────────────────────────────────────────────────────
  // PDF columns: Tool #  Description  Tool Dia  Cm Rad  Offset Length  Holder
  // Header row may include "FILTERED:" — skip it.
  const tools = [];
  const toolSectionMatch = fullText.match(/TOOL\s*LIST([\s\S]*?)$/i);
  if (toolSectionMatch) {
    const lines = toolSectionMatch[1]
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !/^Tool\s*#/i.test(l) && !/^FILTERED/i.test(l));

    for (const line of lines) {
      const m = line.match(/^(\d+)\s+(.+)/);
      if (!m) continue;
      const parts = m[2].split(/\s{2,}/);
      // parts[0]=Description, [1]=Tool Dia, [2]=Cm Rad, [3]=Offset Length, [4]=Holder
      tools.push({
        tool_number:   m[1].trim(),
        description:   parts[0] || "",
        diameter:      parts[1] || "",
        flutes:        "",
        length:        parts[3] || "",   // Offset Length → Length
        corner_radius: parts[2] || "",   // Cm Rad → Corner Radius
        holder:        parts[4] || "",
      });
    }
  }

  // ── PART ZERO ───────────────────────────────────────────────────────────────
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

  return { general, tools, partZero, operations };
}