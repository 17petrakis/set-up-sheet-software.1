import React, { useEffect, useRef, useState } from "react";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Check, Save } from "lucide-react";

/**
 * Confirmation shown when someone tries to leave a setup sheet while editing.
 * Confirming saves the sheet with a progress bar, announces that it is saved,
 * then closes the popup and completes the navigation.
 */
export default function LeaveSheetDialog({ open, onStay, onSave, onLeave }) {
  const [phase, setPhase] = useState("ask"); // ask | saving | saved | error
  const [progress, setProgress] = useState(0);
  const closeTimer = useRef(null);

  useEffect(() => {
    if (open) {
      setPhase("ask");
      setProgress(0);
    }
    return () => clearTimeout(closeTimer.current);
  }, [open]);

  // Creep the bar forward while the save is running; it completes when the save resolves.
  useEffect(() => {
    if (phase !== "saving") return;
    const startedAt = Date.now();
    const tick = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      setProgress(Math.min(90, Math.round((elapsed / 1800) * 90)));
    }, 120);
    return () => clearInterval(tick);
  }, [phase]);

  const handleSaveAndLeave = async () => {
    setPhase("saving");
    setProgress(3);
    const saved = await onSave();
    setProgress(100);
    if (!saved) {
      setPhase("error");
      return;
    }
    setPhase("saved");
    closeTimer.current = setTimeout(() => onLeave(), 800);
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent
        className="!inset-0 !m-auto !h-fit !translate-x-0 !translate-y-0 !w-[calc(100%-2rem)] max-w-sm"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Leave this setup sheet?</AlertDialogTitle>
          <AlertDialogDescription>
            {phase === "ask" && "Your changes will be saved before you leave."}
            {phase === "saving" && "Saving your changes…"}
            {phase === "saved" && "Everything is saved."}
            {phase === "error" && "Your changes could not be saved. Stay on this page and try again."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {phase !== "ask" && (
          <div className="space-y-2">
            <Progress value={progress} className="h-3" />
            <div className="flex items-center gap-1.5 text-sm font-semibold">
              {phase === "saved" ? (
                <>
                  <Check className="w-4 h-4 text-primary" />
                  <span>Saved</span>
                </>
              ) : phase === "error" ? (
                <span className="text-destructive">Not saved</span>
              ) : (
                <span className="tabular-nums">Saving… {progress}%</span>
              )}
            </div>
          </div>
        )}

        <AlertDialogFooter>
          {phase === "ask" && (
            <>
              <Button variant="outline" className="min-h-11" onClick={onStay}>Stay</Button>
              <Button className="min-h-11 gap-2" onClick={handleSaveAndLeave}>
                <Save className="w-4 h-4" />
                Save &amp; Leave
              </Button>
            </>
          )}
          {phase === "error" && (
            <>
              <Button variant="outline" className="min-h-11" onClick={onStay}>Stay on page</Button>
              <Button className="min-h-11" onClick={handleSaveAndLeave}>Try Again</Button>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}