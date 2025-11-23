
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useJournal } from "@/hooks/useJournal";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

interface JournalEntryDialogProps {
  open: boolean;
  onOpenChange: (entrySaved: boolean) => void | Promise<void>;
  selectedDate: Date;
  existingEntry?: any;
  trades?: any[];
}

export function JournalEntryDialog({ 
  open, 
  onOpenChange, 
  selectedDate, 
  existingEntry,
  trades = []
}: JournalEntryDialogProps) {
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const { upsertJournal } = useJournal();

  useEffect(() => {
    if (existingEntry) {
      setNotes(existingEntry.notes || existingEntry.entry_content || "");
    } else {
      setNotes("");
    }
  }, [existingEntry, open]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await upsertJournal({
        journal_id: existingEntry?.journal_id || existingEntry?.entry_id,
        entry_content: notes,
        notes: notes,
        journal_date: format(selectedDate, 'yyyy-MM-dd'),
        image_captions: existingEntry?.image_captions || {}
      });

      if (result && result.success) {
        onOpenChange(true);
      }
    } catch (error) {
      console.error("Failed to save journal entry:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => onOpenChange(false)}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {existingEntry ? "Edit" : "Add"} Journal Entry - {format(selectedDate, 'MMM dd, yyyy')}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Write your thoughts about today's trading session..."
              className="min-h-[200px]"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {existingEntry ? "Update" : "Save"} Entry
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
