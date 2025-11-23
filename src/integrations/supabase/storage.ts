
import { supabase } from "./client";

/**
 * Upload an image to Supabase Storage
 * @param imageName - Path/filename for the image
 * @param file - The file to upload
 * @returns The public URL of the uploaded image
 */
export const uploadImage = async (imageName: string, file: File): Promise<string> => {
  const { data, error } = await supabase.storage
    .from('journal-images')
    .upload(imageName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Error uploading image:', error);
    throw error;
  }

  // Get the public URL for the uploaded image
  const { data: urlData } = supabase.storage
    .from('journal-images')
    .getPublicUrl(data.path);

  return urlData.publicUrl;
};

/**
 * Delete an image from Supabase Storage
 * @param imagePath - Path/filename of the image to delete
 */
export const deleteImage = async (imagePath: string): Promise<void> => {
  const { error } = await supabase.storage
    .from('journal-images')
    .remove([imagePath]);

  if (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};

/**
 * List all images in a folder
 * @param userId - User ID to filter images
 * @returns Array of image paths
 */
export const listImages = async (userId: string): Promise<string[]> => {
  const { data, error } = await supabase.storage
    .from('journal-images')
    .list(userId);

  if (error) {
    console.error('Error listing images:', error);
    throw error;
  }

  // Convert to public URLs
  return data.map(file => {
    const { data: urlData } = supabase.storage
      .from('journal-images')
      .getPublicUrl(`${userId}/${file.name}`);
    return urlData.publicUrl;
  });
};
