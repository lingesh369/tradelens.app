
import { supabase } from "@/integrations/supabase/client";

/**
 * Uploads an image for a trade
 */
export const uploadTradeImage = async (
  userId: string,
  tradeId: string,
  file: File
): Promise<string> => {
  if (!userId) throw new Error("User not authenticated");
  
  const fileExt = file.name.split(".").pop();
  const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
  const filePath = `${userId}/${tradeId}/${fileName}`;
  
  const { error } = await supabase.storage
    .from("trade-images")
    .upload(filePath, file);
    
  if (error) throw error;
  
  const { data } = supabase.storage
    .from("trade-images")
    .getPublicUrl(filePath);
    
  return data.publicUrl;
};

/**
 * Lists all images for a trade
 */
export const listTradeImages = async (
  userId: string,
  tradeId: string
): Promise<string[]> => {
  if (!userId) throw new Error("User not authenticated");
  
  const { data, error } = await supabase.storage
    .from("trade-images")
    .list(`${userId}/${tradeId}`);
    
  if (error) throw error;
  
  return data?.map(file => {
    const { data } = supabase.storage
      .from("trade-images")
      .getPublicUrl(`${userId}/${tradeId}/${file.name}`);
    return data.publicUrl;
  }) || [];
};
