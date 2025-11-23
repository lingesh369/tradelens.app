
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageIcon, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useSubscriptionContext } from "@/context/SubscriptionContext";
import { v4 as uuidv4 } from 'uuid';
import {
  uploadImage,
  deleteImage
} from "@/integrations/supabase/storage";
import { JournalImageUploadProps } from '@/types/subscription';

export const JournalImageUpload = ({ 
  onImagesChange, 
  initialImages = [],
  journalId,
  onImageUploaded
}: JournalImageUploadProps) => {
  const [images, setImages] = useState<string[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const [hasUploadAccess, setHasUploadAccess] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const { planName } = useSubscriptionContext();
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "You must be logged in to upload images.",
        variant: "destructive",
      });
      return;
    }
    
    const files = Array.from(e.target.files || []);
    if (!files || files.length === 0) return;
    
    setUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const imageName = `${user.id}/${uuidv4()}-${file.name}`;
        const imageUrl = await uploadImage(imageName, file);
        
        // If we have onImageUploaded callback, use it
        if (onImageUploaded) {
          onImageUploaded({
            name: file.name,
            url: imageUrl,
            caption: ''
          });
        }
        
        return imageUrl;
      });
      
      const uploadedImageUrls = await Promise.all(uploadPromises);
      
      setImages(prevImages => [...prevImages, ...uploadedImageUrls]);
      // Only call onImagesChange if it's provided
      if (onImagesChange) {
        onImagesChange([...images, ...uploadedImageUrls]);
      }
      
      toast({
        title: "Images Uploaded",
        description: "Your images have been successfully uploaded.",
      });
    } catch (error: any) {
      console.error("Error uploading images:", error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };
  
  const handleRemoveImage = async (imageUrl: string) => {
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "You must be logged in to remove images.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Extract image name from URL
      const imageName = imageUrl.substring(imageUrl.indexOf(`${user.id}/`));
      
      // Delete image from storage
      await deleteImage(imageName);
      
      // Update state
      const updatedImages = images.filter(img => img !== imageUrl);
      setImages(updatedImages);
      
      // Only call onImagesChange if it's provided
      if (onImagesChange) {
        onImagesChange(updatedImages);
      }
      
      toast({
        title: "Image Removed",
        description: "Image has been successfully removed.",
      });
    } catch (error: any) {
      console.error("Error removing image:", error);
      toast({
        title: "Removal Failed",
        description: error.message || "Failed to remove image. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Check for access based on plan
  useEffect(() => {
    // Allow image upload for all plans except 'Expired'
    const hasAccess = planName !== 'Expired';
    setHasUploadAccess(hasAccess);
  }, [planName]);
  
  return (
    <div>
      <div className="mb-4">
        <Input
          id="image-upload"
          type="file"
          multiple
          disabled={uploading || !hasUploadAccess}
          onChange={handleImageUpload}
          className="hidden"
        />
        <Button asChild variant="outline" disabled={uploading || !hasUploadAccess}>
          <label htmlFor="image-upload" className="flex items-center gap-2 cursor-pointer">
            <ImageIcon className="h-4 w-4" />
            <span>Upload Images</span>
          </label>
        </Button>
        {uploading && <span className="ml-2">Uploading...</span>}
        {!hasUploadAccess && (
          <p className="text-red-500 mt-2">Image uploads are not available on your current plan.</p>
        )}
      </div>
      
      <div className="flex flex-wrap gap-4">
        {images.map((imageUrl, index) => (
          <div key={index} className="relative">
            <img src={imageUrl} alt={`Uploaded ${index + 1}`} className="w-32 h-32 object-cover rounded-md" />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-0 right-0 rounded-sm opacity-70 hover:opacity-100"
              onClick={() => handleRemoveImage(imageUrl)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
