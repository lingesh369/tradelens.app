
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { JournalImage } from "@/hooks/useJournalImages";

export function useSharedTradeImages(tradeId: string, isEnabled: boolean = false) {
  const [images, setImages] = useState<JournalImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEnabled || !tradeId) {
      setImages([]);
      return;
    }

    const fetchSharedTradeImages = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const { data, error } = await supabase
          .from('journal_images')
          .select('*')
          .eq('linked_trade_id', tradeId);

        if (error) {
          console.error('Error fetching shared trade images:', error);
          setError(error.message);
          return;
        }

        setImages(data || []);
      } catch (err) {
        console.error('Error in fetchSharedTradeImages:', err);
        setError('Failed to fetch images');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSharedTradeImages();
  }, [tradeId, isEnabled]);

  return {
    images,
    isLoading,
    error
  };
}
