
import { supabase } from "@/integrations/supabase/client";

export class ImageUploadService {
  /**
   * Convert base64 data URL to File object
   */
  static base64ToFile(base64Data: string, filename: string): File {
    const arr = base64Data.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new File([u8arr], filename, { type: mime });
  }

  /**
   * Upload a file to storage and return the public URL
   */
  static async uploadImage(file: File, noteType: string = 'general'): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('noteType', noteType);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('User not authenticated');
    }

    const response = await supabase.functions.invoke('upload-notes-image', {
      body: formData,
    });

    if (response.error) {
      console.error('Upload error:', response.error);
      throw new Error('Failed to upload image');
    }

    if (!response.data?.url) {
      throw new Error('No URL returned from upload');
    }

    return response.data.url;
  }

  /**
   * Process HTML content to find base64 images and replace them with uploaded URLs
   */
  static async processContentForSaving(htmlContent: string, noteType: string = 'general'): Promise<string> {
    if (!htmlContent) return htmlContent;

    // Find all base64 images in the content
    const base64ImageRegex = /<img[^>]+src="data:image\/[^;]+;base64,[^"]+"/gi;
    const matches = htmlContent.match(base64ImageRegex);

    if (!matches || matches.length === 0) {
      return htmlContent;
    }

    let processedContent = htmlContent;

    // Process each base64 image
    for (const match of matches) {
      try {
        // Extract the base64 data
        const srcMatch = match.match(/src="(data:image\/[^;]+;base64,[^"]+)"/);
        if (!srcMatch) continue;

        const base64Data = srcMatch[1];
        
        // Convert to file
        const filename = `pasted-image-${Date.now()}.png`;
        const file = this.base64ToFile(base64Data, filename);
        
        // Upload the file
        const uploadedUrl = await this.uploadImage(file, noteType);
        
        // Replace the base64 src with the uploaded URL
        processedContent = processedContent.replace(base64Data, uploadedUrl);
        
      } catch (error) {
        console.error('Error processing base64 image:', error);
        // Continue with other images if one fails
      }
    }

    return processedContent;
  }

  /**
   * Process content when pasting - replace base64 immediately
   */
  static async processContentOnPaste(htmlContent: string, noteType: string = 'general'): Promise<string> {
    return this.processContentForSaving(htmlContent, noteType);
  }
}
