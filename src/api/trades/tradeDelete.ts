
import { supabase } from "@/integrations/supabase/client";

/**
 * Deletes a trade and its associated images
 */
export const deleteTrade = async (tradeId: string, userId: string): Promise<void> => {
  if (!userId) throw new Error("User not authenticated");

  try {
    const { data: files } = await supabase
      .storage
      .from('trade-images')
      .list(`${userId}/${tradeId}`);
      
    if (files && files.length > 0) {
      const filePaths = files.map(file => `${userId}/${tradeId}/${file.name}`);
      await supabase.storage.from('trade-images').remove(filePaths);
    }
  } catch (error) {
    console.error('Error deleting trade images:', error);
    // Continue with deletion even if image removal fails
  }

  const { error } = await supabase
    .from("trades")
    .delete()
    .eq("id", tradeId)
    .eq("user_id", userId);

  if (error) throw error;
};
