import React from "react";
import { X, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DebugPDFModal({ text, onClose }) {
  if (!text) return null;

  const handleCopy = () => navigator.clipboard.writeText(text);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-foreground">PDF Debug Output</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Raw text items extracted by PDF.js — use this to fix the parser</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleCopy} className="h-7 text-xs gap-1.5">
              <Copy className="w-3 h-3" /> Copy
            </Button>
            <Button size="icon" variant="ghost" onClick={onClose} className="h-7 w-7">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        {/* Body */}
        <pre className="overflow-auto flex-1 p-4 text-xs font-mono text-foreground whitespace-pre leading-5">
          {text}
        </pre>
      </div>
    </div>
  );
}