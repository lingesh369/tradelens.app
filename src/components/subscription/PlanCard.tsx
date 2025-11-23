
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SubscriptionPlan } from "@/types/subscription";
import { useNavigate } from "react-router-dom";

interface PlanCardProps {
  plan: SubscriptionPlan;
  isYearly: boolean;
  isCurrentPlan?: boolean;
  onSelectPlan: (planId: string) => void;
  className?: string;
}

export function PlanCard({
  plan,
  isYearly,
  isCurrentPlan = false,
  onSelectPlan,
  className,
}: PlanCardProps) {
  const navigate = useNavigate();
  const price = isYearly ? plan.yearly_price : plan.monthly_price;
  const features = plan.features;
  const isStarter = plan.name === 'Starter';
  const isPro = plan.name === 'Pro';
  
  const featuresList = [
    { 
      name: isPro ? 'Unlimited Trading Accounts' : `${features?.trading_accounts === -1 ? 'Unlimited' : features?.trading_accounts || plan.trading_account_limit} Trading Accounts`, 
      included: true 
    },
    { 
      name: isPro ? 'Unlimited Trading Strategies' : `${features?.strategies === -1 ? 'Unlimited' : features?.strategies || plan.trading_strategy_limit} Trading Strategies`, 
      included: true 
    },
    { name: "Unlimited Trades", included: features?.unlimited_trades || true },
    { name: "CSV Imports", included: features?.csv_imports || true },
    { name: "Broker Sync", included: features?.broker_sync || false, comingSoon: plan.name === 'Pro' },
    { 
      name: isStarter ? "1 GB Secure Storage" : isPro ? "5 GB Secure Storage" : `${features?.data_storage || "Standard"} Secure Storage`, 
      included: true 
    },
    { name: "Basic Analytics", included: features?.basic_analytics || true },
    { name: "Advanced Analytics", included: features?.advanced_analytics || plan.analytics_other_access },
    { name: "Automatic Price Chart", included: features?.automatic_price_chart || plan.analytics_overview_access },
    { name: "Replay Your Trades", included: features?.trade_replay || false },
    { name: "AI-Powered Insights", included: isPro ? true : (features?.ai_insights || false) },
    { name: "AI-Assistant", included: isPro }
  ];
  
  const handleSubscribe = () => {
    if (isCurrentPlan) return;
    
    // Convert plan.plan_id to string to ensure type safety
    const planId = plan.plan_id?.toString() || plan.id.toString();
    
    // Navigate to checkout page with plan details
    navigate("/checkout", {
      state: {
        plan: planId,
        isYearly: isYearly
      }
    });
  };

  return (
    <Card className={cn(
      "border hover:shadow-md transition-all duration-300",
      isCurrentPlan ? "border-primary bg-primary/5" : "",
      className
    )}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{plan.name}</CardTitle>
            <CardDescription className="mt-1">{plan.description}</CardDescription>
          </div>
          {isCurrentPlan && (
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-primary text-primary-foreground">
              Current Plan
            </span>
          )}
        </div>
        <div className="mt-4">
          <div className="flex items-baseline">
            <span className="text-3xl font-bold">${price}</span>
            <span className="ml-1 text-sm text-muted-foreground">
              /{isYearly ? 'year' : 'month'}
            </span>
          </div>
          {isYearly && plan.yearly_price && plan.monthly_price && (
            <p className="mt-1 text-xs text-green-600">
              Save {Math.round(100 - (plan.yearly_price / (plan.monthly_price * 12)) * 100)}% with annual billing!
            </p>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Features</h4>
          <ul className="space-y-2">
            {featuresList.map((feature, i) => (
              <li key={i} className="flex items-start text-sm">
                {feature.included ? (
                  <Check className="mr-2 h-4 w-4 text-green-500 mt-0.5" />
                ) : (
                  <X className="mr-2 h-4 w-4 text-muted-foreground mt-0.5" />
                )}
                <span className={feature.included ? "" : "text-muted-foreground"}>
                  {feature.name}
                  {feature.comingSoon && (
                    <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full">
                      Coming Soon
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          variant={isCurrentPlan ? "outline" : "default"}
          onClick={isCurrentPlan 
            ? () => onSelectPlan(plan.plan_id?.toString() || plan.id.toString()) 
            : handleSubscribe}
          disabled={isCurrentPlan}
        >
          {isCurrentPlan ? "Current Plan" : "Subscribe Now"}
        </Button>
      </CardFooter>
    </Card>
  );
}
