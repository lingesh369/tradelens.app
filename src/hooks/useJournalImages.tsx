
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useUserProfile } from "./useUserProfile";
import { ImageUploadService } from "@/services/imageUploadService";

export interface JournalImage {
  id: string;
  journal_id: string;
  user_id: string;
  journal_date: string;
  image_url: string;
  image_name: string;
  linked_trade_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Cache for images to avoid repeated API calls
const imageCache = new Map<string, JournalImage[]>();

export function useJournalImages() {
  const [images, setImages] = useState<JournalImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { profile } = useUserProfile();

  const fetchImagesForDate = useCallback(async (date: Date) => {
    if (!profile?.id) return;
    
    const dateStr = date.toISOString().split('T')[0];
    const cacheKey = `${profile.id}-${dateStr}`;
    
    // Check cache first
    if (imageCache.has(cacheKey)) {
      setImages(imageCache.get(cacheKey) || []);
      return;
    }
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('journal_images')
        .select('*')
        .eq('user_id', profile.id)
        .eq('journal_date', dateStr)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      const imageData = data || [];
      imageCache.set(cacheKey, imageData);
      setImages(imageData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load journal images",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id, toast]);

  const fetchImagesForTrade = useCallback(async (tradeId: string) => {
    if (!profile?.id) return [];
    
    try {
      const { data, error } = await supabase
        .from('journal_images')
        .select('*')
        .eq('user_id', profile.id)
        .eq('linked_trade_id', tradeId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      return [];
    }
  }, [profile?.id]);

  const uploadImage = useCallback(async (file: File, journalDate: Date): Promise<JournalImage | null> => {
    if (!profile?.id) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive"
      });
      return null;
    }

    try {
      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select a valid image file');
      }

      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Image size must be less than 10MB');
      }

      const dateStr = journalDate.toISOString().split('T')[0];

      // First, ensure a journal entry exists for this date
      let journalId: string;
      
      const { data: existingJournal, error: journalFetchError } = await supabase
        .from('journal')
        .select('id')
        .eq('user_id', profile.id)
        .eq('journal_date', dateStr)
        .maybeSingle();

      if (journalFetchError) throw journalFetchError;

      if (existingJournal) {
        journalId = existingJournal.id;
      } else {
        // Create a new journal entry
        const { data: newJournal, error: journalCreateError } = await supabase
          .from('journal')
          .insert([{
            user_id: profile.id,
            journal_date: dateStr,
            notes: '',
            net_pl: 0,
            num_trades: 0,
            win_rate: 0,
            profit_factor: 1,
            winning_trades: 0,
            losing_trades: 0,
            total_profitable_pl: 0,
            total_losing_pl: 0,
            total_fees: 0,
            image_captions: {}
          }])
          .select('id')
          .single();

        if (journalCreateError) throw journalCreateError;
        journalId = newJournal.id;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `${profile.id}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('journal-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('journal-images')
        .getPublicUrl(filePath);

      // Save to database with journal_id
      const insertData = {
        journal_id: journalId,
        user_id: profile.id,
        journal_date: dateStr,
        image_url: publicUrl,
        image_name: fileName,
        notes: null,
        linked_trade_id: null
      };

      const { data, error: dbError } = await supabase
        .from('journal_images')
        .insert(insertData)
        .select()
        .single();

      if (dbError) {
        await supabase.storage
          .from('journal-images')
          .remove([filePath]);
        throw dbError;
      }

      // Update cache and local state
      const cacheKey = `${profile.id}-${dateStr}`;
      const cachedImages = imageCache.get(cacheKey) || [];
      const updatedImages = [...cachedImages, data];
      imageCache.set(cacheKey, updatedImages);
      setImages(updatedImages);

      toast({
        title: "Success",
        description: "Image uploaded successfully"
      });

      return data;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload image",
        variant: "destructive"
      });
      return null;
    }
  }, [profile?.id, toast]);

  const updateImageNotes = useCallback(async (imageId: string, notes: string) => {
    try {
      // Process the notes to replace any base64 images with uploaded URLs
      const processedNotes = await ImageUploadService.processContentForSaving(notes, 'journal');

      const { error } = await supabase
        .from('journal_images')
        .update({ notes: processedNotes, updated_at: new Date().toISOString() })
        .eq('id', imageId);

      if (error) throw error;

      // Update local state immediately
      setImages(prev => prev.map(img => 
        img.id === imageId ? { ...img, notes: processedNotes } : img
      ));

      // Update cache
      imageCache.forEach((cachedImages, key) => {
        const updatedImages = cachedImages.map(img => 
          img.id === imageId ? { ...img, notes: processedNotes } : img
        );
        imageCache.set(key, updatedImages);
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update notes",
        variant: "destructive"
      });
    }
  }, [toast]);

  const linkImageToTrade = useCallback(async (imageId: string, tradeId: string | null) => {
    try {
      const { error } = await supabase
        .from('journal_images')
        .update({ linked_trade_id: tradeId, updated_at: new Date().toISOString() })
        .eq('id', imageId);

      if (error) throw error;

      setImages(prev => prev.map(img => 
        img.id === imageId ? { ...img, linked_trade_id: tradeId } : img
      ));

      toast({
        title: "Success",
        description: tradeId ? "Image linked to trade" : "Image unlinked from trade"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to link image to trade",
        variant: "destructive"
      });
    }
  }, [toast]);

  const deleteImage = useCallback(async (imageId: string, imageName: string) => {
    if (!profile?.id) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('journal-images')
        .remove([`${profile.id}/${imageName}`]);

      if (storageError) {
        // Continue with database deletion even if storage fails
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('journal_images')
        .delete()
        .eq('id', imageId);

      if (dbError) throw dbError;

      // Update local state
      setImages(prev => prev.filter(img => img.id !== imageId));

      // Update cache
      imageCache.forEach((cachedImages, key) => {
        const updatedImages = cachedImages.filter(img => img.id !== imageId);
        imageCache.set(key, updatedImages);
      });

      toast({
        title: "Success",
        description: "Image deleted successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete image",
        variant: "destructive"
      });
    }
  }, [profile?.id, toast]);

  return {
    images,
    isLoading,
    fetchImagesForDate,
    fetchImagesForTrade,
    uploadImage,
    updateImageNotes,
    linkImageToTrade,
    deleteImage
  };
}


