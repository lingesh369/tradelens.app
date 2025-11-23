
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface StrategyImageUploadProps {
  strategyId: string;
  isLoading?: boolean;
}

interface StrategyImage {
  path: string;
  url: string;
}

export function StrategyImageUpload({ 
  strategyId, 
  isLoading = false 
}: StrategyImageUploadProps) {
  const [images, setImages] = useState<StrategyImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingImages, setIsLoadingImages] = useState(true);
  const { user } = useAuth();
  
  // Load images when component mounts
  useEffect(() => {
    if (strategyId) {
      loadImages();
    }
  }, [strategyId]);
  
  const loadImages = async () => {
    try {
      setIsLoadingImages(true);
      
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      const { data, error } = await supabase
        .storage
        .from('strategy_images')
        .list(`${user.id}/${strategyId}`);
      
      if (error) throw error;
      
      // Generate URLs for each image
      const imageUrls = await Promise.all(
        (data || []).map(async (file) => {
          const { data: urlData } = await supabase
            .storage
            .from('strategy_images')
            .createSignedUrl(`${user.id}/${strategyId}/${file.name}`, 60 * 60 * 24); // 24 hours expiry
          
          return {
            path: `${user.id}/${strategyId}/${file.name}`,
            url: urlData?.signedUrl || ''
          };
        })
      );
      
      setImages(imageUrls);
    } catch (err) {
      console.error("Error loading images:", err);
      toast.error("Failed to load strategy images");
    } finally {
      setIsLoadingImages(false);
    }
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileInput = e.target;
    if (!fileInput.files || fileInput.files.length === 0) return;
    
    try {
      setIsUploading(true);
      
      if (!user) {
        toast.error("You must be logged in to upload images");
        return;
      }
      
      const file = fileInput.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${user.id}/${strategyId}/${fileName}`;
      
      // Upload file to Supabase storage
      const { error: uploadError } = await supabase
        .storage
        .from('strategy_images')
        .upload(filePath, file);
      
      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }
      
      // Get URL for the uploaded file
      const { data: urlData } = await supabase
        .storage
        .from('strategy_images')
        .createSignedUrl(filePath, 60 * 60 * 24); // 24 hours expiry
      
      if (urlData?.signedUrl) {
        setImages([...images, { path: filePath, url: urlData.signedUrl }]);
        toast.success("Image uploaded successfully");
      }
    } catch (err: any) {
      console.error("Error uploading image:", err);
      toast.error(err.message || "Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
      // Reset the file input
      fileInput.value = '';
    }
  };
  
  const handleDeleteImage = async (path: string) => {
    try {
      if (!user) {
        toast.error("You must be logged in to delete images");
        return;
      }
      
      // Delete the file from Supabase storage
      const { error } = await supabase
        .storage
        .from('strategy_images')
        .remove([path]);
      
      if (error) throw error;
      
      // Remove the image from the state
      setImages(images.filter(img => img.path !== path));
      toast.success("Image deleted successfully");
    } catch (err: any) {
      console.error("Error deleting image:", err);
      toast.error(err.message || "Failed to delete image");
    }
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Strategy Images</CardTitle>
          <Skeleton className="h-9 w-[120px]" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {Array(3).fill(0).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Strategy Images</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => document.getElementById("image-upload")?.click()}
          disabled={isUploading}
          className="gap-1"
        >
          <Upload className="h-4 w-4" />
          {isUploading ? "Uploading..." : "Upload Image"}
        </Button>
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </CardHeader>
      <CardContent>
        {isLoadingImages ? (
          <div className="grid grid-cols-2 gap-4">
            {Array(2).fill(0).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        ) : images.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {images.map((image, index) => (
              <div key={index} className="relative group rounded-lg overflow-hidden border">
                <img 
                  src={image.url} 
                  alt={`Strategy image ${index + 1}`}
                  className="w-full aspect-square object-cover"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDeleteImage(image.path)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-muted rounded-lg">
            <div className="flex justify-center mb-4">
              <ImageIcon className="h-12 w-12 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-4">No images uploaded for this strategy</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById("image-upload")?.click()}
            >
              Upload Your First Image
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
