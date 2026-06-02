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

export async function parsePDF(file) {
  const pdfjsLib = window.pdfjsLib;
  if (!pdfjsLib) throw new Error("PDF.js not loaded");
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  // Collect all items with position from all pages
  const allItems = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    for (const item of content.items) {
      if (item.str.trim() === '') continue;
      allItems.push({
        str: item.str.trim(),
        x: Math.round(item.transform[4]),
        y: Math.round(item.transform[5]),
        page: p,
      });
    }
  }

  // Group items into rows by matching Y values (within 3px tolerance)
  function groupByY(items) {
    const rows = [];
    for (const item of items) {
      const existing = rows.find(r => Math.abs(r.y - item.y) <= 3);
      if (existing) {
        existing.items.push(item);
      } else {
        rows.push({ y: item.y, page: item.page, items: [item] });
      }
    }
    // Sort each row's items left to right by X
    for (const row of rows) {
      row.items.sort((a, b) => a.x - b.x);
      row.text = row.items.map(i => i.str).join(' ');
    }
    return rows;
  }

  const page1Items = allItems.filter(i => i.page === 1);
  const page2Items = allItems.filter(i => i.page === 2);
  const rows1 = groupByY(page1Items);
  const rows2 = groupByY(page2Items);

  // --- GENERAL INFORMATION (page 1) ---
  // Labels are at x~77, values are at x~181
  // Find value at x~181 on the same Y as a label at x~77

  function findValue(rows, labelText) {
    for (const row of rows) {
      const label = row.items.find(i => i.x < 160 && i.str.toUpperCase().includes(labelText.toUpperCase()));
      if (label) {
        const value = row.items.find(i => i.x >= 160);
        if (value) return value.str.trim();
      }
    }
    return null;
  }

  const sheet = {
    job_number:            findValue(rows1, 'JOB #'),
    customer:              findValue(rows1, 'CUSTOMER'),
    programmer:            findValue(rows1, 'PROGRAMMER'),
    part_number:           findValue(rows1, 'PART #'),
    revision:              findValue(rows1, 'REV:'),
    date:                  findValue(rows1, 'DATE'),
    quantity:              findValue(rows1, 'QTY'),
    material:              findValue(rows1, 'MATERIAL'),
    operation_description: findValue(rows1, 'OPERATION'),
    program:               findValue(rows1, 'PROGRAM'),
    machine:               findValue(rows1, 'MACHINE'),
    units:                 'Inch',
    total_cycle_time:      null,
  };

  // Cycle time row
  const ctRow = rows1.find(r => r.text.includes('TOTAL CYCLE TIME'));
  if (ctRow) {
    const ctMatch = ctRow.text.match(/(\d+)\s*HOURS?,\s*(\d+)\s*MINUTES?,\s*(\d+)\s*SECONDS?/i);
    if (ctMatch) {
      sheet.total_cycle_time =
        String(ctMatch[1]).padStart(2,'0') + ':' +
        String(ctMatch[2]).padStart(2,'0') + ':' +
        String(ctMatch[3]).padStart(2,'0');
    }
  }

  // --- TOOL LIST (page 2) ---
  // Tool rows: Tool # at x~78, Description at x~109, Diameter at x~271, Holder at x~448
  // Find the TOOL LIST header row first, then read rows below it

  const tools = [];
  const toolHeaderIdx = page2Items.findIndex(i => i.str === 'TOOL LIST');
  if (toolHeaderIdx >= 0) {
    const toolHeaderY = page2Items[toolHeaderIdx].y;
    // Get all rows below the tool header (lower Y value in PDF coords = lower on page)
    const toolRows = groupByY(page2Items.filter(i => i.y < toolHeaderY - 5));
    // Filter to rows that have an item at x~78 that is a number (tool number)
    for (const row of toolRows) {
      const toolNumItem = row.items.find(i => i.x < 95 && /^\d+$/.test(i.str));
      if (!toolNumItem) continue;
      const desc    = row.items.find(i => i.x >= 100 && i.x < 265);
      const dia     = row.items.find(i => i.x >= 265 && i.x < 320);
      const holder  = row.items.find(i => i.x >= 440);
      tools.push({
        tool_number:   parseInt(toolNumItem.str),
        description:   desc ? desc.str : null,
        diameter:      dia ? parseFloat(dia.str) : null,
        flutes:        null,
        length:        null,
        corner_radius: null,
        holder:        holder ? holder.str : null,
      });
    }
  }

  // --- OPERATIONS (page 1 bottom + page 2) ---
  // Op rows: OP# at x~78, Operation Name at x~116, Comment at x~211, Tool# at x~334, Min-Z at x~375, Cycle Time at x~423
  // Operations are on page 1 (last op) and page 2

  const operations = [];

  function parseOpRows(rows) {
    for (const row of rows) {
      const opNumItem = row.items.find(i => i.x < 95 && /^\d+$/.test(i.str));
      if (!opNumItem) continue;
      const opName   = row.items.find(i => i.x >= 110 && i.x < 210);
      const comment  = row.items.find(i => i.x >= 210 && i.x < 330);
      const toolNum  = row.items.find(i => i.x >= 330 && i.x < 375);
      const minZ     = row.items.find(i => i.x >= 375 && i.x < 420);
      const cycleT   = row.items.find(i => i.x >= 420);
      operations.push({
        op_number:      parseInt(opNumItem.str),
        operation_name: opName ? opName.str : null,
        comment:        comment ? comment.str : null,
        tool_number:    toolNum ? parseInt(toolNum.str) : null,
        min_z:          minZ ? parseFloat(minZ.str) : null,
        max_z:          1.0,
        cycle_time:     cycleT ? cycleT.str : null,
        spindle_rpm:    null,
      });
    }
  }

  // Page 1: op rows are below the OPERATION LIST header (y < ~144)
  const opRows1 = groupByY(page1Items.filter(i => i.y < 130));
  parseOpRows(opRows1);

  // Page 2: op rows are above the TOOL LIST header
  const toolListItem = page2Items.find(i => i.str === 'TOOL LIST');
  const toolListY = toolListItem ? toolListItem.y : 0;
  const opRows2 = groupByY(page2Items.filter(i => i.y > toolListY + 5));
  parseOpRows(opRows2);

  return { general: sheet, tools, partZero: {}, operations };
}

