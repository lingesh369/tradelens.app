
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { useUserProfile } from "./useUserProfile";

export interface Note {
  note_id: string;
  user_id: string;
  title: string;
  content: string;
  date: string;
  created_at: string;
  updated_at: string;
  preview?: string;
  tags?: string[];
}

export type NoteCreateData = Omit<Note, "note_id" | "user_id" | "created_at" | "updated_at">;
export type NoteUpdateData = Partial<Omit<Note, "user_id" | "created_at" | "updated_at">> & { note_id: string };

export function useNotes() {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get user ID from auth context
  const userId = user?.id;

  const fetchNotes = async (): Promise<Note[]> => {
    if (!userId) {
      console.log('No user ID available for notes');
      return [];
    }

    console.log('Fetching notes for user ID:', userId);

    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false });

    if (error) throw error;
    return data || [];
  };

  const getNoteByDate = async (date: string): Promise<Note | null> => {
    if (!userId) {
      console.log('No user ID available for getNoteByDate');
      return null;
    }
    
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", userId)
      .eq("date", date)
      .maybeSingle();

    if (error) throw error;
    return data;
  };

  const createNote = async (noteData: NoteCreateData): Promise<Note> => {
    if (!userId) throw new Error("User not authenticated");

    const preview = noteData.content 
      ? noteData.content.replace(/<[^>]*>/g, '').substring(0, 150) 
      : "";

    const { data, error } = await supabase
      .from("notes")
      .insert([{
        ...noteData,
        preview,
        user_id: userId
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const updateNote = async (noteData: NoteUpdateData): Promise<Note> => {
    if (!userId) throw new Error("User not authenticated");

    const updates: any = { ...noteData };
    
    if (noteData.content) {
      updates.preview = noteData.content.replace(/<[^>]*>/g, '').substring(0, 150);
    }
    
    const { data, error } = await supabase
      .from("notes")
      .update(updates)
      .eq("note_id", noteData.note_id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const deleteNote = async (noteId: string): Promise<void> => {
    if (!userId) throw new Error("User not authenticated");

    const { error } = await supabase
      .from("notes")
      .delete()
      .eq("note_id", noteId)
      .eq("user_id", userId);

    if (error) throw error;
  };

  const notesQuery = useQuery({
    queryKey: ["notes", userId],
    queryFn: fetchNotes,
    enabled: !!userId,
  });

  const createNoteMutation = useMutation({
    mutationFn: createNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", userId] });
      toast({
        title: "Note created",
        description: "Your note has been saved successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating note",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: updateNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", userId] });
      toast({
        title: "Note updated",
        description: "Your note has been updated successfully."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating note",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: deleteNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", userId] });
      toast({
        title: "Note deleted",
        description: "Your note has been deleted."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting note",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    notes: notesQuery.data || [],
    isLoading: notesQuery.isLoading,
    isError: notesQuery.isError,
    error: notesQuery.error,
    getNoteByDate,
    createNote: createNoteMutation.mutate,
    updateNote: updateNoteMutation.mutate,
    deleteNote: deleteNoteMutation.mutate,
    refetch: notesQuery.refetch,
  };
}
