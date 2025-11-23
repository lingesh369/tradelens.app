
import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Check, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";

export default function Subscription() {
  const [isYearly, setIsYearly] = useState(false);
  const navigate = useNavigate();
  const { plans, isLoadingPlans } = useSubscription();

  const calculateSavings = (monthlyPrice: number, yearlyPrice: number) => {
    const monthlyTotal = monthlyPrice * 12;
    const totalSavings = monthlyTotal - yearlyPrice;
    const percentSaved = Math.round((monthlyTotal - yearlyPrice) / monthlyTotal * 100);
    return {
      totalSavings,
      percentSaved
    };
  };

  const handleGetStarted = (planId: string) => {
    console.log(`Getting started with plan ID: ${planId}`);
    // Navigate to checkout with plan details
    navigate("/checkout", {
      state: {
        plan: planId,
        isYearly: isYearly
      }
    });
  };

  // Filter out Free Trial plans for display
  const availablePlans = (plans || []).filter(plan => plan.name !== 'free' && plan.name !== 'Free Trial');

  if (isLoadingPlans) {
    return (
      <Layout title="Subscription">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading subscription plans...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Subscription">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Select the perfect plan for your trading journey
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <Label htmlFor="billing-toggle" className={cn("text-lg font-medium transition-colors", !isYearly ? "text-foreground" : "text-muted-foreground")}>
              Monthly
            </Label>
            <div className="relative">
              <Switch id="billing-toggle" checked={isYearly} onCheckedChange={setIsYearly} className="data-[state=checked]:bg-primary" />
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="billing-toggle" className={cn("text-lg font-medium transition-colors", isYearly ? "text-foreground" : "text-muted-foreground")}>
                Yearly
              </Label>
              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 animate-fade-in">
                Save up to 23%
              </Badge>
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {availablePlans.map((plan) => {
            const monthlyPrice = plan.monthly_price || 0;
            const yearlyPrice = plan.yearly_price || 0;
            const savings = calculateSavings(monthlyPrice, yearlyPrice);
            const currentPrice = isYearly ? (yearlyPrice / 12) : monthlyPrice;
            const originalPrice = monthlyPrice;
            const isPopular = plan.name === 'Pro';
            const isStarter = plan.name === 'Starter';
            const isPro = plan.name === 'Pro';
            
            const features = [
              { 
                name: isPro ? "Unlimited Trading Accounts" : "Up to 1 Trading Account", 
                included: true 
              },
              { 
                name: isPro ? "Unlimited Trading Strategies" : "Up to 3 Trading Strategies", 
                included: true 
              },
              { name: "Unlimited Trades", included: true },
              { name: "CSV Imports", included: true },
              { 
                name: isStarter ? "1 GB Secure Storage" : isPro ? "5 GB Secure Storage" : "Standard Secure Storage", 
                included: true 
              },
              { name: "Analytics Overview", included: true },
              { name: "Advanced Analytics", included: isPro },
              { name: "Broker Sync", included: isPro, comingSoon: isPro },
              { name: "AI-Powered Insights", included: isPro },
              { name: "AI-Assistant", included: isPro }
            ];

            return (
              <Card key={plan.id} className={cn("relative hover:shadow-lg", isPopular ? "border-primary shadow-md ring-2 ring-primary/20 scale-105" : "border-border hover:border-primary/50")}>
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <CardDescription className="text-base">
                    {plan.name === 'Starter' ? 'Perfect for individual traders starting their journey' : 'For serious traders who need advanced features'}
                  </CardDescription>
                  
                  <div className="mt-4">
                    <div className="flex items-baseline justify-center space-x-2">
                      {isYearly && (
                        <span className="text-sm text-muted-foreground line-through">
                          ${originalPrice}
                        </span>
                      )}
                      <span className="text-4xl font-bold">${currentPrice.toFixed(0)}</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    
                    {isYearly && (
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Billed ${yearlyPrice} / year
                        </p>
                        <p className="text-sm text-green-600 dark:text-green-400 font-medium animate-fade-in">
                          Save ${savings.totalSavings}
                        </p>
                      </div>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <ul className="space-y-3">
                    {features.map((feature, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        {feature.included ? (
                          <Check className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        ) : (
                          <X className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                        )}
                        <span className={cn("text-sm", feature.included ? "text-foreground" : "text-muted-foreground")}>
                          {feature.name}
                          {feature.comingSoon && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Coming Soon
                            </Badge>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                
                <CardFooter className="pt-6">
                  <Button 
                    className="w-full text-lg py-6" 
                    variant={isPopular ? "default" : "outline"} 
                    onClick={() => handleGetStarted(String(plan.plan_id || plan.id))}
                  >
                    Get Started
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
        
        <div className="text-center mt-12">
          <p className="text-muted-foreground">All plans include 7-day free trial • Cancel anytime</p>
        </div>
      </div>
    </Layout>
  );
}
