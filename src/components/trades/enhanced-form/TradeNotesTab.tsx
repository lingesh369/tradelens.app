import React, { useState, useRef } from "react";
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, Upload, Plus, Image, Clipboard } from "lucide-react";
import { EnhancedTradeFormValues } from "../EnhancedTradeFormSchema";
import { AddTagDialog } from "./AddTagDialog";
import { uploadImage } from "@/integrations/supabase/storage";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { RichTextEditor } from "@/components/notes/RichTextEditor";
import { EnhancedImageUpload } from "../components/EnhancedImageUpload";

interface TradeNotesTabProps {
  form: UseFormReturn<EnhancedTradeFormValues>;
  tags: any[];
}

export function TradeNotesTab({
  form,
  tags = [],
}: TradeNotesTabProps) {
  const [showAddTagDialog, setShowAddTagDialog] = useState(false);
  const [isUploadingAdditional, setIsUploadingAdditional] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const additionalImagesInputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();
  const { toast } = useToast();

  const watchTags = form.watch("tags");
  const watchTradeRating = form.watch("tradeRating");
  const watchMainImage = form.watch("mainImage");
  const watchAdditionalImages = form.watch("additionalImages");
  const watchNotes = form.watch("notes");

  const addTag = (tagId: string) => {
    const currentTags = watchTags || [];
    if (!currentTags.includes(tagId)) {
      form.setValue("tags", [...currentTags, tagId]);
    }
  };

  const removeTag = (tagId: string) => {
    const currentTags = watchTags || [];
    form.setValue("tags", currentTags.filter(id => id !== tagId));
  };

  // Handle notes change from rich text editor
  const handleNotesChange = (content: string) => {
    form.setValue("notes", content);
  };

  // Handle main image changes using the updated component interface
  const handleMainImagesChange = (images: string[]) => {
    // Since this is for main image (single), take the first image or empty string
    form.setValue("mainImage", images.length > 0 ? images[0] : "");
  };

  // Handle additional images upload - this should go to additional_images column
  const handleAdditionalImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    const currentImages = watchAdditionalImages || [];
    if (currentImages.length >= 3) {
      toast({
        title: "Maximum images reached",
        description: "You can only attach up to 3 additional images",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingAdditional(true);
    try {
      const fileName = `${user.id}/trades/additional-${Date.now()}-${file.name}`;
      const imageUrl = await uploadImage(fileName, file);
      form.setValue("additionalImages", [...currentImages, imageUrl]);

      toast({
        title: "Additional image uploaded successfully",
      });
    } catch (error) {
      console.error("Error uploading additional image:", error);
      toast({
        title: "Error uploading image",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsUploadingAdditional(false);
    }
  };

  const removeAdditionalImage = (index: number) => {
    const currentImages = watchAdditionalImages || [];
    form.setValue("additionalImages", currentImages.filter((_, i) => i !== index));
  };

  const openImageModal = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setImageModalOpen(true);
  };

  // Filter tags by type
  const mistakeTags = tags.filter(tag => tag.tag_type === 'Mistake');
  const otherTags = tags.filter(tag => tag.tag_type === 'Other');

  return (
    <div className="space-y-6">
      {/* Enhanced Upload Trade Screenshot - Main Image */}
      <div>
        <FormLabel>Upload Trade Screenshot</FormLabel>
        <div className="mt-2">
          <EnhancedImageUpload
            images={watchMainImage ? [watchMainImage] : []}
            onImagesChange={handleMainImagesChange}
            maxImages={1}
          />
        </div>
      </div>

      {/* Trade Rating */}
      <FormField
        control={form.control}
        name="tradeRating"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Trade Rating: {Math.max(1, Math.min(10, field.value || 5))}/10</FormLabel>
            <FormControl>
              <Slider
                value={[Math.max(1, Math.min(10, field.value || 5))]}
                onValueChange={(value) => field.onChange(Math.max(1, Math.min(10, value[0])))}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
            </FormControl>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Poor (1)</span>
              <span>Excellent (10)</span>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Tags - Both types in single section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <FormLabel>Tags</FormLabel>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAddTagDialog(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Tag
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Mistake Tags */}
          {mistakeTags.map((tag) => {
            const isSelected = watchTags?.includes(tag.id);
            return (
              <Badge
                key={tag.id}
                variant={isSelected ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/80"
                onClick={() => isSelected ? removeTag(tag.id) : addTag(tag.id)}
              >
                {tag.name}
                {isSelected && <X className="ml-1 h-3 w-3" />}
              </Badge>
            );
          })}

          {/* Other Tags */}
          {otherTags.map((tag) => {
            const isSelected = watchTags?.includes(tag.id);
            return (
              <Badge
                key={tag.id}
                variant={isSelected ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/80"
                onClick={() => isSelected ? removeTag(tag.id) : addTag(tag.id)}
              >
                {tag.name}
                {isSelected && <X className="ml-1 h-3 w-3" />}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Trade Notes with Rich Text Editor */}
      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Trade Notes</FormLabel>
            <FormControl>
              <RichTextEditor
                value={watchNotes || ""}
                onChange={handleNotesChange}
                placeholder="Add your trade notes, observations, or lessons learned..."
                className="min-h-[200px]"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Attach Images (up to 3) - Additional Images */}
      <div>
        <FormLabel>Attach Images (up to 3)</FormLabel>
        <div className="mt-2 space-y-4">
          {/* Additional Images Grid - Responsive */}
          {watchAdditionalImages && watchAdditionalImages.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {watchAdditionalImages.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={image}
                    alt={`Additional image ${index + 1}`}
                    className="w-full h-auto max-h-32 object-contain rounded-lg border cursor-pointer"
                    onClick={() => openImageModal(image)}
                    style={{ aspectRatio: 'auto' }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0 bg-white/80 hover:bg-white"
                    onClick={() => removeAdditionalImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Upload Button */}
          {(!watchAdditionalImages || watchAdditionalImages.length < 3) && (
            <>
              <Button
                type="button"
                variant="outline"
                className="w-full border-dashed"
                onClick={() => additionalImagesInputRef.current?.click()}
                disabled={isUploadingAdditional}
              >
                <Image className="h-4 w-4 mr-2" />
                {isUploadingAdditional
                  ? "Uploading..."
                  : `Attach Images (${watchAdditionalImages?.length || 0}/3)`
                }
              </Button>
              <input
                ref={additionalImagesInputRef}
                type="file"
                accept="image/*"
                onChange={handleAdditionalImageUpload}
                className="hidden"
              />
            </>
          )}
        </div>
      </div>

      {/* Image Modal */}
      <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Enlarged view"
              className="w-full h-auto max-h-[90vh] object-contain"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Add Tag Dialog */}
      <AddTagDialog
        open={showAddTagDialog}
        onOpenChange={setShowAddTagDialog}
        onTagAdded={() => {
          // Refresh tags if needed
        }}
      />
    </div>
  );
}
