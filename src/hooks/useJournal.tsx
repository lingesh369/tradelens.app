
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { JournalEntry, JournalUpsertData } from "@/types/journal";
import { useUserProfile } from "./useUserProfile";
import { useAuth } from "@/context/AuthContext";
import { ImageUploadService } from "@/services/imageUploadService";

export interface JournalEntryLegacy {
  entry_id: string;
  user_id: string;
  created_at: string;
  trade_symbol: string | null;
  entry_content: string;
  ai_summary: string | null;
  violated_rules: string[] | null;
  id?: string;
  journal_date?: string;
  notes?: string;
  image_captions?: Record<string, string>;
}

// Cache for journal entries
const journalCache = new Map<string, JournalEntry[]>();

export function useJournal() {
  const [journalEntries, setJournalEntries] = useState<JournalEntryLegacy[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const { profile } = useUserProfile();
  const { user } = useAuth();

  // Get user ID from auth context
  const userId = user?.id;

  const fetchJournalEntries = useCallback(async () => {
    if (!userId) {
      setJournalEntries([]);
      setJournals([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('journal')
        .select('*')
        .eq('user_id', userId)
        .order('journal_date', { ascending: false });

      if (error) throw error;

      const transformedData = (data || []).map(item => {
        const journalDate = item.journal_date || new Date().toISOString().split('T')[0];
        
        let imageCaptions: Record<string, string> = {};
        if (item.image_captions && typeof item.image_captions === 'object' && !Array.isArray(item.image_captions)) {
          imageCaptions = item.image_captions as Record<string, string>;
        }
        
        const journalEntry: JournalEntry = {
          id: item.id,
          user_id: item.user_id,
          journal_date: journalDate,
          notes: item.notes || '',
          net_pl: item.net_pl || 0,
          num_trades: item.num_trades || 0,
          win_rate: item.win_rate || 0,
          profit_factor: item.profit_factor || 1,
          total_profitable_pl: item.total_profitable_pl || 0,
          total_losing_pl: item.total_losing_pl || 0,
          winning_trades: item.winning_trades || 0,
          losing_trades: item.losing_trades || 0,
          total_fees: item.total_fees || 0,
          image_captions: imageCaptions,
          all_trades_notes: item.all_trades_notes || null,
          all_journal_images_notes: item.all_journal_images_notes || null,
          note_id: item.id,
          title: `Journal for ${journalDate}`,
          content: item.notes || '',
          date: journalDate,
          entry_content: item.notes || ''
        };

        return journalEntry;
      });

      // Update cache
      const cacheKey = `user-${userId}`;
      journalCache.set(cacheKey, transformedData);

      const legacyData = transformedData.map(item => ({
        entry_id: item.id,
        id: item.id,
        user_id: item.user_id,
        created_at: item.journal_date,
        journal_date: item.journal_date,
        date: item.journal_date,
        title: `Journal for ${item.journal_date}`,
        trade_symbol: null,
        entry_content: item.notes || '',
        notes: item.notes || '',
        content: item.notes || '',
        ai_summary: null,
        violated_rules: null,
        net_pl: item.net_pl || 0,
        win_rate: item.win_rate || 0,
        num_trades: item.num_trades || 0,
        profit_factor: item.profit_factor || 1,
        winning_trades: item.winning_trades || 0,
        losing_trades: item.losing_trades || 0,
        total_profitable_pl: item.total_profitable_pl || 0,
        total_losing_pl: item.total_losing_pl || 0,
        total_fees: item.total_fees || 0,
        image_captions: item.image_captions || {}
      }));
      
      setJournalEntries(legacyData);
      setJournals(transformedData);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("An unknown error occurred");
      setError(error);
      console.error("Error fetching journal entries:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const getJournalByDate = useCallback((date: Date | string) => {
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
    
    return journals.find(entry => {
      if (!entry.journal_date) return false;
      
      const entryDateStr = typeof entry.journal_date === 'string' 
        ? entry.journal_date.split('T')[0] 
        : entry.journal_date;
      
      return entryDateStr === dateStr;
    });
  }, [journals]);

  const upsertJournal = useCallback(async (data: any) => {
    try {
      if (!userId) {
        throw new Error("User not authenticated");
      }

      // Process content to replace any base64 images with uploaded URLs
      let processedContent = data.entry_content || data.notes || data.content || '';
      if (processedContent) {
        processedContent = await ImageUploadService.processContentForSaving(processedContent, 'journal');
      }

      let result;

      if (data.id || data.entry_id || data.note_id) {
        // Update existing entry
        const updateData = {
          notes: processedContent,
          journal_date: data.journal_date || (typeof data.date === 'string' ? data.date : data.date?.toISOString().split('T')[0]) || new Date().toISOString().split('T')[0],
          image_captions: data.image_captions || {}
        };

        const { error } = await supabase
          .from('journal')
          .update(updateData)
          .eq('id', data.id || data.entry_id || data.note_id)
          .eq('user_id', userId);

        if (error) throw error;
        result = { success: true };
      } else {
        // Create new entry
        const insertData = {
          user_id: userId,
          notes: processedContent,
          journal_date: data.journal_date || (typeof data.date === 'string' ? data.date : data.date?.toISOString().split('T')[0]) || new Date().toISOString().split('T')[0],
          net_pl: 0,
          win_rate: 0,
          num_trades: 0,
          profit_factor: 1,
          winning_trades: 0,
          losing_trades: 0,
          total_profitable_pl: 0,
          total_losing_pl: 0,
          total_fees: 0,
          image_captions: data.image_captions || {}
        };

        const { data: newEntry, error } = await supabase
          .from('journal')
          .insert([insertData])
          .select()
          .single();

        if (error) throw error;
        result = { success: true, entry: newEntry };
      }
      
      // Clear cache and refresh data immediately
      const cacheKey = `user-${userId}`;
      journalCache.delete(cacheKey);
      
      // Refresh data immediately to show changes
      await fetchJournalEntries();
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("An unknown error occurred");
      console.error("Error in upsertJournal:", error);
      return { success: false, error };
    }
  }, [userId, fetchJournalEntries]);

  const deleteJournal = useCallback(async (entryId: string) => {
    try {
      if (!userId) {
        throw new Error("User not authenticated");
      }

      const { error } = await supabase
        .from('journal')
        .delete()
        .eq('id', entryId)
        .eq('user_id', userId);

      if (error) throw error;

      const cacheKey = `user-${userId}`;
      journalCache.delete(cacheKey);
      await fetchJournalEntries();
      
      toast({
        title: "Journal Entry Deleted",
        description: "Your entry has been removed successfully."
      });
      
      return { success: true };
    } catch (err) {
      const error = err instanceof Error ? err : new Error("An unknown error occurred");
      
      toast({
        title: "Error",
        description: "Failed to delete journal entry",
        variant: "destructive"
      });
      
      return { success: false, error };
    }
  }, [userId, fetchJournalEntries, toast]);

  const addJournalEntry = useCallback(async (entry: {
    trade_symbol?: string;
    entry_content: string;
    ai_summary?: string;
    violated_rules?: string[];
  }) => {
    try {
      if (!userId) {
        throw new Error("User not authenticated");
      }
      
      // Process content to replace any base64 images with uploaded URLs
      const processedContent = await ImageUploadService.processContentForSaving(entry.entry_content, 'journal');

      const insertData = {
        user_id: userId,
        notes: processedContent,
        journal_date: new Date().toISOString().split('T')[0],
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
      };

      const { data: newEntry, error } = await supabase
        .from('journal')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;

      const cacheKey = `user-${userId}`;
      journalCache.delete(cacheKey);
      await fetchJournalEntries();
      
      toast({
        title: "Journal Entry Added",
        description: "Your entry has been saved successfully."
      });
      
      return { success: true, entry: newEntry };
    } catch (err) {
      const error = err instanceof Error ? err : new Error("An unknown error occurred");
      
      toast({
        title: "Error",
        description: "Failed to save journal entry",
        variant: "destructive"
      });
      
      return { success: false, error };
    }
  }, [userId, fetchJournalEntries, toast]);

  const updateJournalEntry = useCallback(async (data: JournalUpsertData) => {
    return await upsertJournal(data);
  }, [upsertJournal]);

  const addTradeToJournal = useCallback(async (tradeId: string, aiSummary?: string) => {
    try {
      if (!userId) {
        throw new Error("User not authenticated");
      }
      
      const { data: tradeData, error: tradeError } = await supabase
        .from("trades")
        .select("*")
        .eq("id", tradeId)
        .single();
        
      if (tradeError) throw tradeError;
      
      if (!tradeData) {
        throw new Error("Trade not found");
      }
      
      const entryContent = `Trade on ${tradeData.instrument}: ${tradeData.action.toUpperCase()} ${tradeData.quantity} units at ${tradeData.entry_price}. ${tradeData.notes || ''}`;
      
      const insertData = {
        user_id: userId,
        notes: entryContent,
        journal_date: new Date().toISOString().split('T')[0],
        net_pl: 0,
        win_rate: 0,
        num_trades: 1,
        profit_factor: 1,
        winning_trades: 0,
        losing_trades: 0,
        total_profitable_pl: 0,
        total_losing_pl: 0,
        total_fees: 0,
        image_captions: {}
      };

      const { data: newEntry, error } = await supabase
        .from('journal')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;

      const cacheKey = `user-${userId}`;
      journalCache.delete(cacheKey);
      await fetchJournalEntries();
      
      toast({
        title: "Trade Added to Journal",
        description: `${tradeData.instrument} trade has been journaled.`
      });
      
      return { success: true, entry: newEntry };
    } catch (err) {
      const error = err instanceof Error ? err : new Error("An unknown error occurred");
      
      toast({
        title: "Error",
        description: "Failed to add trade to journal",
        variant: "destructive"
      });
      
      return { success: false, error };
    }
  }, [userId, fetchJournalEntries, toast]);

  useEffect(() => {
    if (userId) {
      fetchJournalEntries();
    }
  }, [userId, fetchJournalEntries]);

  return {
    journalEntries,
    isLoading,
    error,
    refetch: fetchJournalEntries,
    addJournalEntry,
    addTradeToJournal,
    journals,
    getJournalByDate,
    upsertJournal,
    updateJournalEntry,
    deleteJournal
  };
}


