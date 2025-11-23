
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { RichTextEditor } from "@/components/notes/RichTextEditor";
import { useToast } from "@/hooks/use-toast";
import { ImageUploadService } from "@/services/imageUploadService";

interface TradeNotesEditorProps {
  initialNotes: string;
  onSave: (notes: string) => Promise<void>;
  isLoading?: boolean;
}

export function TradeNotesEditor({ 
  initialNotes = "", 
  onSave,
  isLoading = false 
}: TradeNotesEditorProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();
  
  // Update local state when initialNotes prop changes
  useEffect(() => {
    setNotes(initialNotes);
    setHasChanges(false);
  }, [initialNotes]);
  
  const handleNotesChange = (value: string) => {
    setNotes(value);
    setHasChanges(value !== initialNotes);
  };
  
  const handleSaveNotes = async () => {
    if (!hasChanges) return;
    
    try {
      setIsSaving(true);
      
      // Process the notes to replace any base64 images with uploaded URLs
      const processedNotes = await ImageUploadService.processContentForSaving(notes, 'trade');
      
      await onSave(processedNotes);
      toast({
        title: "Success",
        description: "Trade notes saved successfully"
      });
      setHasChanges(false);
    } catch (error) {
      console.error("Error saving notes:", error);
      toast({
        title: "Error",
        description: "Failed to save notes",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Auto-save on blur
  const handleBlur = () => {
    if (hasChanges) {
      handleSaveNotes();
    }
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Trade Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Trade Notes</CardTitle>
        {hasChanges && (
          <Button 
            onClick={handleSaveNotes} 
            variant="outline" 
            size="sm"
            disabled={isSaving}
            className="gap-1"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <RichTextEditor
          value={notes}
          onChange={handleNotesChange}
          onBlur={handleBlur}
          placeholder="Add your trade notes here... Start typing to edit."
          className="min-h-[200px]"
          noteType="trade"
        />
        {hasChanges && (
          <p className="text-xs text-muted-foreground mt-2">
            Changes will be saved automatically when you click outside or press the Save button.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
