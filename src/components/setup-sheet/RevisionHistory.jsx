import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { History, X, User, Clock, ChevronDown, ChevronRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function RevisionRow({ revision, onRestore }) {
  const [expanded, setExpanded] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState(false);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(p => !p)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
      >
        {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1">
              <Clock className="w-3 h-3 text-muted-foreground" />
              {format(new Date(revision.created_date), "MMM d, yyyy  h:mm a")}
            </span>
            {revision.saved_by && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <User className="w-3 h-3" /> {revision.saved_by}
              </span>
            )}
          </div>
          {revision.note && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{revision.note}</p>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setConfirmRestore(true); }}
          className="shrink-0 flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <RotateCcw className="w-3 h-3" /> Restore
        </button>
      </button>

      {expanded && revision.snapshot && (
        <div className="px-4 pb-3 bg-muted/30 border-t border-border">
          <pre className="text-[10px] text-muted-foreground whitespace-pre-wrap max-h-48 overflow-auto mt-2 font-mono">
            {JSON.stringify(revision.snapshot, null, 2)}
          </pre>
        </div>
      )}

      <AlertDialog open={confirmRestore} onOpenChange={setConfirmRestore}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore this revision?</AlertDialogTitle>
            <AlertDialogDescription>
              This will overwrite the current sheet data with the snapshot from{" "}
              <strong>{format(new Date(revision.created_date), "MMM d, yyyy h:mm a")}</strong>.
              The current state will be saved as a new revision first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setConfirmRestore(false); onRestore(revision); }}>
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function RevisionHistory({ sheetId, open, onClose, onRestore }) {
  const [revisions, setRevisions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !sheetId) return;
    setLoading(true);
    base44.entities.SheetRevision.filter({ sheet_id: sheetId }, "-created_date", 50)
      .then(data => { setRevisions(data); setLoading(false); });
  }, [open, sheetId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/30" onClick={onClose} />
      {/* Panel */}
      <div className="w-[420px] bg-background border-l border-border flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-foreground">Revision History</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
            </div>
          ) : revisions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <History className="w-8 h-8 mx-auto mb-2 opacity-30" />
              No revisions saved yet. Revisions are created each time you manually save.
            </div>
          ) : (
            revisions.map(rev => (
              <RevisionRow key={rev.id} revision={rev} onRestore={onRestore} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}