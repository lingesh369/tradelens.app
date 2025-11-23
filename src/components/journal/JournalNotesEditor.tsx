
import React from 'react';
import { SimpleJournalNotesEditor } from './SimpleJournalNotesEditor';

interface JournalNotesEditorProps {
  selectedDate: Date;
  journalEntry?: any;
  onNotesChange?: (notes: string) => void;
}

export function JournalNotesEditor({ 
  selectedDate, 
  journalEntry,
  onNotesChange 
}: JournalNotesEditorProps) {
  return (
    <SimpleJournalNotesEditor selectedDate={selectedDate} />
  );
}
