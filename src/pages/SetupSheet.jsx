import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Printer, Upload, FileSpreadsheet, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";

import GeneralInfo from "@/components/setup-sheet/GeneralInfo";
import ToolList from "@/components/setup-sheet/ToolList";
import PartZero from "@/components/setup-sheet/PartZero";
import OperationsList from "@/components/setup-sheet/OperationsList";
import ImportBanner from "@/components/setup-sheet/ImportBanner";

import { emptyGeneral, emptyPartZero, emptyTool, emptyOperation } from "@/lib/setupSheetDefaults";
import { parseExcel, parsePDF } from "@/lib/fileImport";

export default function SetupSheet() {
  const [general, setGeneral] = useState({ ...emptyGeneral });
  const [tools, setTools] = useState([{ ...emptyTool }]);
  const [partZero, setPartZero] = useState({ ...emptyPartZero });
  const [operations, setOperations] = useState([{ ...emptyOperation }]);
  const [importError, setImportError] = useState(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportError(null);

    try {
      let result;
      const ext = file.name.split(".").pop().toLowerCase();

      if (ext === "xlsx" || ext === "xls") {
        result = await parseExcel(file);
      } else if (ext === "pdf") {
        result = await parsePDF(file);
      } else {
        throw new Error("Unsupported file type. Please use .xlsx or .pdf files.");
      }

      if (result.general && Object.keys(result.general).length > 0) {
        setGeneral((prev) => ({ ...prev, ...result.general }));
      }
      if (result.tools && result.tools.length > 0) {
        setTools(result.tools);
      }
      if (result.partZero && Object.keys(result.partZero).length > 0) {
        setPartZero((prev) => ({ ...prev, ...result.partZero }));
      }
      if (result.operations && result.operations.length > 0) {
        setOperations(result.operations);
      }
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

  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 no-print">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-foreground leading-none">
                CNC Setup Sheet
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">Machine Shop Manager</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.pdf"
              onChange={handleImport}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="h-8 text-xs gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              {importing ? "Importing..." : "Import File"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="h-8 text-xs gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </Button>
            <Button
              size="sm"
              onClick={handlePrint}
              className="h-8 text-xs gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 print-container space-y-5">
        {importError && (
          <ImportBanner message={importError} onClose={() => setImportError(null)} />
        )}

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <GeneralInfo data={general} onChange={setGeneral} />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
          >
            <ToolList tools={tools} onChange={setTools} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <PartZero data={partZero} onChange={setPartZero} />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <OperationsList operations={operations} onChange={setOperations} />
        </motion.div>
      </main>
    </div>
  );
}