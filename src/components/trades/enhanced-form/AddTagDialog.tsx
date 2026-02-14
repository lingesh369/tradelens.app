
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useTags } from "@/hooks/useTags";
import { useToast } from "@/hooks/use-toast";

interface AddTagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTagAdded?: () => void;
}

export function AddTagDialog({ open, onOpenChange, onTagAdded }: AddTagDialogProps) {
  const [tagName, setTagName] = useState("");
  const [tagType, setTagType] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { createTag } = useTags();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      createTag({
        name: tagName,
        tag_type: tagType,
        description: description || null,
      });

      // Reset form
      setTagName("");
      setTagType("");
      setDescription("");

      onTagAdded?.();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error adding tag",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Tag</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="tagName">Tag Name *</Label>
            <Input
              id="tagName"
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              placeholder="Enter tag name"
              required
            />
          </div>

          <div>
            <Label htmlFor="tagType">Tag Type *</Label>
            <Select value={tagType} onValueChange={setTagType} required>
              <SelectTrigger>
                <SelectValue placeholder="Select tag type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Mistake">Mistake</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter tag description"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Tag"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
