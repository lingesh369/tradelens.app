
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";

interface JournalImagesProps {
  journalId: string;
  captions?: Record<string, string>;
  onCaptionChange?: (imageName: string, caption: string) => void;
}

export function JournalImages({ journalId, captions = {}, onCaptionChange }: JournalImagesProps) {
  const [images, setImages] = useState<{ name: string; url: string; caption: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCaption, setEditingCaption] = useState<string | null>(null);
  const [newCaption, setNewCaption] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchImages = async () => {
    try {
      setLoading(true);
      if (!user) return;

      // Path must start with user ID to satisfy RLS policy
      const path = `${user.id}/${journalId}`;
      
      // List all files in the journal directory
      const { data, error } = await supabase.storage
        .from("journal-images")
        .list(path);

      if (error) {
        throw error;
      }

      // Generate URLs for each image
      const imageUrls = await Promise.all(
        (data || []).map(async (file) => {
          const { data: urlData } = await supabase.storage
            .from("journal-images")
            .createSignedUrl(`${path}/${file.name}`, 3600);
          
          return {
            name: file.name,
            url: urlData?.signedUrl || "",
            caption: captions[file.name] || ""
          };
        })
      );

      setImages(imageUrls.filter(img => img.url));
    } catch (error) {
      console.error("Error fetching journal images:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteImage = async (imageName: string) => {
    try {
      if (!user) return;

      const path = `${user.id}/${journalId}/${imageName}`;
      
      const { error } = await supabase.storage
        .from("journal-images")
        .remove([path]);

      if (error) {
        throw error;
      }

      toast({
        title: "Image deleted",
        description: "The image has been removed successfully."
      });
      
      // If this image had a caption, notify parent to update it
      if (onCaptionChange && captions[imageName]) {
        onCaptionChange(imageName, "");
      }
      
      // Refresh the images list
      fetchImages();
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const startEditingCaption = (imageName: string, currentCaption: string) => {
    setEditingCaption(imageName);
    setNewCaption(currentCaption);
  };

  const saveCaption = (imageName: string) => {
    if (onCaptionChange) {
      onCaptionChange(imageName, newCaption);
    }
    setEditingCaption(null);
    
    // Update local state immediately for better UX
    setImages(images.map(img => 
      img.name === imageName 
        ? { ...img, caption: newCaption } 
        : img
    ));
  };

  useEffect(() => {
    if (journalId && user) {
      fetchImages();
    }
  }, [journalId, user, captions]);

  if (loading) {
    return (
      <div className="space-y-4 mt-4">
        <Skeleton className="h-[250px] w-full rounded-md" />
        <Skeleton className="h-[250px] w-full rounded-md" />
      </div>
    );
  }

  if (images.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 mt-4">
      {images.map((image, index) => (
        <Card key={image.name} className="overflow-hidden group w-full">
          <div className="relative">
            <span className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded-md text-sm font-medium z-10">
              #{index + 1}
            </span>
            <AspectRatio ratio={16 / 9}>
              <img
                src={image.url}
                alt={`Journal image ${index + 1}`}
                className="object-cover w-full h-full rounded-t-md"
              />
            </AspectRatio>
          </div>
          <CardContent className="p-4">
            {editingCaption === image.name ? (
              <div className="space-y-2">
                <Textarea
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                  placeholder="Enter detailed caption"
                  className="min-h-[100px] text-sm resize-y"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setEditingCaption(null)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => saveCaption(image.name)}
                  >
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium mb-1">Image Caption:</h4>
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap min-h-[60px]">
                      {image.caption || "No caption provided"}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => startEditingCaption(image.name, image.caption)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => deleteImage(image.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