export async function extractPDFImage(file) {
  try {
    const pdfjsLib = window.pdfjsLib;
    if (!pdfjsLib) return null;
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;

    // Crop the middle section where the 3D model image lives
    const cropY = Math.floor(canvas.height * 0.25);
    const cropH = Math.floor(canvas.height * 0.55);
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = canvas.width;
    cropCanvas.height = cropH;
    const cropCtx = cropCanvas.getContext('2d');
    cropCtx.drawImage(canvas, 0, cropY, canvas.width, cropH, 0, 0, canvas.width, cropH);
    return cropCanvas.toDataURL('image/png');
  } catch (e) {
    console.error('PDF image extraction failed:', e);
    return null;
  }
}

export async function extractExcelImage(file) {
  try {
    const XLSX = window.XLSX;
    if (!XLSX) return null;
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const zip = workbook.zip;
    if (!zip) return null;

    const mediaFiles = Object.keys(zip.files).filter(f =>
      f.startsWith('xl/media/') && /\.(png|jpg|jpeg|gif|bmp)$/i.test(f)
    );
    if (mediaFiles.length === 0) return null;

    const imgFile = zip.files[mediaFiles[0]];
    const imgData = await imgFile.async('base64');
    const ext = mediaFiles[0].split('.').pop().toLowerCase();
    const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
    return `data:${mimeType};base64,${imgData}`;
  } catch (e) {
    // silently skip
  }
  return null;
}