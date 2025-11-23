
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStrategies } from "@/hooks/useStrategies";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface AddStrategyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStrategyAdded?: () => void;
}

export function AddStrategyDialog({ open, onOpenChange, onStrategyAdded }: AddStrategyDialogProps) {
  const [strategyName, setStrategyName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { strategies, createStrategy } = useStrategies();
  const { user } = useAuth();
  const { toast } = useToast();

  const checkStrategyLimits = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "User not authenticated.",
        variant: "destructive"
      });
      return false;
    }

    try {
      // Get current strategies count
      const currentStrategiesCount = strategies.length;

      // Get user's subscription limits using the centralized function
      const { data: accessData, error: accessError } = await supabase
        .rpc('get_user_access_matrix', { auth_user_id: user.id });
      
      if (accessError || !accessData || accessData.length === 0) {
        console.log('No access data found, allowing strategy creation');
        return true;
      }
      
      const userAccess = accessData[0];
      const strategyLimit = userAccess.strategiesLimit || 0;
      
      if (currentStrategiesCount >= strategyLimit) {
        toast({
          title: "Limit Exceeded",
          description: `You have reached the maximum number of strategies (${strategyLimit}) for your plan.`,
          variant: "destructive"
        });
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error checking strategy limits:", error);
      return true; // Allow creation if check fails
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Check strategy limits before creating
      const canAddStrategy = await checkStrategyLimits();
      if (!canAddStrategy) {
        setIsLoading(false);
        return;
      }

      // Create the strategy
      await createStrategy({
        strategy_name: strategyName,
        description: description || null
      });

      toast({
        title: "Strategy added successfully",
      });

      // Reset form
      setStrategyName("");
      setDescription("");
      
      onStrategyAdded?.();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error adding strategy",
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
          <DialogTitle>Add New Strategy</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="strategyName">Strategy Name *</Label>
            <Input
              id="strategyName"
              value={strategyName}
              onChange={(e) => setStrategyName(e.target.value)}
              placeholder="Enter strategy name"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter strategy description"
              rows={3}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Strategy"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
