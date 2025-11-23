
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "./useUserProfile";
import { ImageUploadService } from "@/services/imageUploadService";

export interface SimpleJournalEntry {
  journal_id: string;
  user_id: string;
  journal_date: string;
  notes: string | null;
  all_trades_notes: string | null;
  all_journal_images_notes: string | null;
}

export function useSimpleJournal() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { profile } = useUserProfile();

  const getJournalByDate = useCallback(async (date: Date): Promise<SimpleJournalEntry | null> => {
    if (!profile?.user_id) return null;

    try {
      setIsLoading(true);
      const dateStr = date.toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('journal')
        .select('journal_id, user_id, journal_date, notes, all_trades_notes, all_journal_images_notes')
        .eq('user_id', profile.user_id)
        .eq('journal_date', dateStr)
        .maybeSingle();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error("Error fetching journal entry:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [profile?.user_id]);

  const saveJournalNotes = useCallback(async (date: Date, notes: string): Promise<boolean> => {
    if (!profile?.user_id) {
      toast({
        title: "Error",
        description: "User profile not loaded",
        variant: "destructive"
      });
      return false;
    }

    try {
      setIsLoading(true);
      const dateStr = date.toISOString().split('T')[0];

      // Process the notes to replace any base64 images with uploaded URLs
      const processedNotes = await ImageUploadService.processContentForSaving(notes, 'journal');

      // Check if entry exists
      const existing = await getJournalByDate(date);

      if (existing) {
        // Update existing entry
        const { error } = await supabase
          .from('journal')
          .update({ notes: processedNotes })
          .eq('journal_id', existing.journal_id)
          .eq('user_id', profile.user_id);

        if (error) throw error;
      } else {
        // Create new entry
        const { error } = await supabase
          .from('journal')
          .insert([{
            user_id: profile.user_id,
            journal_date: dateStr,
            notes: processedNotes,
            net_pl: 0,
            win_rate: 0,
            num_trades: 0,
            profit_factor: 1,
            winning_trades: 0,
            losing_trades: 0,
            total_profitable_pl: 0,
            total_losing_pl: 0,
            total_fees: 0,
            image_captions: {}
          }]);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Journal notes saved successfully"
      });
      
      return true;
    } catch (error) {
      console.error("Error saving journal notes:", error);
      toast({
        title: "Error",
        description: "Failed to save journal notes",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [profile?.user_id, getJournalByDate, toast]);

  return {
    getJournalByDate,
    saveJournalNotes,
    isLoading
  };
}
