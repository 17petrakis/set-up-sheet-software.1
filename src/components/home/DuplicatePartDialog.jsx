import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ComboBox from "@/components/ui/ComboBox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";

export default function DuplicatePartDialog({ sourcePartNumber, sourceCustomer, customers, onClose, onDuplicate }) {
  const [partNumber, setPartNumber] = useState("");
  const [revision, setRevision] = useState("");
  const [customer, setCustomer] = useState(sourceCustomer || "");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { setCustomer(sourceCustomer || ""); }, [sourceCustomer]);

  const handleSubmit = async () => {
    if (!partNumber.trim()) return;
    setSubmitting(true);
    try {
      await onDuplicate({
        partNumber: partNumber.trim(),
        revision: revision.trim(),
        customer: customer.trim(),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Duplicate Part</DialogTitle>
          <DialogDescription>
            Create a copy of <strong>{sourcePartNumber}</strong>. Enter a new part number and revision, then confirm the client.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="dup-part-number">New Part Number</Label>
            <Input
              id="dup-part-number"
              value={partNumber}
              onChange={(e) => setPartNumber(e.target.value)}
              placeholder="Enter new part number"
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dup-revision">Revision</Label>
            <Input
              id="dup-revision"
              value={revision}
              onChange={(e) => setRevision(e.target.value)}
              placeholder="Enter revision"
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dup-customer">Client</Label>
            <ComboBox
              value={customer}
              onChange={setCustomer}
              options={customers}
              placeholder="Select or type client"
              className="w-full h-9 px-3 py-1 text-sm"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!partNumber.trim() || submitting}>
            {submitting ? "Creating..." : "Create Copy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}