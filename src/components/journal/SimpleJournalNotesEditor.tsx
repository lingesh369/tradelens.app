
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/notes/RichTextEditor";
import { useSimpleJournal } from "@/hooks/useSimpleJournal";
import { Save } from "lucide-react";

interface SimpleJournalNotesEditorProps {
  selectedDate: Date;
}

export function SimpleJournalNotesEditor({ selectedDate }: SimpleJournalNotesEditorProps) {
  const [notes, setNotes] = useState("");
  const [savedNotes, setSavedNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { getJournalByDate, saveJournalNotes, isLoading } = useSimpleJournal();

  // Fetch notes whenever the selected date changes
  useEffect(() => {
    const fetchNotes = async () => {
      const journalEntry = await getJournalByDate(selectedDate);
      const fetchedNotes = journalEntry?.notes || "";
      setNotes(fetchedNotes);
      setSavedNotes(fetchedNotes);
    };

    fetchNotes();
  }, [selectedDate, getJournalByDate]);

  const handleNotesChange = (value: string) => {
    setNotes(value);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const success = await saveJournalNotes(selectedDate, notes);
    
    if (success) {
      setSavedNotes(notes);
      // Refetch to ensure we have the latest data
      const updatedEntry = await getJournalByDate(selectedDate);
      const latestNotes = updatedEntry?.notes || "";
      setNotes(latestNotes);
      setSavedNotes(latestNotes);
    }
    
    setIsSaving(false);
  };

  const hasChanges = notes !== savedNotes;

  if (isLoading && !notes) {
    return (
      <div className="min-h-[300px] flex items-center justify-center">
        <div className="text-muted-foreground">Loading notes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <RichTextEditor
        value={notes}
        onChange={handleNotesChange}
        placeholder="Write your journal notes here..."
        className="min-h-[300px]"
        noteType="journal"
      />
      
      {hasChanges && (
        <div className="flex justify-end">
          <Button 
            onClick={handleSave}
            disabled={isSaving}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save Notes"}
          </Button>
        </div>
      )}
      
      {!hasChanges && savedNotes && (
        <div className="flex justify-end">
          <div className="text-sm text-muted-foreground">
            Notes saved
          </div>
        </div>
      )}
    </div>
  );
}
