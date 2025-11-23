
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { JournalImage, useJournalImages } from "@/hooks/useJournalImages";
import { useSharedTradeImages } from "@/hooks/useSharedTradeImages";

interface TradeLinkedImagesProps {
  tradeId: string;
  isSharedTrade?: boolean;
}

export function TradeLinkedImages({ tradeId, isSharedTrade = false }: TradeLinkedImagesProps) {
  const [images, setImages] = useState<JournalImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { fetchImagesForTrade } = useJournalImages();
  const { images: sharedImages, isLoading } = useSharedTradeImages(tradeId, isSharedTrade);

  useEffect(() => {
    if (isSharedTrade) {
      // Use the shared trade images hook
      setImages(sharedImages);
    } else {
      // Use the regular flow for non-shared trades
      const loadImages = async () => {
        const tradeImages = await fetchImagesForTrade(tradeId);
        setImages(tradeImages);
      };

      loadImages();
    }
  }, [tradeId, fetchImagesForTrade, isSharedTrade, sharedImages]);

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading linked images...
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No linked charts or images found for this trade.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h4 className="text-sm font-medium text-muted-foreground">Linked Charts & Images</h4>
      
      {images.map((image, index) => (
        <Card key={image.id} className="overflow-hidden">
          <div 
            className="relative cursor-pointer group"
            onClick={() => setSelectedImage(image.image_url)}
          >
            <img
              src={image.image_url}
              alt={`Trade image ${index + 1}`}
              className="w-full h-auto object-contain bg-muted"
              style={{ maxHeight: 'none' }}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
          </div>
          
          {image.notes && (
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                {image.notes}
              </div>
            </CardContent>
          )}
        </Card>
      ))}

      {/* Image Preview Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden">
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Full size preview"
              className="w-full h-auto max-h-[95vh] object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
