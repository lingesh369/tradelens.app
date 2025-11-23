
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react";

type PlanFeature = {
  name: string;
  starterIncluded: boolean;
  proIncluded: boolean;
  eliteIncluded: boolean;
  comingSoon?: boolean;
};

const PricingSection = () => {
  const features: PlanFeature[] = [
    { name: "Trading Accounts", starterIncluded: true, proIncluded: true, eliteIncluded: true },
    { name: "Strategies", starterIncluded: true, proIncluded: true, eliteIncluded: true },
    { name: "Unlimited Trades", starterIncluded: true, proIncluded: true, eliteIncluded: true },
    { name: "CSV Imports", starterIncluded: true, proIncluded: true, eliteIncluded: true },
    { name: "Broker Sync", starterIncluded: false, proIncluded: true, eliteIncluded: true, comingSoon: true },
    { name: "Secure Data Storage", starterIncluded: true, proIncluded: true, eliteIncluded: true },
    { name: "Basic Analytics", starterIncluded: true, proIncluded: true, eliteIncluded: true },
    { name: "Advanced Analytics", starterIncluded: false, proIncluded: true, eliteIncluded: true },
    { name: "Automatic Price Chart", starterIncluded: false, proIncluded: true, eliteIncluded: true },
    { name: "Replay Your Trades", starterIncluded: false, proIncluded: false, eliteIncluded: true },
    { name: "AI-Powered Insights", starterIncluded: false, proIncluded: false, eliteIncluded: true },
  ];

  return (
    <div>
      {/* Header */}
      <section className="py-20 bg-gradient-to-b from-background to-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">🚀 TradeLens Pricing Plans</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powerful Trading Insights, Tailored for Every Trader!
          </p>
        </div>
      </section>

      {/* Free Trial Banner */}
      <section className="py-8 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-primary-foreground mb-2">🎁 Free 7-Day Trial for All New Users!</h2>
          <p className="text-primary-foreground/90">
            Try all features free for 7 days. No credit card required.
          </p>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Starter Plan */}
            <div className="border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="p-6 bg-muted/30">
                <h3 className="text-2xl font-bold">1️⃣ Starter</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold">$9</span>
                  <span className="text-xl">/month</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">or $90/year – Save 17% 🎉</p>
                
                <div className="mt-6">
                  <Link to="/auth">
                    <Button className="w-full group">
                      Start Free Trial
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </div>
              </div>
              
              <div className="p-6">
                <div className="mb-4">
                  <div className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="text-green-500 h-5 w-5" />
                    1 Trading Account
                  </div>
                </div>
                <div className="mb-4">
                  <div className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="text-green-500 h-5 w-5" />
                    Up to 3 Strategies
                  </div>
                </div>
                <div className="mb-4">
                  <div className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="text-green-500 h-5 w-5" />
                    1GB Secure Data Storage
                  </div>
                </div>
                
                <div className="space-y-3 mt-6">
                  {features.slice(2).map((feature, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {feature.starterIncluded ? (
                        <CheckCircle2 className="text-green-500 h-5 w-5 flex-shrink-0" />
                      ) : (
                        <XCircle className="text-muted-foreground h-5 w-5 flex-shrink-0" />
                      )}
                      <span className={!feature.starterIncluded ? "text-muted-foreground" : ""}>
                        {feature.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Pro Plan */}
            <div className="border-2 border-primary rounded-xl overflow-hidden shadow-md relative">
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                POPULAR
              </div>
              
              <div className="p-6 bg-primary/10">
                <h3 className="text-2xl font-bold">2️⃣ Pro</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold">$29</span>
                  <span className="text-xl">/month</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">or $290/year – Save 17% 🎉</p>
                <p className="mt-2 text-sm font-medium text-primary">🔥 Perfect for active traders!</p>
                
                <div className="mt-6">
                  <Link to="/auth">
                    <Button className="w-full group">
                      Start Free Trial
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </div>
              </div>
              
              <div className="p-6">
                <div className="mb-4">
                  <div className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="text-green-500 h-5 w-5" />
                    Up to 5 Trading Accounts
                  </div>
                </div>
                <div className="mb-4">
                  <div className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="text-green-500 h-5 w-5" />
                    Up to 10 Trading Strategies
                  </div>
                </div>
                <div className="mb-4">
                  <div className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="text-green-500 h-5 w-5" />
                    5GB Secure Data Storage
                  </div>
                </div>
                
                <div className="space-y-3 mt-6">
                  {features.slice(2).map((feature, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {feature.proIncluded ? (
                        <CheckCircle2 className="text-green-500 h-5 w-5 flex-shrink-0" />
                      ) : (
                        <XCircle className="text-muted-foreground h-5 w-5 flex-shrink-0" />
                      )}
                      <span className={!feature.proIncluded ? "text-muted-foreground" : ""}>
                        {feature.name}
                        {feature.comingSoon && feature.proIncluded && (
                          <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full">
                            Coming Soon
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Elite Plan */}
            <div className="border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="p-6 bg-muted/30">
                <h3 className="text-2xl font-bold">3️⃣ Elite</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold">$39</span>
                  <span className="text-xl">/month</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">or $390/year – Save 17% 🎉</p>
                <p className="mt-2 text-sm font-medium">💎 The Ultimate Trading Journal!</p>
                
                <div className="mt-6">
                  <Link to="/auth">
                    <Button className="w-full group">
                      Start Free Trial
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </div>
              </div>
              
              <div className="p-6">
                <div className="mb-4">
                  <div className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="text-green-500 h-5 w-5" />
                    Unlimited Trading Accounts
                  </div>
                </div>
                <div className="mb-4">
                  <div className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="text-green-500 h-5 w-5" />
                    Unlimited Strategies
                  </div>
                </div>
                <div className="mb-4">
                  <div className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="text-green-500 h-5 w-5" />
                    Full Secure Data Storage
                  </div>
                </div>
                
                <div className="space-y-3 mt-6">
                  {features.slice(2).map((feature, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {feature.eliteIncluded ? (
                        <CheckCircle2 className="text-green-500 h-5 w-5 flex-shrink-0" />
                      ) : (
                        <XCircle className="text-muted-foreground h-5 w-5 flex-shrink-0" />
                      )}
                      <span className={!feature.eliteIncluded ? "text-muted-foreground" : ""}>
                        {feature.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Yearly Savings */}
      <section className="py-8 bg-muted/30 rounded-lg mx-4 my-8">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">📢 Save With Annual Plans</h2>
          <p className="text-lg mb-4">
            Yearly plan saves you 17%—it's like getting 2 months FREE!
          </p>
          <Link to="/auth">
            <Button size="lg" className="group">
              Start Your Free Trial Today
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default PricingSection;
