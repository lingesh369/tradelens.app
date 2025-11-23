
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PricingFeature {
  name: string;
  included: boolean;
}

interface PricingPlanProps {
  name: string;
  price: number;
  description: string;
  featured?: boolean;
  features: PricingFeature[];
  buttonText?: string;
  className?: string;
}

export function PricingPlan({
  name,
  price,
  description,
  featured = false,
  features,
  buttonText = "Get Started",
  className,
}: PricingPlanProps) {
  return (
    <div
      className={cn(
        "glass-card rounded-xl overflow-hidden transition-all duration-300 border",
        featured
          ? "border-primary shadow-lg scale-[1.02]"
          : "border-border hover:border-primary/50",
        className
      )}
    >
      <div className="p-6">
        {featured && (
          <div className="py-1 px-3 -mt-6 -mx-6 mb-6 bg-primary text-primary-foreground text-sm font-medium text-center">
            Most Popular
          </div>
        )}
        
        <h3 className="text-xl font-bold">{name}</h3>
        <div className="mt-4 flex items-baseline">
          <span className="text-4xl font-extrabold">${price}</span>
          <span className="ml-1 text-muted-foreground">/month</span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        
        <Button
          className={cn("mt-6 w-full", featured ? "bg-primary" : "")}
          variant={featured ? "default" : "outline"}
          size="lg"
        >
          {buttonText}
        </Button>
      </div>
      
      <div className="px-6 pt-4 pb-8">
        <h4 className="text-sm font-medium text-muted-foreground mb-4">What's included:</h4>
        <ul className="space-y-3">
          {features.map((feature, i) => (
            <li key={i} className="flex items-start">
              {feature.included ? (
                <Check className="h-5 w-5 text-[hsl(var(--profit))] flex-shrink-0 mr-2" />
              ) : (
                <X className="h-5 w-5 text-muted-foreground flex-shrink-0 mr-2" />
              )}
              <span className={!feature.included ? "text-muted-foreground" : ""}>
                {feature.name}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
