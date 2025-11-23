
import React, { useState, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, Trash2, Edit3, Save, X, Link, Unlink, Clipboard, ImageIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { uploadImage } from "@/integrations/supabase/storage";
import { v4 as uuidv4 } from 'uuid';

interface JournalImage {
  id: string;
  user_id: string;
  journal_date: string;
  image_url: string;
  image_name: string;
  linked_trade_id?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

interface Trade {
  trade_id: string;
  instrument: string;
  action: string;
  entry_price: number;
  net_pl?: number;
}

interface EnhancedJournalImagesProps {
  images: JournalImage[];
  trades: Trade[];
  onUpload: (file: File) => Promise<void>;
  onUpdateNotes: (imageId: string, notes: string) => Promise<void>;
  onLinkToTrade: (imageId: string, tradeId: string | null) => Promise<void>;
  onDelete: (imageId: string, imageName: string) => Promise<void>;
  isUploading: boolean;
}

export const EnhancedJournalImages: React.FC<EnhancedJournalImagesProps> = ({
  images,
  trades,
  onUpload,
  onUpdateNotes,
  onLinkToTrade,
  onDelete,
  isUploading
}) => {
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState("");
  const [linkingTrade, setLinkingTrade] = useState<string | null>(null);
  const [isPasteReady, setIsPasteReady] = useState(false);
  const [selectedImage, setSelectedImage] = useState<JournalImage | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        await onUpload(file);
      } catch (error) {
        console.error('Upload error:', error);
      }
      // Reset the input
      event.target.value = '';
    }
  };

  // Handle clipboard paste
  const handlePaste = useCallback(async (event: ClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (!items || !user) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      if (item.type.startsWith('image/')) {
        event.preventDefault();
        const file = item.getAsFile();
        if (file) {
          try {
            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
              throw new Error("Image size must be less than 10MB");
            }

            // Validate file type
            const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
            if (!validTypes.includes(file.type)) {
              throw new Error("Invalid image format. Please use PNG, JPG, GIF, or WebP");
            }

            // Create a proper file name for pasted images
            const fileExtension = file.type.split('/')[1] || 'png';
            const fileName = `pasted-image-${Date.now()}.${fileExtension}`;
            
            // Create a new File object with proper name
            const renamedFile = new File([file], fileName, { type: file.type });
            
            await onUpload(renamedFile);
            
            toast({
              title: "Image pasted successfully",
              description: "Your image has been pasted and uploaded."
            });
          } catch (error: any) {
            toast({
              title: "Paste failed",
              description: error.message || "Failed to paste image. Please try again.",
              variant: "destructive"
            });
          }
        }
        break;
      }
    }
  }, [user, onUpload, toast]);

  // Add paste event listener
  useEffect(() => {
    const handleGlobalPaste = (event: ClipboardEvent) => {
      if (isPasteReady) {
        handlePaste(event);
      }
    };

    document.addEventListener('paste', handleGlobalPaste);
    return () => {
      document.removeEventListener('paste', handleGlobalPaste);
    };
  }, [isPasteReady, handlePaste]);

  const handleStartEditingNotes = (imageId: string, currentNotes: string) => {
    setEditingNotes(imageId);
    setNotesValue(currentNotes || "");
  };

  const handleSaveNotes = async (imageId: string) => {
    try {
      await onUpdateNotes(imageId, notesValue);
      setEditingNotes(null);
      setNotesValue("");
      toast({
        title: "Notes updated",
        description: "Image notes have been saved successfully."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update notes.",
        variant: "destructive"
      });
    }
  };

  const handleCancelEditingNotes = () => {
    setEditingNotes(null);
    setNotesValue("");
  };

  const handleLinkToTrade = async (imageId: string, tradeId: string) => {
    try {
      const newTradeId = tradeId === "none" ? null : tradeId;
      await onLinkToTrade(imageId, newTradeId);
      setLinkingTrade(null);
      toast({
        title: tradeId === "none" ? "Trade unlinked" : "Trade linked",
        description: tradeId === "none" 
          ? "Image has been unlinked from the trade." 
          : "Image has been linked to the trade successfully."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to link/unlink trade.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteImage = async (imageId: string, imageName: string) => {
    try {
      await onDelete(imageId, imageName);
      toast({
        title: "Image deleted",
        description: "Image has been deleted successfully."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete image.",
        variant: "destructive"
      });
    }
  };

  const getTradeDisplayName = (tradeId: string) => {
    const trade = trades.find(t => t.trade_id === tradeId);
    if (!trade) return "Unknown Trade";
    return `${trade.instrument} - ${trade.action.toUpperCase()}`;
  };

  const inputId = `journal-image-upload-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="space-y-4">
      {/* Enhanced Upload Area */}
      <div 
        className={`rounded-md border-2 border-dashed transition-colors cursor-pointer ${
          isPasteReady ? 'border-primary bg-primary/5' : 'border-muted-foreground/30 bg-muted/20'
        }`}
        onMouseEnter={() => setIsPasteReady(true)}
        onMouseLeave={() => setIsPasteReady(false)}
        onFocus={() => setIsPasteReady(true)}
        onBlur={() => setIsPasteReady(false)}
        tabIndex={0}
        onClick={() => document.getElementById(inputId)?.click()}
      >
        <div className="p-6 text-center space-y-4">
          <div className="flex justify-center gap-6">
            <div className="flex flex-col items-center">
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <span className="text-sm font-medium text-muted-foreground">Upload File</span>
            </div>
            <div className="flex flex-col items-center">
              <Clipboard className="h-8 w-8 text-muted-foreground mb-2" />
              <span className="text-sm font-medium text-muted-foreground">Paste Image</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm font-medium">
              Upload or Paste Trade Chart
            </p>
            <p className="text-muted-foreground text-xs">
              Click to upload a file or copy and paste an image from your clipboard
            </p>
            {isUploading && (
              <p className="text-primary text-xs">
                Uploading...
              </p>
            )}
            {isPasteReady && !isUploading && (
              <p className="text-primary text-xs animate-pulse">
                Ready for pasting - Press Ctrl+V (Cmd+V on Mac) to paste
              </p>
            )}
          </div>
        </div>
        
        <input
          type="file"
          id={inputId}
          accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
      </div>

      {/* Images Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {images.map((image) => (
            <Card key={image.id} className="overflow-hidden">
              <div className="relative group">
                <img
                  src={image.image_url}
                  alt="Journal entry"
                  className="w-full h-48 object-cover cursor-pointer"
                  onClick={() => setSelectedImage(image)}
                />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 bg-black/50 hover:bg-black/70"
                    onClick={() => handleStartEditingNotes(image.id, image.notes || "")}
                  >
                    <Edit3 className="h-4 w-4 text-white" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 bg-black/50 hover:bg-black/70"
                    onClick={() => setLinkingTrade(image.id)}
                  >
                    {image.linked_trade_id ? (
                      <Unlink className="h-4 w-4 text-white" />
                    ) : (
                      <Link className="h-4 w-4 text-white" />
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8 bg-red-600/80 hover:bg-red-600"
                    onClick={() => handleDeleteImage(image.id, image.image_name)}
                  >
                    <Trash2 className="h-4 w-4 text-white" />
                  </Button>
                </div>
              </div>
              
              <CardContent className="p-4">
                {/* Trade Link Badge */}
                {image.linked_trade_id && (
                  <Badge variant="secondary" className="mb-2">
                    <Link className="h-3 w-3 mr-1" />
                    {getTradeDisplayName(image.linked_trade_id)}
                  </Badge>
                )}
                
                {/* Notes Section */}
                {editingNotes === image.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={notesValue}
                      onChange={(e) => setNotesValue(e.target.value)}
                      placeholder="Add notes about this image..."
                      className="text-sm"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleSaveNotes(image.id)}
                      >
                        <Save className="h-3 w-3 mr-1" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelEditingNotes}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    {image.notes || "No notes added"}
                  </div>
                )}
                
                {/* Trade Linking Section */}
                {linkingTrade === image.id && (
                  <div className="mt-3 pt-3 border-t">
                    <Select onValueChange={(value) => handleLinkToTrade(image.id, value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Link to a trade..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          <div className="flex items-center">
                            <Unlink className="h-4 w-4 mr-2" />
                            Unlink from trade
                          </div>
                        </SelectItem>
                        {trades.map((trade) => (
                          <SelectItem key={trade.trade_id} value={trade.trade_id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{trade.instrument} - {trade.action.toUpperCase()}</span>
                              {trade.net_pl && (
                                <span className={`ml-2 text-xs ${
                                  trade.net_pl > 0 ? 'text-green-500' : 'text-red-500'
                                }`}>
                                  ${trade.net_pl > 0 ? '+' : ''}{trade.net_pl.toFixed(2)}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      onClick={() => setLinkingTrade(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Image Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Trade Chart</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <img
                  src={selectedImage.image_url}
                  alt="Trade chart"
                  className="max-w-full max-h-[60vh] object-contain"
                />
              </div>
              
              {selectedImage.linked_trade_id && (
                <div className="flex justify-center">
                  <Badge variant="secondary">
                    <Link className="h-3 w-3 mr-1" />
                    Linked to: {getTradeDisplayName(selectedImage.linked_trade_id)}
                  </Badge>
                </div>
              )}
              
              {selectedImage.notes && (
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-sm font-medium mb-1">Notes:</p>
                  <p className="text-sm text-muted-foreground">{selectedImage.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {images.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm">No images uploaded yet.</p>
          <p className="text-xs">Upload or paste your first chart to get started.</p>
        </div>
      )}
    </div>
  );
};
