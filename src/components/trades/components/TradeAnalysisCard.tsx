import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Save, XCircle, Upload, Image, X, Clipboard } from "lucide-react";
import { TradeImageManager } from "./TradeImageManager";
import { TradeLinkedImages } from "./TradeLinkedImages";
import { TradeDetailsCard } from "./TradeDetailsCard";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { uploadImage } from "@/integrations/supabase/storage";
import { RichTextEditor } from "@/components/notes/RichTextEditor";

interface TradeAnalysisCardProps {
  tradeId: string;
  notes: string;
  images: string[];
  hasChanges: boolean;
  onNotesChange: (notes: string) => void;
  onImagesChange: (images: string[]) => void;
  onSave: () => void;
  showTradeDetailsTab?: boolean;
  tradeDetailsProps?: any;
  isReadOnly?: boolean;
  isSharedTrade?: boolean;
  onEdit?: () => void;
}

export function TradeAnalysisCard({
  tradeId,
  notes,
  images,
  hasChanges,
  onNotesChange,
  onImagesChange,
  onSave,
  showTradeDetailsTab = false,
  tradeDetailsProps,
  isReadOnly = false,
  isSharedTrade = false,
  onEdit
}: TradeAnalysisCardProps) {
  const [activeTab, setActiveTab] = useState(showTradeDetailsTab ? "trade-details" : "notes");
  const [mainImage, setMainImage] = useState<string>("");
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadingAdditional, setUploadingAdditional] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [isPasteReady, setIsPasteReady] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load images from database on component mount
  useEffect(() => {
    const fetchTradeImages = async () => {
      try {
        if (!tradeId) return;
        
        const { data, error } = await supabase
          .from('trades')
          .select('main_image, additional_images')
          .eq('id', tradeId)
          .single();
        
        if (error) {
          console.error('Error fetching trade images:', error);
          return;
        }
        
        if (data) {
          // Set main image
          setMainImage(data.main_image || "");
          
          // Parse and set additional images
          const parsedAdditionalImages = data.additional_images 
            ? (Array.isArray(data.additional_images) ? data.additional_images : JSON.parse(String(data.additional_images) || '[]'))
            : [];
          setAdditionalImages(parsedAdditionalImages);
        }
      } catch (error) {
        console.error('Error loading trade images:', error);
      }
    };
    
    fetchTradeImages();
  }, [tradeId]);

  // Handle clipboard paste functionality - disabled in read-only mode
  const handlePaste = async (event: ClipboardEvent) => {
    if (isReadOnly) return;
    
    const items = event.clipboardData?.items;
    if (!items || !user) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      if (item.type.startsWith('image/')) {
        event.preventDefault();
        const file = item.getAsFile();
        if (file) {
          setUploading(true);
          try {
            const fileName = `${user.id}/trades/main-${Date.now()}-pasted-image.${file.type.split('/')[1]}`;
            const imageUrl = await uploadImage(fileName, file);
            
            // Update main image in database
            const { error } = await supabase
              .from('trades')
              .update({ main_image: imageUrl })
              .eq('id', tradeId);
            
            if (error) throw error;
            
            setMainImage(imageUrl);
            
            toast({
              title: "Chart pasted successfully",
              description: "Your trade chart has been pasted and uploaded."
            });
          } catch (error: any) {
            toast({
              title: "Paste failed",
              description: error.message || "Failed to paste image. Please try again.",
              variant: "destructive"
            });
          } finally {
            setUploading(false);
          }
        }
        break;
      }
    }
  };

  // Add paste event listener when the component mounts - disabled in read-only mode
  useEffect(() => {
    if (isReadOnly) return;
    
    const handleGlobalPaste = (event: ClipboardEvent) => {
      // Only handle paste when the screenshot area is focused or ready
      if (isPasteReady) {
        handlePaste(event);
      }
    };

    document.addEventListener('paste', handleGlobalPaste);
    return () => {
      document.removeEventListener('paste', handleGlobalPaste);
    };
  }, [isPasteReady, user, tradeId, isReadOnly]);

  // Handle main image upload - disabled in read-only mode
  const uploadMainImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) return;
    
    try {
      if (!event.target.files || event.target.files.length === 0 || !user) {
        return;
      }
      
      setUploading(true);
      
      const file = event.target.files[0];
      const fileName = `${user.id}/trades/main-${Date.now()}-${file.name}`;
      const imageUrl = await uploadImage(fileName, file);
      
      // Update main image in database
      const { error } = await supabase
        .from('trades')
        .update({ main_image: imageUrl })
        .eq('id', tradeId);
      
      if (error) throw error;
      
      setMainImage(imageUrl);
      
      toast({
        title: "Trade screenshot uploaded",
        description: "Your main trade image has been uploaded successfully."
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "An error occurred while uploading the image.",
        variant: "destructive"
      });
      console.error('Error uploading main image:', error);
    } finally {
      setUploading(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  // Handle additional images upload - disabled in read-only mode
  const uploadAdditionalImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) return;
    
    try {
      if (!event.target.files || event.target.files.length === 0 || !user) {
        return;
      }
      
      if (additionalImages.length >= 3) {
        toast({
          title: "Maximum images reached",
          description: "You can only attach up to 3 additional images",
          variant: "destructive",
        });
        return;
      }
      
      setUploadingAdditional(true);
      
      const file = event.target.files[0];
      const fileName = `${user.id}/trades/additional-${Date.now()}-${file.name}`;
      const imageUrl = await uploadImage(fileName, file);
      
      const newAdditionalImages = [...additionalImages, imageUrl];
      
      // Update additional images in database
      const { error } = await supabase
        .from('trades')
        .update({ additional_images: newAdditionalImages })
        .eq('id', tradeId);
      
      if (error) throw error;
      
      setAdditionalImages(newAdditionalImages);
      
      toast({
        title: "Additional image uploaded",
        description: "Your additional image has been uploaded successfully."
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "An error occurred while uploading the image.",
        variant: "destructive"
      });
      console.error('Error uploading additional image:', error);
    } finally {
      setUploadingAdditional(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const removeMainImage = async () => {
    if (isReadOnly) return;
    
    try {
      if (!user) return;
      
      // Update database to remove main image
      const { error } = await supabase
        .from('trades')
        .update({ main_image: null })
        .eq('id', tradeId);
      
      if (error) throw error;
      
      setMainImage("");
      
      toast({
        title: "Image removed",
        description: "Your main trade image has been removed successfully."
      });
    } catch (error: any) {
      toast({
        title: "Remove failed",
        description: error.message || "An error occurred while removing the image.",
        variant: "destructive"
      });
      console.error('Error removing main image:', error);
    }
  };

  const removeAdditionalImage = async (index: number) => {
    if (isReadOnly) return;
    
    try {
      if (!user) return;
      
      const newAdditionalImages = additionalImages.filter((_, i) => i !== index);
      
      // Update database
      const { error } = await supabase
        .from('trades')
        .update({ additional_images: newAdditionalImages })
        .eq('id', tradeId);
      
      if (error) throw error;
      
      setAdditionalImages(newAdditionalImages);
      
      toast({
        title: "Image removed",
        description: "Additional image has been removed successfully"
      });
    } catch (error: any) {
      toast({
        title: "Remove failed",
        description: error.message || "An error occurred while removing the image.",
        variant: "destructive"
      });
      console.error('Error removing additional image:', error);
    }
  };

  const openImageModal = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setImageDialogOpen(true);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Trade Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Trade Screenshot Section */}
        <div className="rounded-md overflow-hidden">
          {mainImage ? (
            <div className="relative group">
              <img
                src={mainImage}
                alt="Trade Screenshot"
                onClick={() => openImageModal(mainImage)}
                className="w-full h-auto max-h-[380px] rounded-md cursor-pointer object-contain"
              />
              {!isReadOnly && (
                <button
                  className="absolute top-2 right-2 bg-black/50 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={removeMainImage}
                >
                  <XCircle className="h-5 w-5 text-white" />
                </button>
              )}
            </div>
          ) : !isReadOnly ? (
            <div 
              className={`h-[320px] bg-muted/20 rounded-md flex flex-col items-center justify-center border-2 border-dashed transition-colors ${
                isPasteReady ? 'border-primary bg-primary/5' : 'border-muted-foreground/30'
              }`}
              onMouseEnter={() => setIsPasteReady(true)}
              onMouseLeave={() => setIsPasteReady(false)}
              onFocus={() => setIsPasteReady(true)}
              onBlur={() => setIsPasteReady(false)}
              tabIndex={0}
            >
              <div className="text-center space-y-4">
                <div className="flex justify-center gap-4">
                  <div className="flex flex-col items-center">
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('main-image-upload')?.click()}
                      disabled={uploading}
                      className="mb-2"
                    >
                      {uploading ? 'Uploading...' : 'Upload File'}
                    </Button>
                  </div>
                  <div className="flex flex-col items-center">
                    <Clipboard className="h-8 w-8 text-muted-foreground mb-2" />
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsPasteReady(true);
                        toast({
                          title: "Ready to paste",
                          description: "Copy an image and paste it here (Ctrl+V or Cmd+V)",
                        });
                      }}
                      disabled={uploading}
                      className="mb-2"
                    >
                      Paste Image
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-muted-foreground text-sm font-medium">
                    Upload or Paste Trade Chart Screenshot
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Click "Upload File" to browse files, or copy an image from TradingView and click "Paste Image"
                  </p>
                  {isPasteReady && (
                    <p className="text-primary text-xs animate-pulse">
                      Ready for pasting - Press Ctrl+V (Cmd+V on Mac) to paste
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[320px] bg-muted/10 rounded-md flex items-center justify-center">
              <p className="text-muted-foreground">No chart image available</p>
            </div>
          )}
          {!isReadOnly && (
            <input
              type="file"
              id="main-image-upload"
              accept="image/*"
              onChange={uploadMainImage}
              style={{ display: 'none' }}
            />
          )}
        </div>
        
        {/* Large Image Viewer Dialog */}
        <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
          <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden">
            <div className="relative w-full h-full flex items-center justify-center min-h-[80vh]">
              {selectedImage && (
                <img
                  src={selectedImage}
                  alt="Trade Screenshot"
                  className="w-full h-auto max-h-[90vh] object-contain"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
        
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            {showTradeDetailsTab && (
              <TabsTrigger value="trade-details" className="text-xs sm:text-sm">Trade Details</TabsTrigger>
            )}
            <TabsTrigger value="notes" className="text-xs sm:text-sm">Notes</TabsTrigger>
            <TabsTrigger value="linked-images" className="text-xs sm:text-sm">Linked Images</TabsTrigger>
          </TabsList>
          
          {showTradeDetailsTab && (
            <TabsContent value="trade-details" className="pt-4">
              <div className="max-h-[600px] overflow-y-auto">
                <TradeDetailsCard {...tradeDetailsProps} onEdit={onEdit} />
              </div>
            </TabsContent>
          )}
          
          <TabsContent value="notes" className="pt-4">
            <div className="space-y-4">
              {isReadOnly ? (
                <div 
                  className="w-full min-h-[200px] p-4 border rounded-md prose prose-sm max-w-none dark:prose-invert bg-muted/10"
                  dangerouslySetInnerHTML={{ __html: notes || '<p class="text-muted-foreground">No notes available</p>' }}
                />
              ) : (
                <RichTextEditor
                  value={notes}
                  onChange={onNotesChange}
                  placeholder="Add your trade notes here... Use the rich text editor to format your analysis."
                  className="min-h-[200px]"
                />
              )}
              {hasChanges && !isReadOnly && (
                <div className="flex justify-end">
                  <Button onClick={onSave}>
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="linked-images" className="pt-4">
            <TradeLinkedImages tradeId={tradeId} isSharedTrade={isSharedTrade} />
          </TabsContent>
        </Tabs>
        
        {/* Additional Images Section */}
        <div>
          <h4 className="font-medium mb-4">Attach Images</h4>
          
          {/* Display Additional Images */}
          {additionalImages.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              {additionalImages.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={image}
                    alt={`Additional image ${index + 1}`}
                    className="w-full h-auto max-h-24 object-contain rounded-lg border cursor-pointer"
                    onClick={() => openImageModal(image)}
                  />
                  {!isReadOnly && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0 bg-white/80 hover:bg-white"
                      onClick={() => removeAdditionalImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* Upload Button for Additional Images - Hidden in read-only mode */}
          {!isReadOnly && additionalImages.length < 3 && (
            <>
              <Button
                variant="outline"
                className="w-full border-dashed"
                onClick={() => document.getElementById('additional-images-upload')?.click()}
                disabled={uploadingAdditional}
              >
                <Image className="h-4 w-4 mr-2" />
                {uploadingAdditional 
                  ? "Uploading..." 
                  : `Attach Images (${additionalImages.length}/3)`
                }
              </Button>
              <input
                type="file"
                id="additional-images-upload"
                accept="image/*"
                onChange={uploadAdditionalImage}
                style={{ display: 'none' }}
              />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
