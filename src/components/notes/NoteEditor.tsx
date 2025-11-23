
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/notes/RichTextEditor";
import { format } from "date-fns";
import { useNotes, Note } from "@/hooks/useNotes";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Calendar, Trash2 } from "lucide-react";

interface NoteEditorProps {
  selectedDate: Date;
  onNoteChange?: () => void;
}

export function NoteEditor({ selectedDate, onNoteChange }: NoteEditorProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [note, setNote] = useState<Note | null>(null);
  const [isEdited, setIsEdited] = useState(false);
  const { getNoteByDate, createNote, updateNote, deleteNote } = useNotes();
  
  const formattedDate = format(selectedDate, "yyyy-MM-dd");
  
  // Load existing note for the selected date
  useEffect(() => {
    const loadNote = async () => {
      try {
        const existingNote = await getNoteByDate(formattedDate);
        
        if (existingNote) {
          setNote(existingNote);
          setTitle(existingNote.title || "");
          setContent(existingNote.content || "");
        } else {
          setNote(null);
          setTitle("");
          setContent("");
        }
        setIsEdited(false);
      } catch (error) {
        console.error("Error loading note:", error);
      }
    };
    
    loadNote();
  }, [selectedDate, formattedDate]);
  
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    setIsEdited(true);
  };
  
  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setIsEdited(true);
  };
  
  const handleSave = async () => {
    try {
      if (note) {
        // Update existing note
        await updateNote({
          note_id: note.note_id,
          title,
          content
        });
      } else {
        // Create new note
        await createNote({
          title,
          content,
          date: formattedDate
        });
      }
      
      setIsEdited(false);
      if (onNoteChange) {
        onNoteChange();
      }
    } catch (error) {
      console.error("Error saving note:", error);
    }
  };
  
  const handleDelete = async () => {
    if (!note) return;
    
    try {
      await deleteNote(note.note_id);
      setNote(null);
      setTitle("");
      setContent("");
      setIsEdited(false);
      
      if (onNoteChange) {
        onNoteChange();
      }
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };
  
  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{format(selectedDate, "EEEE, MMMM d, yyyy")}</span>
          </div>
          
          <div className="flex gap-2">
            {note && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete this note. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            
            {isEdited && (
              <Button 
                onClick={handleSave}
                className="bg-purple-500 hover:bg-purple-600"
              >
                Save
              </Button>
            )}
          </div>
        </div>
        
        <RichTextEditor
          value={content}
          onChange={handleContentChange}
          title={title}
          onTitleChange={handleTitleChange}
          autoFocus={!note}
        />
      </CardContent>
    </Card>
  );
}
