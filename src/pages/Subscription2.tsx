
import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSubscription } from "@/hooks/useSubscription";
import { TrialBanner } from "@/components/subscription/TrialBanner";
import { useNavigate } from "react-router-dom";
import { BillingCycleToggle } from "@/components/subscription/BillingCycleToggle";
import { PlanCard } from "@/components/subscription/PlanCard";
import { PaymentHistoryTable } from "@/components/subscription/PaymentHistoryTable";
import { SubscriptionSummary } from "@/components/subscription/SubscriptionSummary";
import { Loader2 } from "lucide-react";

export default function Subscription2() {
  const navigate = useNavigate();
  const { 
    plans, 
    userSubscription, 
    isLoadingPlans, 
    calculateDaysLeftInTrial 
  } = useSubscription();
  
  const [selectedTab, setSelectedTab] = useState(userSubscription ? "current" : "plans");
  const [isYearly, setIsYearly] = useState(false);
  
  const daysLeft = calculateDaysLeftInTrial();
  const showTrialBanner = userSubscription?.status === "active" && userSubscription?.plan?.name === "Free Trial" && daysLeft > 0;

  const handleSelectPlan = (planId: string) => {
    // Store selected plan in localStorage for checkout
    localStorage.setItem("selectedPlan", planId);
    localStorage.setItem("billingCycle", isYearly ? "yearly" : "monthly");
    
    // Navigate to checkout with plan details
    navigate("/checkout", {
      state: {
        plan: planId,
        isYearly: isYearly
      }
    });
  };

  return (
    <Layout title="Subscription">
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-1">Subscription</h1>
        <p className="text-muted-foreground mb-6">Manage your subscription and billing</p>
        
        {showTrialBanner && (
          <div className="mb-6">
            <TrialBanner />
          </div>
        )}
        
        <Tabs
          value={selectedTab}
          onValueChange={setSelectedTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full max-w-md grid-cols-3">
            {userSubscription && (
              <TabsTrigger value="current">Current Plan</TabsTrigger>
            )}
            <TabsTrigger value="plans">Plans</TabsTrigger>
            <TabsTrigger value="history">Billing History</TabsTrigger>
          </TabsList>
          
          {userSubscription && (
            <TabsContent value="current">
              <SubscriptionSummary />
            </TabsContent>
          )}
          
          <TabsContent value="plans">
            {isLoadingPlans ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="flex justify-center mb-8">
                  <BillingCycleToggle 
                    isYearly={isYearly} 
                    onChange={setIsYearly} 
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {plans.map((plan) => (
                    <PlanCard
                      key={plan.plan_id?.toString() || plan.id.toString()}
                      plan={plan}
                      isYearly={isYearly}
                      isCurrentPlan={userSubscription?.plan_id === plan.id}
                      onSelectPlan={handleSelectPlan}
                    />
                  ))}
                </div>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="history">
            <div className="bg-card rounded-lg border shadow-sm p-6">
              <h3 className="text-xl font-bold mb-4">Payment History</h3>
              <PaymentHistoryTable />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
