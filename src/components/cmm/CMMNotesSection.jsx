import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Plus, X, FileText } from "lucide-react";

export default function CMMNotesSection({ importantNotes = [], programNotes = "", onChangeImportant, onChangeProgramNotes }) {
  const [newNote, setNewNote] = useState("");

  const addNote = () => {
    if (!newNote.trim()) return;
    onChangeImportant([...importantNotes, { _id: Date.now(), text: newNote.trim() }]);
    setNewNote("");
  };

  const removeNote = (idx) => {
    onChangeImportant(importantNotes.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-5">
      {/* Important Notes */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="text-sm font-bold text-foreground uppercase tracking-widest flex items-center gap-2 mb-1">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          Important Notes
        </h2>
        <div className="border-b border-border mb-4" />

        {importantNotes.length > 0 && (
          <div className="flex flex-col gap-1.5 mb-3">
            {importantNotes.map((note, idx) => (
              <div key={note._id || idx} className="relative group flex items-start gap-2 border-l-4 border-amber-400 bg-amber-50/60 pl-3 pr-8 py-2 rounded-r-md">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wide shrink-0 mt-0.5">IMPORTANT</span>
                <span className="text-sm text-foreground">{note.text}</span>
                <button
                  onClick={() => removeNote(idx)}
                  className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-amber-200 text-muted-foreground hover:text-destructive transition-all"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Input
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addNote()}
            placeholder="Add an important note..."
            className="h-9 text-sm flex-1"
          />
          <Button size="sm" onClick={addNote} disabled={!newNote.trim()} className="h-9 text-xs gap-1 shrink-0">
            <Plus className="w-3.5 h-3.5" /> Add
          </Button>
        </div>
      </div>

      {/* Program Running Notes */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="text-sm font-bold text-foreground uppercase tracking-widest flex items-center gap-2 mb-1">
          <FileText className="w-4 h-4 text-primary" />
          Program Running Notes
        </h2>
        <div className="border-b border-border mb-4" />
        <Textarea
          value={programNotes}
          onChange={e => onChangeProgramNotes(e.target.value)}
          placeholder="Add notes about running the CMM program..."
          className="min-h-[120px] text-sm resize-none"
        />
      </div>
    </div>
  );
}