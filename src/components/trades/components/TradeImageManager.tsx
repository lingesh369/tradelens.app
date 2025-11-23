import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ImagePlus, XCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface TradeImageManagerProps {
  tradeId: string;
  images: string[];
  onImagesChange: (images: string[]) => void;
}

export function TradeImageManager({
  tradeId,
  images,
  onImagesChange
}: TradeImageManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [imageUploadOpen, setImageUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !user) return;
    if (images.length >= 3) {
      toast({
        title: "Upload limit reached",
        description: "You can only upload up to 3 images per trade",
        variant: "destructive"
      });
      return;
    }
    setUploading(true);
    try {
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${tradeId}/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('trade-images').upload(filePath, file);
      if (uploadError) {
        throw uploadError;
      }
      const { data: { publicUrl } } = supabase.storage.from('trade-images').getPublicUrl(filePath);
      onImagesChange([...images, publicUrl]);
      setImageUploadOpen(false);
      toast({
        title: "Image uploaded",
        description: "Your image has been uploaded successfully"
      });
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: error.message || "There was a problem uploading your image",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageUrl: string) => {
    if (!user) return;
    try {
      // Extract the file path from the public URL
      const urlParts = imageUrl.split('/');
      const storagePath = urlParts.slice(urlParts.indexOf('trade-images') + 1).join('/');
      const { error } = await supabase.storage.from('trade-images').remove([storagePath]);
      if (error) {
        throw error;
      }

      // Remove the image from the state
      onImagesChange(images.filter(img => img !== imageUrl));
      toast({
        title: "Image deleted",
        description: "The image has been removed successfully"
      });
    } catch (error: any) {
      console.error('Error deleting image:', error);

      // Even if there's an error with the storage, still remove from UI
      onImagesChange(images.filter(img => img !== imageUrl));
      toast({
        title: "Error removing image from storage",
        description: error.message || "The image was removed from your trade but there was an issue deleting it from storage",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Trade Images</h3>
        
        {images.length > 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((imageUrl, index) => (
                <div key={index} className="relative rounded-md overflow-hidden border group px-0 py-0 mx-0">
                  <img 
                    src={imageUrl} 
                    alt={`Trade image ${index + 1}`} 
                    className="w-full h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity" 
                    onClick={() => setSelectedImage(imageUrl)}
                  />
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    onClick={() => handleDeleteImage(imageUrl)} 
                    className="absolute top-2 right-2 bg-black/50 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <Button 
          variant="outline" 
          onClick={() => setImageUploadOpen(true)} 
          disabled={images.length >= 3} 
          className="w-full"
        >
          <ImagePlus className="mr-2 h-4 w-4" />
          Attach Images {images.length > 0 && `(${images.length}/3)`}
        </Button>
      </div>
      
      {/* Upload Dialog */}
      <Dialog open={imageUploadOpen} onOpenChange={setImageUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Image</DialogTitle>
            <DialogDescription>
              Upload an image for this trade. You can upload up to 3 images per trade.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
            <div className="text-sm text-muted-foreground">
              {images.length}/3 images uploaded
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Viewer Dialog - Made much larger */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-1">
          <div className="relative w-full h-full flex items-center justify-center min-h-[80vh]">
            {selectedImage && (
              <img 
                src={selectedImage} 
                alt="Trade chart" 
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
