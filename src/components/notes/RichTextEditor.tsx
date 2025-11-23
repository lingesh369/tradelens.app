import React, { useEffect, useRef, useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tag, Palette, Type, Link2, ImageIcon } from "lucide-react";
import { 
  Bold, Italic, Underline, Strikethrough, 
  List, ListOrdered, 
  Undo, Redo, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  IndentIncrease, IndentDecrease, Eraser
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ImageUploadService } from "@/services/imageUploadService";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  title?: string;
  onTitleChange?: (title: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  showTitle?: boolean;
  showTags?: boolean;
  className?: string;
  onBlur?: () => void;
  noteType?: string;
}

export function RichTextEditor({
  value,
  onChange,
  title = "",
  onTitleChange,
  placeholder = "Write your note here...",
  autoFocus = false,
  showTitle = false,
  showTags = false,
  className = "",
  onBlur,
  noteType = "general"
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isProcessingImages, setIsProcessingImages] = useState(false);

  // Initialize editor
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value;
      
      if (autoFocus) {
        editorRef.current.focus();
      }
    }
  }, [value, autoFocus]);

  const handleInput = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
    }
  };

  const handleBlur = () => {
    if (onBlur) {
      onBlur();
    }
  };

  // Handle paste events to intercept base64 images
  const handlePaste = async (e: React.ClipboardEvent) => {
    const clipboardData = e.clipboardData;
    
    // Check if there are images in the clipboard
    const items = Array.from(clipboardData.items);
    const imageItems = items.filter(item => item.type.startsWith('image/'));
    
    if (imageItems.length > 0) {
      e.preventDefault();
      setIsProcessingImages(true);
      
      try {
        for (const item of imageItems) {
          const file = item.getAsFile();
          if (file) {
            const uploadedUrl = await ImageUploadService.uploadImage(file, noteType);
            
            // Insert the image at cursor position
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              const img = document.createElement('img');
              img.src = uploadedUrl;
              img.style.maxWidth = '100%';
              img.style.height = 'auto';
              range.insertNode(img);
              selection.removeAllRanges();
            }
          }
        }
        handleInput();
      } catch (error) {
        console.error('Error uploading pasted image:', error);
      } finally {
        setIsProcessingImages(false);
      }
    } else {
      // Handle regular paste - check for base64 images in HTML content
      setTimeout(async () => {
        if (editorRef.current) {
          const content = editorRef.current.innerHTML;
          const base64ImageRegex = /<img[^>]+src="data:image\/[^;]+;base64,[^"]+"/gi;
          
          if (base64ImageRegex.test(content)) {
            setIsProcessingImages(true);
            try {
              const processedContent = await ImageUploadService.processContentOnPaste(content, noteType);
              editorRef.current.innerHTML = processedContent;
              onChange(processedContent);
            } catch (error) {
              console.error('Error processing pasted base64 images:', error);
            } finally {
              setIsProcessingImages(false);
            }
          }
        }
      }, 100);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onTitleChange) {
      onTitleChange(e.target.value);
    }
  };

  // Text formatting handlers
  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    handleInput();
    editorRef.current?.focus();
  };

  const formatText = (command: string) => {
    executeCommand(command);
  };

  const formatAlignment = (alignment: string) => {
    executeCommand(alignment);
  };

  const formatList = (type: 'ordered' | 'unordered') => {
    editorRef.current?.focus();
    
    if (type === 'ordered') {
      executeCommand('insertOrderedList');
    } else {
      executeCommand('insertUnorderedList');
    }
  };

  const formatIndent = (type: 'increase' | 'decrease') => {
    editorRef.current?.focus();
    
    if (type === 'increase') {
      executeCommand('indent');
    } else {
      executeCommand('outdent');
    }
  };

  const handleUndo = () => {
    executeCommand('undo');
  };

  const handleRedo = () => {
    executeCommand('redo');
  };

  const handleClearFormatting = () => {
    executeCommand('removeFormat');
  };

  const handleFontSize = (size: string) => {
    executeCommand('fontSize', size);
  };

  const handleTextColor = (color: string) => {
    executeCommand('foreColor', color);
  };

  const handleHighlightColor = (color: string) => {
    executeCommand('hiliteColor', color);
  };

  const handleLink = () => {
    if (linkUrl && linkText) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        
        const link = document.createElement('a');
        link.href = linkUrl;
        link.textContent = linkText;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        
        range.insertNode(link);
        selection.removeAllRanges();
      }
      
      setLinkUrl("");
      setLinkText("");
      setLinkDialogOpen(false);
      handleInput();
    }
  };

  const handleImage = async () => {
    if (imageUrl) {
      // If it's a base64 image, upload it first
      if (imageUrl.startsWith('data:image/')) {
        try {
          setIsProcessingImages(true);
          const filename = `inserted-image-${Date.now()}.png`;
          const file = ImageUploadService.base64ToFile(imageUrl, filename);
          const uploadedUrl = await ImageUploadService.uploadImage(file, noteType);
          executeCommand('insertImage', uploadedUrl);
        } catch (error) {
          console.error('Error uploading image:', error);
          // Fallback to original URL
          executeCommand('insertImage', imageUrl);
        } finally {
          setIsProcessingImages(false);
        }
      } else {
        executeCommand('insertImage', imageUrl);
      }
      setImageUrl("");
      setImageDialogOpen(false);
    }
  };

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value);
  };

  const addTag = () => {
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput]);
      setTagInput("");
    }
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const colorOptions = [
    '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', 
    '#FF00FF', '#00FFFF', '#FFA500', '#800Purple', '#008000'
  ];

  return (
    <>
      <style>
        {`
          [contenteditable][data-placeholder]:empty:before {
            content: attr(data-placeholder);
            color: #9CA3AF;
            pointer-events: none;
          }
          
          .prose ul {
            list-style-type: disc;
            margin-left: 1.5rem;
            padding-left: 0.5rem;
          }
          
          .prose ol {
            list-style-type: decimal;
            margin-left: 1.5rem;
            padding-left: 0.5rem;
          }
          
          .prose li {
            margin: 0.25rem 0;
          }
          
          .prose img {
            max-width: 100%;
            height: auto;
            border-radius: 0.375rem;
            margin: 1rem 0;
          }
          
          .prose a {
            color: #3b82f6;
            text-decoration: underline;
          }
          
          .prose a:hover {
            color: #1d4ed8;
          }
          
          @media (max-width: 768px) {
            .prose {
              font-size: 0.875rem;
            }
          }
        `}
      </style>
      <div className={`flex flex-col w-full space-y-3 ${className}`}>
        {isProcessingImages && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
            Processing images...
          </div>
        )}
        
        {showTitle && (
          <Input
            value={title}
            onChange={handleTitleChange}
            placeholder="Note title"
            className="text-xl font-semibold border-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
          />
        )}
        
        {showTags && (
          <>
            <div className="flex items-center border rounded-md px-2 py-1">
              <Tag className="h-4 w-4 text-muted-foreground mr-2" />
              <Input 
                value={tagInput}
                onChange={handleTagInputChange}
                onKeyDown={handleTagInputKeyDown}
                placeholder="Add tag..."
                className="border-none focus-visible:ring-0 focus-visible:ring-offset-0 h-8 text-sm"
              />
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={addTag} 
                className="ml-auto"
              >
                Add
              </Button>
            </div>
            
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <div key={index} className="bg-secondary px-2 py-1 rounded-md text-xs flex items-center">
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-muted-foreground hover:text-foreground"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <div className="flex flex-wrap items-center gap-1 border rounded-md p-2 bg-background">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={handleUndo} title="Undo">
              <Undo className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleRedo} title="Redo">
              <Redo className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="w-px h-6 bg-border mx-1" />
          
          <Select onValueChange={handleFontSize}>
            <SelectTrigger className="w-16 h-8">
              <SelectValue placeholder="Size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Small</SelectItem>
              <SelectItem value="3">Normal</SelectItem>
              <SelectItem value="5">Large</SelectItem>
              <SelectItem value="7">Huge</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="w-px h-6 bg-border mx-1" />
          
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => formatText('bold')} title="Bold">
              <Bold className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => formatText('italic')} title="Italic">
              <Italic className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => formatText('underline')} title="Underline">
              <Underline className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => formatText('strikeThrough')} title="Strikethrough">
              <Strikethrough className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="w-px h-6 bg-border mx-1" />
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" title="Text Color">
                <Type className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48">
              <div className="grid grid-cols-5 gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleTextColor(color)}
                    className="w-8 h-8 rounded border"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" title="Highlight Color">
                <Palette className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48">
              <div className="grid grid-cols-5 gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleHighlightColor(color)}
                    className="w-8 h-8 rounded border"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>
          
          <div className="w-px h-6 bg-border mx-1" />
          
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => formatAlignment('justifyLeft')} title="Align Left">
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => formatAlignment('justifyCenter')} title="Align Center">
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => formatAlignment('justifyRight')} title="Align Right">
              <AlignRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => formatAlignment('justifyFull')} title="Justify">
              <AlignJustify className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="w-px h-6 bg-border mx-1" />
          
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => formatList('unordered')} title="Bullet List">
              <List className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => formatList('ordered')} title="Numbered List">
              <ListOrdered className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="w-px h-6 bg-border mx-1" />
          
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => formatIndent('increase')} title="Indent">
              <IndentIncrease className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => formatIndent('decrease')} title="Outdent">
              <IndentDecrease className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="w-px h-6 bg-border mx-1" />
          
          <div className="flex items-center gap-1">
            <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" title="Insert Link">
                  <Link2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Insert Link</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="linkText">Link Text</Label>
                    <Input
                      id="linkText"
                      value={linkText}
                      onChange={(e) => setLinkText(e.target.value)}
                      placeholder="Enter link text"
                    />
                  </div>
                  <div>
                    <Label htmlFor="linkUrl">URL</Label>
                    <Input
                      id="linkUrl"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="https://example.com"
                    />
                  </div>
                  <Button onClick={handleLink} className="w-full">
                    Insert Link
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            
            <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" title="Insert Image">
                  <ImageIcon className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Insert Image</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="imageUrl">Image URL</Label>
                    <Input
                      id="imageUrl"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  <Button onClick={handleImage} className="w-full">
                    Insert Image
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="w-px h-6 bg-border mx-1" />
          
          <Button variant="ghost" size="sm" onClick={handleClearFormatting} title="Clear Formatting">
            <Eraser className="h-4 w-4" />
          </Button>
        </div>
        
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onBlur={handleBlur}
          onPaste={handlePaste}
          className="w-full min-h-[300px] outline-none p-4 border rounded-md prose prose-sm max-w-none dark:prose-invert focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          data-placeholder={placeholder}
          style={{ direction: "ltr", textAlign: "left" }}
          dir="ltr"
        />
      </div>
    </>
  );
}
