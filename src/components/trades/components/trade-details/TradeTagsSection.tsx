
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Plus } from "lucide-react";
import { useState } from "react";
import { AddTagDialog } from "../../enhanced-form/AddTagDialog";
import { Tag } from "@/hooks/useTags";

interface TradeTagsSectionProps {
  selectedTags: string[];
  tags: Tag[];
  isReadOnly?: boolean;
  onTagsChange: (value: string[]) => void;
}

export function TradeTagsSection({
  selectedTags,
  tags,
  isReadOnly = false,
  onTagsChange
}: TradeTagsSectionProps) {
  const [showAddTagDialog, setShowAddTagDialog] = useState(false);
  const [availableTagsToAdd, setAvailableTagsToAdd] = useState<Tag[]>([]);
  const [showTagSelector, setShowTagSelector] = useState(false);

  const handleAddExistingTag = (tagId: string) => {
    if (!selectedTags.includes(tagId)) {
      onTagsChange([...selectedTags, tagId]);
    }
    setShowTagSelector(false);
  };

  const handleRemoveTag = (tagId: string) => {
    onTagsChange(selectedTags.filter(id => id !== tagId));
  };

  const getTagName = (tagId: string) => {
    return tags.find(tag => tag.id === tagId)?.name || tagId;
  };

  const handleShowTagSelector = () => {
    const unselectedTags = tags.filter(tag => !selectedTags.includes(tag.id));
    setAvailableTagsToAdd(unselectedTags);
    setShowTagSelector(true);
  };

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Tags</Label>
          {!isReadOnly && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleShowTagSelector}
              className="h-6 w-6 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Selected Tags */}
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tagId) => (
            <Badge key={tagId} variant="secondary" className="flex items-center gap-1">
              {getTagName(tagId)}
              {!isReadOnly && (
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleRemoveTag(tagId)}
                />
              )}
            </Badge>
          ))}
        </div>

        {/* Tag Selector Dropdown */}
        {!isReadOnly && showTagSelector && (
          <div className="border rounded-md p-2 bg-background shadow-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Select Tag</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowTagSelector(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {availableTagsToAdd.map((tag) => (
                <div
                  key={tag.id}
                  className="p-2 hover:bg-accent cursor-pointer rounded text-sm"
                  onClick={() => handleAddExistingTag(tag.id)}
                >
                  {tag.name}
                </div>
              ))}
              {availableTagsToAdd.length === 0 && (
                <div className="text-sm text-muted-foreground p-2">
                  No more tags available
                </div>
              )}
            </div>
            <div className="mt-2 pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowTagSelector(false);
                  setShowAddTagDialog(true);
                }}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Tag
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add Tag Dialog */}
      {!isReadOnly && (
        <AddTagDialog
          open={showAddTagDialog}
          onOpenChange={setShowAddTagDialog}
          onTagAdded={() => {
            setShowAddTagDialog(false);
            // Refresh tags will happen automatically via the useTags hook
          }}
        />
      )}
    </>
  );
}
