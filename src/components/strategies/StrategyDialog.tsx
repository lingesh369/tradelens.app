
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useStrategyLimits } from "@/hooks/useStrategyLimits";
import { usePlanAccess } from "@/hooks/usePlanAccess";
import { AccessRestrictionModal } from "@/components/subscription/AccessRestrictionModal";

interface StrategyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStrategyAdded?: () => void;
  editStrategy?: {
    id: string;
    name: string;
    description: string;
  };
}

export function StrategyDialog({
  open,
  onOpenChange,
  onStrategyAdded,
  editStrategy,
}: StrategyDialogProps) {
  const [name, setName] = useState(editStrategy?.name || "");
  const [description, setDescription] = useState(editStrategy?.description || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const { canCreateStrategy, strategiesLimit, currentStrategiesCount } = useStrategyLimits();
  const { access } = usePlanAccess();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error("Strategy name is required");
      return;
    }

    // Check strategy limit for new strategies (not when editing)
    if (!editStrategy && !canCreateStrategy) {
      setShowUpgradeModal(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw new Error(userError.message);
      }
      
      if (!userData.user) {
        throw new Error("User not authenticated");
      }
      
      if (editStrategy?.id) {
        // Update existing strategy (using new schema field names)
        const { error } = await supabase
          .from("strategies")
          .update({
            name: name, // Use 'name' instead of 'strategy_name'
            description: description,
          })
          .eq("id", editStrategy.id) // Use 'id' instead of 'strategy_id'
          .eq("user_id", userData.user.id); // Use auth user id directly
          
        if (error) throw error;
        toast.success("Strategy updated successfully");
      } else {
        // Create new strategy (using new schema field names)
        const { error } = await supabase
          .from("strategies")
          .insert({
            name: name, // Use 'name' instead of 'strategy_name'
            description: description,
            user_id: userData.user.id, // Use auth user id directly
            is_active: true,
            is_public: false,
            total_trades: 0,
            winning_trades: 0,
            losing_trades: 0,
            win_rate: 0,
            total_pnl: 0,
          });
          
        if (error) {
          console.error("Database error:", error);
          throw error;
        }
        toast.success("Strategy added successfully");
      }
      
      // Reset form and close dialog
      setName("");
      setDescription("");
      if (onStrategyAdded) onStrategyAdded();
      onOpenChange(false);
      
    } catch (error) {
      console.error("Error saving strategy:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save strategy");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editStrategy ? "Edit Strategy" : "Add New Strategy"}
              </DialogTitle>
              <DialogDescription>
                {editStrategy
                  ? "Update your trading strategy details."
                  : `Create a new trading strategy to track your performance. ${!editStrategy ? `(${currentStrategiesCount}/${strategiesLimit} used)` : ''}`}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="strategy-name">Strategy Name</Label>
                <Input
                  id="strategy-name"
                  placeholder="e.g., Gap and Go"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="strategy-description">Description</Label>
                <Textarea
                  id="strategy-description"
                  placeholder="Describe your trading strategy..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : editStrategy ? "Update Strategy" : "Add Strategy"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AccessRestrictionModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        featureName="Strategy Creation"
        planRequired="Pro"
        onUpgrade={() => {
          setShowUpgradeModal(false);
          window.open("https://peakify.store/tradelens-pricing/", "_blank");
        }}
      />
    </>
  );
}
