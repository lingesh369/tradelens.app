
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

  const fetchNotes = async (): Promise<Note[]> => {
    if (!profile?.user_id) {
      console.log('No profile user_id available for notes');
      return [];
    }

    console.log('Fetching notes for profile ID:', profile.user_id);

    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", profile.user_id)
      .order("date", { ascending: false });

    if (error) throw error;
    return data || [];
  };

  const getNoteByDate = async (date: string): Promise<Note | null> => {
    if (!profile?.user_id) {
      console.log('No profile user_id available for getNoteByDate');
      return null;
    }
    
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", profile.user_id)
      .eq("date", date)
      .maybeSingle();

    if (error) throw error;
    return data;
  };

  const createNote = async (noteData: NoteCreateData): Promise<Note> => {
    if (!profile?.user_id) throw new Error("User profile not loaded");

    const preview = noteData.content 
      ? noteData.content.replace(/<[^>]*>/g, '').substring(0, 150) 
      : "";

    const { data, error } = await supabase
      .from("notes")
      .insert([{
        ...noteData,
        preview,
        user_id: profile.user_id
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const updateNote = async (noteData: NoteUpdateData): Promise<Note> => {
    if (!profile?.user_id) throw new Error("User profile not loaded");

    const updates: any = { ...noteData };
    
    if (noteData.content) {
      updates.preview = noteData.content.replace(/<[^>]*>/g, '').substring(0, 150);
    }
    
    const { data, error } = await supabase
      .from("notes")
      .update(updates)
      .eq("note_id", noteData.note_id)
      .eq("user_id", profile.user_id)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const deleteNote = async (noteId: string): Promise<void> => {
    if (!profile?.user_id) throw new Error("User profile not loaded");

    const { error } = await supabase
      .from("notes")
      .delete()
      .eq("note_id", noteId)
      .eq("user_id", profile.user_id);

    if (error) throw error;
  };

  const notesQuery = useQuery({
    queryKey: ["notes", profile?.user_id],
    queryFn: fetchNotes,
    enabled: !!profile?.user_id,
  });

  const createNoteMutation = useMutation({
    mutationFn: createNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", profile?.user_id] });
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
      queryClient.invalidateQueries({ queryKey: ["notes", profile?.user_id] });
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
      queryClient.invalidateQueries({ queryKey: ["notes", profile?.user_id] });
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
