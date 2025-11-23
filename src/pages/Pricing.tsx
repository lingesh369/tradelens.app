
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Check, X, AlertCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import PayPalCheckout from "@/components/checkout/PayPalCheckout";
import { useState } from "react";

interface PricingFeature {
  name: string;
  included: "yes" | "no" | "coming";
}

interface PricingTierProps {
  name: string;
  price: number;
  description: string;
  features: PricingFeature[];
  buttonText: string;
  planId: string;
  featured?: boolean;
}

const FeatureIcon = ({ type }: { type: "yes" | "no" | "coming" }) => {
  if (type === "yes") {
    return <Check className="mr-2 h-4 w-4 text-green-500" />;
  } else if (type === "no") {
    return <X className="mr-2 h-4 w-4 text-muted-foreground" />;
  } else {
    return <AlertCircle className="mr-2 h-4 w-4 text-amber-500" />;
  }
};

const PricingTier = ({ name, price, description, features, buttonText, planId, featured = false }: PricingTierProps) => {
  const navigate = useNavigate();
  const [showPayPal, setShowPayPal] = useState(false);
  
  const handleSubscribe = () => {
    setShowPayPal(true);
  };
  
  const handleFreeTrial = () => {
    navigate("/auth");
  };
  
  return (
    <div className={cn(
      "flex flex-col rounded-lg border bg-card p-6 shadow-sm",
      featured ? "border-primary shadow-lg relative" : ""
    )}>
      {featured && (
        <div className="absolute -top-4 left-0 right-0 mx-auto w-fit rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
          Most Popular
        </div>
      )}
      <div className="flex-1 space-y-4">
        <div className="space-y-2">
          <h3 className="text-2xl font-bold">{name}</h3>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
        <div className="space-y-2">
          <div className="text-3xl font-bold">${price}</div>
          <p className="text-muted-foreground text-sm">per month</p>
        </div>
        <ul className="space-y-2 text-sm">
          {features.map((feature, i) => (
            <li key={i} className="flex items-center">
              <FeatureIcon type={feature.included} />
              <span className={feature.included === "no" ? "text-muted-foreground" : ""}>
                {feature.name}
                {feature.included === "coming" && (
                  <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full">
                    Coming Soon
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="pt-6 space-y-3">
        <Button 
          className="w-full group" 
          variant="outline"
          onClick={handleFreeTrial}
        >
          Start 7-Day Free Trial
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>
        
        {!showPayPal ? (
          <Button 
            className={cn("w-full", featured ? "" : "bg-muted hover:bg-muted/80")} 
            variant={featured ? "default" : "outline"}
            onClick={handleSubscribe}
          >
            Subscribe Now
          </Button>
        ) : (
          <div className="border rounded-lg p-4">
            <PayPalCheckout 
              planId={planId}
              amount={price}
              billingCycle="monthly"
              onSuccess={() => {
                // PayPal component handles redirect to dashboard
              }}
              onError={() => {
                setShowPayPal(false);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

const Pricing = () => {
  const tiers = [
    {
      name: "Pro Trader",
      price: 9,
      planId: "starter-plan",
      description: "Perfect for individual traders",
      buttonText: "Start 7-Day Free Trial",
      features: [
        { name: "Up to 1 Trading Account", included: "yes" as const },
        { name: "Up to 3 Strategies", included: "yes" as const },
        { name: "Trade Journaling", included: "yes" as const },
        { name: "Daily Performance Insights", included: "yes" as const },
        { name: "Notes & Image Uploads", included: "yes" as const },
        { name: "Linked Trades to Journal Entries", included: "yes" as const },
        { name: "Automated Price Chart (TradingView)", included: "no" as const },
        { name: "Strategy Backtesting", included: "coming" as const },
        { name: "Trade Replay & Visualization", included: "coming" as const },
      ],
    },
    {
      name: "Elite Trader",
      price: 14,
      planId: "elite-plan",
      description: "Advanced features for serious traders",
      buttonText: "Start 7-Day Free Trial",
      featured: true,
      features: [
        { name: "Unlimited Trading Accounts", included: "yes" as const },
        { name: "Unlimited Strategies", included: "yes" as const },
        { name: "Trade Journaling", included: "yes" as const },
        { name: "Daily Performance Insights", included: "yes" as const },
        { name: "Notes & Image Uploads", included: "yes" as const },
        { name: "Linked Trades to Journal Entries", included: "yes" as const },
        { name: "Automated Price Chart (TradingView)", included: "yes" as const },
        { name: "Strategy Backtesting", included: "coming" as const },
        { name: "Trade Replay & Visualization", included: "coming" as const },
      ],
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      {/* Navigation header */}
      <header className="w-full py-4 px-6 flex justify-between items-center border-b">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">TradeLens</h1>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/dashboard" className="text-foreground/80 hover:text-foreground transition-colors">
            Dashboard
          </Link>
          <Link to="/trades" className="text-foreground/80 hover:text-foreground transition-colors">
            Trades
          </Link>
          <Link to="/strategies" className="text-foreground/80 hover:text-foreground transition-colors">
            Strategies
          </Link>
          <Link to="/journal" className="text-foreground/80 hover:text-foreground transition-colors">
            Journal
          </Link>
          <Link to="/pricing" className="text-foreground/80 hover:text-foreground transition-colors">
            Pricing
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link to="/auth">Login</Link>
          </Button>
          <Button asChild>
            <Link to="/auth">Sign Up</Link>
          </Button>
        </div>
      </header>

      <div className="container max-w-6xl py-12 md:py-24">
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Pricing Plans</h1>
          <p className="text-xl text-muted-foreground max-w-prose mx-auto">
            Choose the perfect plan for your trading journey. All plans include a 7-day free trial.
          </p>
          <div className="mx-auto mt-8 max-w-max rounded-full bg-green-50 px-4 py-2 text-center text-green-700 ring-1 ring-inset ring-green-600/20">
            <span className="font-medium">✅ 7-Day Free Trial</span> for All New Users!
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {tiers.map((tier) => (
            <PricingTier key={tier.name} {...tier} />
          ))}
        </div>

        <div className="mt-16 text-center space-y-4 border-t pt-16">
          <div className="bg-card border rounded-lg p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">🎁 Free 7-Day Trial</h2>
            <p className="text-lg mb-4">
              Get full access to Elite Trader for 7 days.
            </p>
            <ul className="text-left space-y-2 mb-6">
              <li className="flex items-center">
                <Check className="mr-2 h-5 w-5 text-green-500" />
                No credit card required
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-5 w-5 text-green-500" />
                Full access to all features
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-5 w-5 text-green-500" />
                Upgrade anytime!
              </li>
            </ul>
            <Button size="lg" asChild>
              <Link to="/auth">Start Your Free Trial</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 px-6 border-t mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            © 2023 TradeLens. All rights reserved.
          </p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
              Terms
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
              Privacy
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Pricing;
