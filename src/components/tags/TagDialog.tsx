import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Dialog, 
  DialogContent,
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useTags, Tag, TagFormValues } from "@/hooks/useTags";
import { Loader2 } from "lucide-react";

const tagFormSchema = z.object({
  tag_name: z.string().min(1, "Tag name is required"),
  tag_type: z.string().min(1, "Tag type is required"),
  description: z.string().nullable(),
});

interface TagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tag?: Tag | null;
}

export function TagDialog({ open, onOpenChange, tag }: TagDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { createTag, updateTag } = useTags();
  
  const defaultValues: Partial<TagFormValues> = {
    tag_name: "",
    tag_type: "Other",
    description: null,
  };
  
  const form = useForm<TagFormValues>({
    resolver: zodResolver(tagFormSchema),
    defaultValues,
  });
  
  // Reset form when dialog opens/closes or tag changes
  useEffect(() => {
    if (open) {
      if (tag) {
        // Pre-fill form with tag data
        form.reset({
          tag_name: tag.tag_name,
          tag_type: tag.tag_type,
          description: tag.description,
        });
      } else {
        // Reset to defaults for new tag
        form.reset(defaultValues);
      }
    }
  }, [form, tag, open]);
  
  const onSubmit = async (values: TagFormValues) => {
    setIsSubmitting(true);
    try {
      if (tag) {
        // Update existing tag
        await updateTag({ tag_id: tag.tag_id, tagData: values });
      } else {
        // Add new tag
        await createTag(values);
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting tag:", error);
      toast({
        title: "Error",
        description: "Failed to save tag. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {tag ? "Edit Tag" : "Add New Tag"}
          </DialogTitle>
          <DialogDescription>
            {tag 
              ? "Update the details for this tag."
              : "Create a new tag to categorize your trades."}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="tag_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tag Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="tag_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tag Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Mistake">Mistake</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field}
                      value={field.value || ""}
                      placeholder="Enter a description for this tag"
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="pt-4">
              <Button 
                variant="outline" 
                type="button" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  tag ? "Update" : "Create"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
