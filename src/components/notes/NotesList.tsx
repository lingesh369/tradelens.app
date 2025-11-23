
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format, parseISO } from "date-fns";
import { useNotes, Note } from "@/hooks/useNotes";
import { Search, Plus, Calendar, Tag } from "lucide-react";

interface NotesListProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onCreateNew: () => void;
  searchQuery?: string;
  onSearch?: (query: string) => void;
}

export function NotesList({ 
  selectedDate, 
  onSelectDate, 
  onCreateNew, 
  searchQuery = "", 
  onSearch 
}: NotesListProps) {
  const { notes, isLoading } = useNotes();
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  
  // Update local search query when prop changes
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearchQuery(value);
    if (onSearch) {
      onSearch(value);
    }
  };
  
  const filteredNotes = notes.filter(note => {
    if (!localSearchQuery) return true;
    
    const query = localSearchQuery.toLowerCase();
    return (
      (note.title && note.title.toLowerCase().includes(query)) ||
      (note.content && note.content.toLowerCase().includes(query)) ||
      (note.preview && note.preview.toLowerCase().includes(query)) ||
      (note.tags && note.tags.some(tag => tag.toLowerCase().includes(query)))
    );
  });
  
  const handleNoteClick = (note: Note) => {
    if (note.date) {
      onSelectDate(parseISO(note.date));
    }
  };
  
  const isActiveNote = (note: Note) => {
    if (!note.date) return false;
    return format(parseISO(note.date), "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
  };
  
  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            className="pl-8"
            value={localSearchQuery}
            onChange={handleSearchChange}
          />
        </div>
        <Button onClick={onCreateNew} className="bg-purple-500 hover:bg-purple-600">
          <Plus className="h-4 w-4 mr-2" />
          New
        </Button>
      </div>
      
      <div className="flex flex-col space-y-2 overflow-y-auto flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {localSearchQuery ? "No notes match your search" : "No notes yet"}
          </div>
        ) : (
          filteredNotes.map((note) => (
            <Card 
              key={note.note_id} 
              className={`cursor-pointer hover:bg-accent/50 transition-colors ${isActiveNote(note) ? "border-primary" : ""}`}
              onClick={() => handleNoteClick(note)}
            >
              <CardContent className="p-4">
                <div className="flex flex-col space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium">{note.title || "Untitled Note"}</h3>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 mr-1" />
                      {note.date ? format(parseISO(note.date), "MMM d, yyyy") : "No date"}
                    </div>
                  </div>
                  
                  {note.preview && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{note.preview}</p>
                  )}
                  
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {note.tags.map((tag, idx) => (
                        <div key={idx} className="flex items-center text-xs bg-secondary px-1.5 py-0.5 rounded">
                          <Tag className="h-2.5 w-2.5 mr-1" />
                          {tag}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
