
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { RichTextEditor } from "@/components/notes/RichTextEditor";
import { ImageUploadService } from "@/services/imageUploadService";

interface StrategyNotesProps {
  strategyId: string;
  notes: string;
  isLoading?: boolean;
  onNotesChange: () => void;
}

export function StrategyNotes({ 
  strategyId, 
  notes = "", 
  isLoading = false,
  onNotesChange
}: StrategyNotesProps) {
  const [noteContent, setNoteContent] = useState(notes);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Update local state when notes prop changes
  useEffect(() => {
    setNoteContent(notes);
    setHasChanges(false);
  }, [notes]);
  
  const handleContentChange = (value: string) => {
    setNoteContent(value);
    setHasChanges(value !== notes);
  };
  
  const handleSaveNotes = async () => {
    if (!hasChanges) return;
    
    try {
      setIsSaving(true);
      
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw userError;
      }
      
      if (!userData.user) {
        throw new Error("User not authenticated");
      }

      // Get the internal user ID from app_users table
      const { data: appUser, error: appUserError } = await supabase
        .from("app_users")
        .select("user_id")
        .eq("auth_id", userData.user.id)
        .single();

      if (appUserError) {
        console.error("Error fetching internal user ID:", appUserError);
        throw new Error("Could not get user information");
      }

      if (!appUser) {
        throw new Error("User profile not found");
      }

      // Process the content to replace any base64 images with uploaded URLs
      const processedContent = await ImageUploadService.processContentForSaving(noteContent, 'strategy');
      
      const { error } = await supabase
        .from("strategies")
        .update({
          notes: processedContent
        })
        .eq("strategy_id", strategyId)
        .eq("user_id", appUser.user_id);
      
      if (error) throw error;
      
      toast.success("Notes saved successfully");
      setHasChanges(false);
      onNotesChange();
    } catch (err) {
      console.error("Error saving notes:", err);
      toast.error(err instanceof Error ? err.message : "Failed to save notes");
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Notes</CardTitle>
          <Skeleton className="h-9 w-[80px]" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Notes</CardTitle>
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
          value={noteContent}
          onChange={handleContentChange}
          placeholder="Add your strategy notes here... Use the toolbar above to format your text, add links, images, and more."
          className="min-h-[300px]"
          noteType="strategy"
        />
        {hasChanges && (
          <p className="text-xs text-muted-foreground mt-2">
            Changes will be saved when you click the Save button.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
