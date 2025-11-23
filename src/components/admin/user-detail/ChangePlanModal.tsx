
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { getSubscriptionPlans, assignUserPlan } from '@/lib/admin-utils';
import { Loader2 } from 'lucide-react';
import { SubscriptionPlan } from '@/types/subscription';
import { Label } from '@/components/ui/label';
import { useQueryClient } from '@tanstack/react-query';

interface ChangePlanModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userDetails: { user_id: string };
    onSubscriptionUpdate: () => void;
}

export const ChangePlanModal = ({ open, onOpenChange, userDetails, onSubscriptionUpdate }: ChangePlanModalProps) => {
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [selectedPlanId, setSelectedPlanId] = useState<string>('');
    const [billingCycle, setBillingCycle] = useState('monthly');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (open) {
            const fetchPlans = async () => {
                setIsLoading(true);
                const { data } = await getSubscriptionPlans();
                setPlans(data || []);
                setIsLoading(false);
            };
            fetchPlans();
        }
    }, [open]);

    const handleSave = async () => {
        if (!selectedPlanId) {
            toast({ title: "Warning", description: "Please select a plan.", variant: "destructive" });
            return;
        }
        setIsSaving(true);
        const result = await assignUserPlan(userDetails.user_id, selectedPlanId, billingCycle);
        if (result.success) {
            toast({ title: "Success", description: "User plan has been changed." });
            // Invalidate the plan access cache for this user to ensure UI updates
            queryClient.invalidateQueries({ queryKey: ['plan-access', userDetails.user_id] });
            onSubscriptionUpdate();
            onOpenChange(false);
        } else {
            toast({ title: "Error", description: result.error || "Failed to change plan.", variant: "destructive" });
        }
        setIsSaving(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Change Subscription Plan</DialogTitle>
                </DialogHeader>
                {isLoading ? (
                    <div className="flex justify-center items-center h-24">
                        <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="plan">Plan</Label>
                            <Select onValueChange={setSelectedPlanId} value={selectedPlanId}>
                                <SelectTrigger id="plan">
                                    <SelectValue placeholder="Select a plan" />
                                </SelectTrigger>
                                <SelectContent>
                                    {plans.map((plan) => (
                                        <SelectItem key={plan.plan_id} value={plan.plan_id as string}>{plan.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="billing-cycle">Billing Cycle</Label>
                            <Select onValueChange={setBillingCycle} value={billingCycle}>
                                <SelectTrigger id="billing-cycle">
                                    <SelectValue placeholder="Select billing cycle" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                    <SelectItem value="yearly">Yearly</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isSaving || isLoading}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
