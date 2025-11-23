
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface StrategyRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  strategyId: string;
  ruleId?: string;
  defaultValues?: {
    title: string;
    description: string;
    type: "entry" | "exit" | "management";
  };
  onRuleAdded: () => void;
}

export function StrategyRuleDialog({
  open,
  onOpenChange,
  strategyId,
  ruleId,
  defaultValues,
  onRuleAdded,
}: StrategyRuleDialogProps) {
  const [title, setTitle] = useState(defaultValues?.title || "");
  const [description, setDescription] = useState(defaultValues?.description || "");
  const [type, setType] = useState<"entry" | "exit" | "management">(defaultValues?.type || "entry");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error("Rule title is required");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw userError;
      }
      
      const authUserId = userData.user?.id;
      
      if (!authUserId) {
        throw new Error("User not authenticated");
      }
      
      // Get internal user ID from app_users table
      const { data: appUser, error: appUserError } = await supabase
        .from("app_users")
        .select("user_id")
        .eq("auth_id", authUserId)
        .single();
        
      if (appUserError) {
        console.error("Error fetching internal user ID:", appUserError);
        throw new Error("Could not get user information");
      }
      
      if (!appUser) {
        throw new Error("User profile not found");
      }
      
      // If we have a ruleId, update the existing rule
      if (ruleId) {
        // Updated fields to match the schema
        const { error } = await supabase
          .from("strategy_rules")
          .update({
            rule_title: title,
            rule_description: description,
            rule_type: type,
            updated_at: new Date().toISOString()
          })
          .eq("rule_id", ruleId)
          .eq("user_id", appUser.user_id);
          
        if (error) throw error;
        
        toast.success("Rule updated successfully");
      } else {
        // Otherwise create a new rule
        const { error } = await supabase
          .from("strategy_rules")
          .insert({
            strategy_id: strategyId,
            user_id: appUser.user_id,
            rule_title: title,
            rule_description: description,
            rule_type: type,
          });
          
        if (error) throw error;
        
        toast.success("Rule added successfully");
      }
      
      // Reset form and close dialog
      setTitle("");
      setDescription("");
      setType("entry");
      onRuleAdded();
      onOpenChange(false);
    } catch (err) {
      console.error("Error saving rule:", err);
      toast.error(err instanceof Error ? err.message : "Failed to save rule");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{ruleId ? "Edit Rule" : "Add New Rule"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="rule-type">Rule Type</Label>
            <div className="flex gap-2">
              {(["entry", "exit", "management"] as const).map((ruleType) => (
                <Button
                  key={ruleType}
                  type="button"
                  size="sm"
                  variant={type === ruleType ? "default" : "outline"}
                  onClick={() => setType(ruleType)}
                  className="capitalize"
                >
                  {ruleType}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="rule-title">Title</Label>
            <Input
              id="rule-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter rule title"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="rule-description">Description</Label>
            <Textarea
              id="rule-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter rule description"
              rows={4}
            />
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : (ruleId ? "Update Rule" : "Add Rule")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
