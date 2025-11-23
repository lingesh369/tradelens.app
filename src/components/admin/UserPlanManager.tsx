
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { assignUserPlan } from '@/lib/admin-utils';

interface Plan {
  plan_id: string;
  name: string;
  validity_days: number;
}

interface UserPlanManagerProps {
  userId: string;
  userName?: string;
  currentPlanId?: string;
}

export const UserPlanManager: React.FC<UserPlanManagerProps> = ({ 
  userId, 
  userName,
  currentPlanId
}) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [duration, setDuration] = useState<string>('default');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    async function fetchPlans() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('subscription_plans')
          .select('plan_id, name, validity_days')
          .order('name');
          
        if (error) throw error;
        setPlans(data || []);
        
        // Set default selected plan if currentPlanId is provided
        if (currentPlanId) {
          setSelectedPlanId(currentPlanId);
        }
      } catch (error) {
        console.error('Error fetching plans:', error);
        toast({
          title: 'Error',
          description: 'Failed to load subscription plans',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchPlans();
  }, [currentPlanId]);
  
  const handleSaveChanges = async () => {
    if (!selectedPlanId) {
      toast({
        title: 'Selection Required',
        description: 'Please select a plan before saving.',
        variant: 'destructive'
      });
      return;
    }
    
    setIsSaving(true);
    try {
      // Get the selected plan
      const selectedPlan = plans.find(p => p.plan_id === selectedPlanId);
      if (!selectedPlan) throw new Error('Selected plan not found');
      
      // Determine billing cycle based on duration selection
      let billingCycle = 'monthly'; // default
      if (duration === 'yearly') {
        billingCycle = 'yearly';
      } else if (duration === 'monthly') {
        billingCycle = 'monthly';
      }
      
      // Use the assignUserPlan function which properly handles date calculations
      const result = await assignUserPlan(userId, selectedPlanId, billingCycle);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to assign plan');
      }
      
      toast({
        title: 'Plan Updated',
        description: `Successfully updated ${userName || 'user'}'s plan to ${selectedPlan.name}`,
      });
    } catch (error) {
      console.error('Error updating user plan:', error);
      toast({
        title: 'Error',
        description: 'Failed to update the user plan',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription Management</CardTitle>
        <CardDescription>
          Manage this user's subscription plan and duration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Plan</label>
              <Select 
                value={selectedPlanId} 
                onValueChange={setSelectedPlanId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map(plan => (
                    <SelectItem key={plan.plan_id} value={plan.plan_id}>
                      {plan.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Duration</label>
              <Select 
                value={duration} 
                onValueChange={setDuration}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default (Plan Standard)</SelectItem>
                  <SelectItem value="monthly">Monthly (30 days)</SelectItem>
                  <SelectItem value="yearly">Yearly (365 days)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSaveChanges}
          disabled={isLoading || isSaving || !selectedPlanId}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};
