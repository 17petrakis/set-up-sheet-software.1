import React, { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Printer, Upload, FileSpreadsheet, Bug, ArrowLeft, Eye } from "lucide-react";
import { motion } from "framer-motion";

import GeneralInfo from "@/components/setup-sheet/GeneralInfo";
import ToolList from "@/components/setup-sheet/ToolList";
import PartZero from "@/components/setup-sheet/PartZero";
import OperationsList from "@/components/setup-sheet/OperationsList";
import ImportBanner from "@/components/setup-sheet/ImportBanner";
import DebugPDFModal from "@/components/setup-sheet/DebugPDFModal";
import PhotoSection from "@/components/setup-sheet/PhotoSection";
import OperationNotes from "@/components/setup-sheet/OperationNotes";

import { emptyGeneral, emptyPartZero, emptyTool, emptyOperation } from "@/lib/setupSheetDefaults";
import { parseExcel, parsePDF, extractPDFImage, extractExcelImage } from "@/lib/fileImport";

export default function SetupSheet() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [general, setGeneral] = useState({ ...emptyGeneral });
  const [tools, setTools] = useState([{ ...emptyTool }]);
  const [partZero, setPartZero] = useState({ ...emptyPartZero });
  const [operations, setOperations] = useState([{ ...emptyOperation }]);
  const [photos, setPhotos] = useState({});
  const [importError, setImportError] = useState(null);
  const [importing, setImporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // "saved" | null
  const [debugText, setDebugText] = useState(null);
  const [loading, setLoading] = useState(!!id);
  const fileInputRef = useRef(null);
  const debugFileInputRef = useRef(null);
  const saveTimer = useRef(null);

  // Load existing sheet
  useEffect(() => {
    if (!id) return;
    (async () => {
      const sheet = await base44.entities.SetupSheet.get(id);
      const { tools: t, part_zero: pz, operations: ops, photos: ph, ...gen } = sheet;
      setGeneral({ ...emptyGeneral, ...gen });
      setTools(t?.length ? t : [{ ...emptyTool }]);
      setPartZero(pz && Object.keys(pz).length ? { ...emptyPartZero, ...pz } : { ...emptyPartZero });
      setOperations(ops?.length ? ops : [{ ...emptyOperation }]);
      setPhotos(ph || {});
      setLoading(false);
    })();
  }, [id]);

  // Auto-save debounce
  const triggerSave = useCallback((gen, t, pz, ops, ph) => {
    if (!id) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      await base44.entities.SetupSheet.update(id, {
        ...gen,
        tools: t,
        part_zero: pz,
        operations: ops,
        photos: ph,
      });
      setSaving(false);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(null), 2000);
    }, 800);
  }, [id]);

  const handleGeneralChange = (val) => { setGeneral(val); triggerSave(val, tools, partZero, operations, photos); };
  const handleToolsChange = (val) => { setTools(val); triggerSave(general, val, partZero, operations, photos); };
  const handlePartZeroChange = (val) => { setPartZero(val); triggerSave(general, tools, val, operations, photos); };
  const handleOperationsChange = (val) => { setOperations(val); triggerSave(general, tools, partZero, val, photos); };
  const handlePhotosChange = (val) => { setPhotos(val); triggerSave(general, tools, partZero, operations, val); };

  const handleDebugPDF = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const pdfjsLib = window.pdfjsLib;
      if (!pdfjsLib) throw new Error("PDF.js not loaded");
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const lines = [];
      for (let p = 1; p <= pdf.numPages; p++) {
        lines.push(`\n─── PAGE ${p} ───\n`);
        const page = await pdf.getPage(p);
        const content = await page.getTextContent();
        content.items.forEach((item, idx) => {
          const x = item.transform ? item.transform[4].toFixed(2) : "?";
          const y = item.transform ? item.transform[5].toFixed(2) : "?";
          lines.push(`[${idx}] "${item.str}" (x: ${x}, y: ${y})`);
        });
      }
      setDebugText(lines.join("\n"));
    } catch (err) {
      setDebugText(`ERROR: ${err.message}`);
    } finally {
      if (debugFileInputRef.current) debugFileInputRef.current.value = "";
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportError(null);
    try {
      let result;
      let isoImage = null;
      const ext = file.name.split(".").pop().toLowerCase();
      if (ext === "xlsx" || ext === "xls") {
        [result, isoImage] = await Promise.all([parseExcel(file), extractExcelImage(file)]);
      } else if (ext === "pdf") {
        [result, isoImage] = await Promise.all([parsePDF(file), extractPDFImage(file)]);
      } else throw new Error("Unsupported file type. Please use .xlsx or .pdf files.");

      const newGen = result.general && Object.keys(result.general).length
        ? { ...general, ...result.general } : general;
      const newTools = result.tools?.length ? result.tools : tools;
      const newPZ = result.partZero && Object.keys(result.partZero).length
        ? { ...partZero, ...result.partZero } : partZero;
      const newOps = result.operations?.length ? result.operations : operations;
      console.log('Extracted image:', isoImage ? 'YES - length ' + isoImage.length : 'NULL');

      // Convert base64 data URL to a hosted file URL before saving
      let isoUrl = null;
      if (isoImage) {
        const blob = await (await fetch(isoImage)).blob();
        const uploadResult = await base44.integrations.Core.UploadFile({ file: new File([blob], 'iso.png', { type: 'image/png' }) });
        isoUrl = uploadResult.file_url;
      }

      const newPhotos = isoUrl ? { ...photos, iso: isoUrl } : photos;

      setGeneral(newGen);
      setTools(newTools);
      setPartZero(newPZ);
      setOperations(newOps);
      if (isoUrl) setPhotos(newPhotos);
      triggerSave(newGen, newTools, newPZ, newOps, newPhotos);
    } catch (err) {
      setImportError("Could not read file — please fill in manually");
      console.error("Import error:", err);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleReset = () => {
    setGeneral({ ...emptyGeneral });
    setTools([{ ...emptyTool }]);
    setPartZero({ ...emptyPartZero });
    setOperations([{ ...emptyOperation }]);
    setImportError(null);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 no-print">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8 mr-1" onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-foreground leading-none">
                {general.part_number || "CNC Setup Sheet"}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {saveStatus === "saved" ? "Saved ✓" : saving ? "Saving…" : general.customer || "Machine Shop Manager"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.pdf" onChange={handleImport} className="hidden" />
            <input ref={debugFileInputRef} type="file" accept=".pdf" onChange={handleDebugPDF} className="hidden" />
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={importing} className="h-8 text-xs gap-1.5">
              <Upload className="w-3.5 h-3.5" />
              {importing ? "Importing..." : "Import File"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => debugFileInputRef.current?.click()} className="h-8 text-xs gap-1.5 text-amber-600 border-amber-300 hover:bg-amber-50">
              <Bug className="w-3.5 h-3.5" />
              Debug PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate(`/sheet/${id}/print`)} className="h-8 text-xs gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              Print View
            </Button>
          </div>
        </div>
      </header>

      <DebugPDFModal text={debugText} onClose={() => setDebugText(null)} />

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 print-container space-y-5">
        {importError && (
          <ImportBanner message={importError} onClose={() => setImportError(null)} />
        )}

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <GeneralInfo data={general} onChange={handleGeneralChange} />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <motion.div className="lg:col-span-2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
            <ToolList tools={tools} onChange={handleToolsChange} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
            <PartZero data={partZero} onChange={handlePartZeroChange} />
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }}>
          <OperationsList operations={operations} onChange={handleOperationsChange} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.18 }}>
          <OperationNotes value={general.operation_notes} onChange={(val) => handleGeneralChange({ ...general, operation_notes: val })} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
          <PhotoSection photos={photos} onChange={handlePhotosChange} />
        </motion.div>
      </main>
    </div>
  );
}