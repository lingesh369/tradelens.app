import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  GripVertical, 
  X, 
  Type, 
  Image as ImageIcon, 
  Heading,
  ExternalLink,
  Upload,
  Loader2
} from 'lucide-react';
import { getBasicLinkMetadata } from '@/services/linkMetadataService';
import { fetchLinkMetadata } from '@/services/profileAboutService';
import { uploadImage } from '@/integrations/supabase/storage';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/lib/utils';

interface ContentBlock {
  id: string;
  type: 'text' | 'link' | 'image' | 'section';
  content: any;
  size?: 'small' | 'medium' | 'large';
}

interface AboutContent {
  bio: string;
  blocks: ContentBlock[];
}

interface BentoAboutEditorProps {
  initialContent?: ContentBlock[];
  initialBio?: string;
  onSave?: (content: ContentBlock[], bio: string) => void;
  readOnly?: boolean;
  isEditing?: boolean;
  onEditingChange?: (editing: boolean) => void;
}

export const BentoAboutEditor = ({ 
  initialContent = [], 
  initialBio = '',
  onSave, 
  readOnly = false,
  isEditing = false,
  onEditingChange
}: BentoAboutEditorProps) => {
  // Keep original content and bio for cancellation
  const [originalBlocks] = useState<ContentBlock[]>(initialContent);
  const [originalBio] = useState(initialBio);
  
  // Working copies for editing
  const [blocks, setBlocks] = useState<ContentBlock[]>(initialContent);
  const [bio, setBio] = useState(initialBio);
  const [editingMode, setEditingMode] = useState(isEditing);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  
  // For image uploads - store local file objects
  const [localImages, setLocalImages] = useState<Record<string, File>>({});
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Update editing mode when prop changes
  useEffect(() => {
    setEditingMode(isEditing);
  }, [isEditing]);

  // Notify parent of editing mode changes
  useEffect(() => {
    onEditingChange?.(editingMode);
  }, [editingMode, onEditingChange]);
  
  // Reset to original content when cancelling edit
  useEffect(() => {
    if (!editingMode) {
      // Reset to original content when exiting edit mode without saving
      setBlocks(originalBlocks);
      setBio(originalBio);
      setLocalImages({});
    }
  }, [editingMode, originalBlocks, originalBio]);

  const setBlockLoading = useCallback((blockId: string, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [blockId]: loading }));
  }, []);

  // Create a local object URL for image preview
  const createLocalImagePreview = useCallback((file: File): string => {
    return URL.createObjectURL(file);
  }, []);
  
  // Upload image to storage - only called when saving
  const uploadImageToStorage = useCallback(async (file: File): Promise<string> => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${user.id}/profile/${fileName}`;

    try {
      const publicUrl = await uploadImage(filePath, file);
      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }, [user?.id]);
  
  // Upload all pending local images to storage
  // Define updateBlock first since it's used by other functions
  const updateBlock = useCallback((id: string, content: any, size?: 'small' | 'medium' | 'large') => {
    console.log('updateBlock called:', { id, content, size });
    const updatedBlocks = blocks.map(block => 
      block.id === id ? { ...block, content, ...(size && { size }) } : block
    );
    console.log('Updated blocks:', updatedBlocks);
    setBlocks(updatedBlocks);
  }, [blocks]);

  const uploadPendingImages = useCallback(async (): Promise<Record<string, string>> => {
    const uploadResults: Record<string, string> = {};
    
    // Process each local image
    for (const [blockId, file] of Object.entries(localImages)) {
      try {
        const publicUrl = await uploadImageToStorage(file);
        uploadResults[blockId] = publicUrl;
      } catch (error) {
        console.error(`Error uploading image for block ${blockId}:`, error);
        throw error;
      }
    }
    
    return uploadResults;
  }, [localImages, uploadImageToStorage]);

  // Optimized link metadata fetching with immediate URL setting and background metadata fetch
  const handleLinkInput = useCallback(async (blockId: string, url: string) => {
    if (!url) {
      updateBlock(blockId, { 
        url: '', 
        title: '', 
        description: '', 
        thumbnail: '',
        favicon: '',
        siteName: ''
      });
      return;
    }

    // Immediately set the URL and basic info
    const basicMetadata = getBasicLinkMetadata(url);
    updateBlock(blockId, { 
      url, 
      title: basicMetadata.title,
      description: basicMetadata.description,
      thumbnail: basicMetadata.thumbnail,
      favicon: basicMetadata.favicon,
      siteName: basicMetadata.siteName
    });

    // Fetch full metadata in the background
    setBlockLoading(blockId, true);
    try {
      const fullMetadata = await fetchLinkMetadata(url);
      updateBlock(blockId, { 
        url, 
        title: fullMetadata.title || basicMetadata.title,
        description: fullMetadata.description || basicMetadata.description,
        thumbnail: fullMetadata.thumbnail || basicMetadata.thumbnail,
        favicon: fullMetadata.favicon || basicMetadata.favicon,
        siteName: fullMetadata.siteName || basicMetadata.siteName
      });
    } catch (error) {
      console.error('Failed to fetch full metadata:', error);
      // Keep the basic metadata if full fetch fails
    } finally {
      setBlockLoading(blockId, false);
    }
  }, [updateBlock, setBlockLoading]);

  const addBlock = (type: 'text' | 'link' | 'image' | 'section') => {
    const newBlock: ContentBlock = {
      id: uuidv4(),
      type,
      size: 'medium', // Default to medium size (2 columns)
      content: type === 'text' ? { text: '' } : 
               type === 'link' ? { url: '', title: '', description: '', thumbnail: '', favicon: '', siteName: '' } : 
               type === 'image' ? { src: '', alt: '' } :
               type === 'section' ? { title: '' } : {}
    };
    setBlocks([...blocks, newBlock]);
  };

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter(block => block.id !== id));
    
    // Remove any local images associated with this block
    if (localImages[id]) {
      setLocalImages(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    }
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(blocks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Support grid-based layout with horizontal and vertical movement
    setBlocks(items);
  };

  // Handle saving all changes at once
  const handleSave = async () => {
    try {
      // First, upload any pending images
      const uploadedImageUrls = await uploadPendingImages();
      
      // Update blocks with the uploaded image URLs
      let finalBlocks = [...blocks];
      
      if (Object.keys(uploadedImageUrls).length > 0) {
        finalBlocks = finalBlocks.map(block => {
          if (uploadedImageUrls[block.id] && block.type === 'image') {
            return {
              ...block,
              content: {
                ...block.content,
                src: uploadedImageUrls[block.id]
              }
            };
          }
          return block;
        });
        
        // Update blocks state with final URLs
        setBlocks(finalBlocks);
      }
      
      // Clear local images after successful upload
      setLocalImages({});
      
      // Save all changes
      onSave?.(finalBlocks, bio);
      
      // Exit editing mode
      setEditingMode(false);
    } catch (error) {
      console.error('Error saving changes:', error);
      toast({
        title: "Error saving changes",
        description: "Please try again later.",
        variant: "destructive"
      });
    }
  };

  const renderBlock = (block: ContentBlock, index: number) => {
    if (readOnly || !editingMode) {
      return renderReadOnlyBlock(block);
    }

    return (
      <Draggable key={block.id} draggableId={block.id} index={index}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={`mb-2 ${getBlockSizeClass(block.size || 'medium')}`}
          >
            <Card className="border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3">
                <div className="flex items-center gap-2">
                  <div {...provided.dragHandleProps}>
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  </div>
                  <span className="text-sm font-medium capitalize">{block.type} Block</span>
                  {block.type !== 'section' && (
                    <Select 
                      value={block.size || 'medium'} 
                      onValueChange={(size) => updateBlock(block.id, block.content, size as 'small' | 'medium' | 'large')}
                    >
                      <SelectTrigger className="w-20 h-6 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">S</SelectItem>
                        <SelectItem value="medium">M</SelectItem>
                        <SelectItem value="large">L</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeBlock(block.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="pt-3">
                {renderEditableBlock(block)}
              </CardContent>
            </Card>
          </div>
        )}
      </Draggable>
    );
  };

  const getBlockSizeClass = (size: string) => {
    switch (size) {
      case 'small': return 'col-span-1'; // 1 column
      case 'large': return 'col-span-full'; // Full width
      case 'medium':
      default: return 'col-span-2'; // 2 columns
    }
  };

  const renderEditableBlock = (block: ContentBlock) => {
    const isLoading = loadingStates[block.id] || false;

    switch (block.type) {
      case 'text':
        return (
          <Textarea
            value={block.content.text || ''}
            onChange={(e) => updateBlock(block.id, { text: e.target.value })}
            placeholder="Enter your text..."
            className="min-h-[100px]"
          />
        );
      case 'link':
        return (
          <div className="space-y-3">
            <div className="relative">
              <Input
                value={block.content.url || ''}
                onChange={(e) => handleLinkInput(block.id, e.target.value)}
                placeholder="Paste URL here..."
                className="pr-10"
              />
              {isLoading && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            {block.content.url && (
              <div className="p-3 border rounded-lg bg-muted/50 space-y-2">
                <Input
                  value={block.content.title || ''}
                  onChange={(e) => updateBlock(block.id, { ...block.content, title: e.target.value })}
                  placeholder="Link title..."
                />
                <Textarea
                  value={block.content.description || ''}
                  onChange={(e) => updateBlock(block.id, { ...block.content, description: e.target.value })}
                  placeholder="Link description..."
                  className="min-h-[60px]"
                />
                {/* Preview */}
                <div className="mt-3 p-2 border rounded bg-background">
                  <div className="flex items-start gap-3">
                    {block.content.thumbnail && (
                      <img 
                        src={block.content.thumbnail} 
                        alt="" 
                        className="w-12 h-12 rounded object-cover flex-shrink-0"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    {!block.content.thumbnail && block.content.favicon && (
                      <img 
                        src={block.content.favicon} 
                        alt="" 
                        className="w-4 h-4 rounded object-cover flex-shrink-0 mt-1"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-clamp-1">
                        {block.content.title || block.content.url}
                      </h4>
                      {block.content.description && (
                        <p className="text-muted-foreground text-xs line-clamp-2 mt-1">
                          {block.content.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {block.content.siteName || (() => {
                          try {
                            return new URL(block.content.url).hostname;
                          } catch {
                            return 'Invalid URL';
                          }
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      case 'image':
        return (
          <div className="space-y-3">
            <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-6 text-center">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // Store the file for later upload when saving
                    setLocalImages(prev => ({
                      ...prev,
                      [block.id]: file
                    }));
                    
                    // Create a local preview URL
                    const previewUrl = createLocalImagePreview(file);
                    updateBlock(block.id, { ...block.content, src: previewUrl, alt: file.name, isLocalPreview: true });
                  }
                }}
                className="hidden"
                id={`image-upload-${block.id}`}
              />
              <label 
                htmlFor={`image-upload-${block.id}`}
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                ) : (
                  <Upload className="h-8 w-8 text-muted-foreground" />
                )}
                <span className="text-sm text-muted-foreground">
                  {isLoading ? 'Uploading...' : 'Click to upload image'}
                </span>
              </label>
            </div>
            {block.content.src && (
              <div className="space-y-2">
                <div className="relative">
                  <img 
                    src={block.content.src} 
                    alt={block.content.alt || 'Uploaded image'} 
                    className="max-w-full h-auto rounded-lg"
                  />
                  {block.content.isLocalPreview && (
                    <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                      Preview
                    </div>
                  )}
                </div>
                <Input
                  value={block.content.alt || ''}
                  onChange={(e) => updateBlock(block.id, { ...block.content, alt: e.target.value })}
                  placeholder="Image description..."
                />
              </div>
            )}
          </div>
        );
      case 'section':
        return (
          <Input
            value={block.content.title || ''}
            onChange={(e) => updateBlock(block.id, { title: e.target.value })}
            placeholder="Section title..."
            className="text-lg font-semibold"
          />
        );
      default:
        return null;
    }
  };

  const renderReadOnlyBlock = (block: ContentBlock) => {
    const sizeClass = getBlockSizeClass(block.size || 'medium');
    
    switch (block.type) {
      case 'text':
        return (
          <div key={block.id} className={cn("mb-2", sizeClass)}>
            <Card>
              <CardContent className="pt-4">
                <p className="whitespace-pre-wrap">{block.content.text || ''}</p>
              </CardContent>
            </Card>
          </div>
        );
      case 'link':
        if (!block.content.url) return null;
        
        return (
          <div key={block.id} className={cn("mb-2", sizeClass)}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-4">
                <a 
                  href={block.content.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block"
                >
                  <div className="flex items-start gap-3">
                    {block.content.thumbnail && (
                      <img 
                        src={block.content.thumbnail} 
                        alt="" 
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    {!block.content.thumbnail && block.content.favicon && (
                      <img 
                        src={block.content.favicon} 
                        alt="" 
                        className="w-6 h-6 rounded object-cover flex-shrink-0 mt-1"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                        {block.content.title || block.content.url}
                      </h3>
                      {block.content.description && (
                        <p className="text-muted-foreground text-xs line-clamp-2 mb-2">
                          {block.content.description}
                        </p>
                      )}
                      <div className="flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" />
                        <span className="text-xs text-muted-foreground truncate">
                          {block.content.siteName || (() => {
                            try {
                              return new URL(block.content.url).hostname;
                            } catch {
                              return block.content.url || 'Invalid URL';
                            }
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                </a>
              </CardContent>
            </Card>
          </div>
        );
      case 'image':
        if (!block.content.src) return null;
        
        return (
          <div key={block.id} className={cn("mb-2", sizeClass)}>
            <Card>
              <CardContent className="pt-4">
                <img 
                  src={block.content.src} 
                  alt={block.content.alt || 'Image'} 
                  className="w-full h-auto rounded-lg"
                />
                {block.content.alt && (
                  <p className="text-sm text-muted-foreground mt-2">{block.content.alt}</p>
                )}
              </CardContent>
            </Card>
          </div>
        );
      case 'section':
        return (
          <div key={block.id} className="mb-4 w-full">
            <h2 className="text-2xl font-bold mb-2">
              {block.content.title || 'Untitled Section'}
            </h2>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Bio Section */}
      <div className="space-y-3">
        {editingMode ? (
          <div className="space-y-2">
            <label className="text-sm font-medium">Bio</label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              className="min-h-[100px] resize-none"
            />
          </div>
        ) : (
          bio && (
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap text-muted-foreground">{bio}</p>
            </div>
          )
        )}
      </div>

      {/* Floating Toolbar - Only show in edit mode */}
      {editingMode && (
        <Card className="sticky top-4 z-10 shadow-lg">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium mr-2">Add Block:</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addBlock('text')}
                className="flex items-center gap-2"
              >
                <Type className="h-4 w-4" />
                Text
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addBlock('link')}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Link
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addBlock('image')}
                className="flex items-center gap-2"
              >
                <ImageIcon className="h-4 w-4" />
                Image
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addBlock('section')}
                className="flex items-center gap-2"
              >
                <Heading className="h-4 w-4" />
                Section
              </Button>
              <div className="ml-auto flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingMode(false);
                    onEditingChange?.(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                >
                  Save
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Blocks Section - Now using grid layout */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="blocks" direction="horizontal">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="grid grid-cols-3 gap-4 auto-rows-auto"
            >
              {blocks.map((block, index) => renderBlock(block, index))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Empty State */}
      {blocks.length === 0 && !editingMode && (
        <div className="text-center py-12 text-muted-foreground">
          <div className="space-y-2">
            <p>No content blocks yet.</p>
            {!readOnly && (
              <p className="text-sm">Click "Edit" to start adding content.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};