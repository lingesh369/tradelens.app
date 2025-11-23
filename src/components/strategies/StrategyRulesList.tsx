
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StrategyRuleItem } from './StrategyRuleItem';
import { StrategyRuleDialog } from './StrategyRuleDialog';
import { Plus, Trash2 } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export interface StrategyRule {
  rule_id: string;
  rule_title: string;
  rule_description: string;
  rule_type: "entry" | "exit" | "management";
  strategy_id: string;
  user_id: string;
}

interface StrategyRulesListProps {
  strategyId: string;
  rules: StrategyRule[];
  isLoading?: boolean;
  onRulesChange: () => void;
}

export function StrategyRulesList({ 
  strategyId, 
  rules = [], 
  isLoading = false,
  onRulesChange
}: StrategyRulesListProps) {
  const [isAddRuleOpen, setIsAddRuleOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isEditRuleOpen, setIsEditRuleOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<StrategyRule | null>(null);
  
  const handleAddRule = () => {
    setSelectedRule(null);
    setIsAddRuleOpen(true);
  };
  
  const handleEditRule = (rule: StrategyRule) => {
    setSelectedRule(rule);
    setIsEditRuleOpen(true);
  };
  
  const handleDeleteRule = async (rule: StrategyRule) => {
    setSelectedRule(rule);
    setIsDeleteConfirmOpen(true);
  };
  
  const confirmDeleteRule = async () => {
    if (!selectedRule) return;
    
    try {
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
      
      const { error } = await supabase
        .from("strategy_rules")
        .delete()
        .eq("rule_id", selectedRule.rule_id)
        .eq("user_id", appUser.user_id);
      
      if (error) throw error;
      
      toast.success("Rule deleted successfully");
      onRulesChange();
    } catch (err) {
      console.error("Error deleting rule:", err);
      toast.error(err instanceof Error ? err.message : "Failed to delete rule");
    } finally {
      setIsDeleteConfirmOpen(false);
    }
  };
  
  const entryRules = rules.filter(rule => rule.rule_type === 'entry');
  const exitRules = rules.filter(rule => rule.rule_type === 'exit');
  const managementRules = rules.filter(rule => rule.rule_type === 'management');
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Strategy Rules</h3>
          <Skeleton className="h-9 w-[120px]" />
        </div>
        
        <div className="grid gap-6 md:grid-cols-3">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-5 w-24" />
              <div className="space-y-2">
                {Array(2).fill(0).map((_, j) => (
                  <Skeleton key={j} className="h-16 w-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Strategy Rules</h3>
        <Button onClick={handleAddRule} size="sm" className="gap-1">
          <Plus className="h-4 w-4" />
          Add Rule
        </Button>
      </div>
      
      {rules.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">No rules defined for this strategy yet</p>
          <Button onClick={handleAddRule} variant="outline" className="gap-1">
            <Plus className="h-4 w-4" />
            Add Your First Rule
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {entryRules.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Entry Rules</h4>
              <div className="space-y-2">
                {entryRules.map(rule => (
                  <StrategyRuleItem
                    key={rule.rule_id}
                    text={rule.rule_title}
                    description={rule.rule_description}
                    type="entry"
                    onEdit={() => handleEditRule(rule)}
                    onDelete={() => handleDeleteRule(rule)}
                  />
                ))}
              </div>
            </div>
          )}
          
          {exitRules.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Exit Rules</h4>
              <div className="space-y-2">
                {exitRules.map(rule => (
                  <StrategyRuleItem
                    key={rule.rule_id}
                    text={rule.rule_title}
                    description={rule.rule_description}
                    type="exit"
                    onEdit={() => handleEditRule(rule)}
                    onDelete={() => handleDeleteRule(rule)}
                  />
                ))}
              </div>
            </div>
          )}
          
          {managementRules.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Management Rules</h4>
              <div className="space-y-2">
                {managementRules.map(rule => (
                  <StrategyRuleItem
                    key={rule.rule_id}
                    text={rule.rule_title}
                    description={rule.rule_description}
                    type="management"
                    onEdit={() => handleEditRule(rule)}
                    onDelete={() => handleDeleteRule(rule)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      <StrategyRuleDialog
        open={isAddRuleOpen}
        onOpenChange={setIsAddRuleOpen}
        strategyId={strategyId}
        onRuleAdded={onRulesChange}
      />
      
      {selectedRule && (
        <StrategyRuleDialog
          open={isEditRuleOpen}
          onOpenChange={setIsEditRuleOpen}
          strategyId={strategyId}
          ruleId={selectedRule.rule_id}
          defaultValues={{
            title: selectedRule.rule_title,
            description: selectedRule.rule_description,
            type: selectedRule.rule_type
          }}
          onRuleAdded={onRulesChange}
        />
      )}
      
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Rule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this rule? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteRule}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
