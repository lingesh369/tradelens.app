
import React from 'react';
import { Sidebar } from "@/components/layout/Sidebar";
import { UpgradePrompt } from "@/components/subscription/UpgradePrompt";
import { useSubscriptionContext } from "@/context/SubscriptionContext";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

export default function Upgrade() {
  const { planName, isTrialExpired } = useSubscriptionContext();
  const { userSubscription } = useSubscription();
  const navigate = useNavigate();
  
  // Pro users don't need to be on this page
  if (planName === "Pro") {
    return <Navigate to="/dashboard" replace />;
  }
  
  // User is on trial and it's not expired - redirect to dashboard
  if (planName === "Free Trial" && !isTrialExpired) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Determine the appropriate message based on user's plan and trial status
  const getUpgradeReason = () => {
    if (isTrialExpired) {
      return "Your Free Trial has ended. Upgrade to continue using TradeLens features.";
    }
    
    if (planName === "Starter") {
      return "Upgrade to Pro to unlock advanced features and remove account limits.";
    }
    
    return "Upgrade to access premium features.";
  };

  const handleUpgrade = () => {
    navigate('/subscription');
  };
  
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 ml-56">
        <div className="p-6 mx-0 px-[10px] flex flex-col items-center justify-center min-h-[70vh]">
          <div className="max-w-2xl w-full">
            {/* Show appropriate upgrade prompt based on trial/plan status */}
            <div className="mb-10">
              <UpgradePrompt 
                fullPage={false}
                reason={getUpgradeReason()}
              />
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 mb-10">
              <div className="bg-card border rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Starter Limitations</h2>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-muted-foreground">
                    <span className="mt-0.5">•</span>
                    <span>Limited to 1 trading account</span>
                  </li>
                  <li className="flex items-start gap-2 text-muted-foreground">
                    <span className="mt-0.5">•</span>
                    <span>Only 3 trading strategies</span>
                  </li>
                  <li className="flex items-start gap-2 text-muted-foreground">
                    <span className="mt-0.5">•</span>
                    <span>Basic analytics only</span>
                  </li>
                  <li className="flex items-start gap-2 text-muted-foreground">
                    <span className="mt-0.5">•</span>
                    <span>No notes or journal features</span>
                  </li>
                </ul>
              </div>

              <div className="bg-primary/5 border-primary/20 border rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4 text-primary">Pro Benefits</h2>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Unlimited trading accounts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Unlimited trading strategies</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Advanced analytics dashboard</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Complete notes & journal system</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Priority support</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="flex justify-center">
              <Button 
                onClick={handleUpgrade} 
                size="lg" 
                className="text-base px-8 py-6 h-auto"
              >
                Upgrade to Pro
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
