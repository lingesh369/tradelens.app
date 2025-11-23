
import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Trash2, ZoomIn } from 'lucide-react';

interface ImagePreviewProps {
  imageFile: File | null;
  imagePreview: string | null;
  onClearImage: () => void;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({ 
  imageFile, 
  imagePreview, 
  onClearImage 
}) => {
  if (!imageFile || !imagePreview) return null;

  return (
    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
      <Dialog>
        <DialogTrigger asChild>
          <div className="relative cursor-pointer group">
            <img src={imagePreview} alt="Preview" className="h-12 w-12 object-cover rounded border" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
              <ZoomIn className="h-4 w-4 text-white" />
            </div>
          </div>
        </DialogTrigger>
        <DialogContent className="max-w-4xl">
          <img src={imagePreview} alt="Full size preview" className="w-full h-auto max-h-[80vh] object-contain" />
        </DialogContent>
      </Dialog>
      <div className="flex-1">
        <span className="text-sm font-medium">{imageFile.name}</span>
        <p className="text-xs text-muted-foreground">Click image to view full size</p>
      </div>
      <Button size="sm" variant="ghost" onClick={onClearImage}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};
