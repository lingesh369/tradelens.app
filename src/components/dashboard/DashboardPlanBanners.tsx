
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExpiredAlert } from "@/components/subscription/ExpiredAlert";
import { Calendar, CreditCard, X } from "lucide-react";
import { PlanInfo } from "@/hooks/usePlanInfo";

interface DashboardPlanBannersProps {
  planInfo: PlanInfo | null;
  onUpgrade: () => void;
}

export function DashboardPlanBanners({ planInfo, onUpgrade }: DashboardPlanBannersProps) {
  const [showStarterCard, setShowStarterCard] = useState(true);

  const handleCloseStarterCard = () => {
    setShowStarterCard(false);
  };

  // Check if we should show starter card (only 7 days before expiry and user is not on Free Trial)
  const shouldShowStarterCard = showStarterCard && 
    planInfo?.name !== 'Free Trial' && 
    planInfo?.name !== 'Pro' && 
    planInfo?.name !== 'Admin' && 
    planInfo?.daysLeft <= 7 && 
    planInfo?.daysLeft > 0;

  // Always show expired alert if subscription is expired, regardless of plan name
  if (planInfo?.isExpired) {
    return (
      <div className="mb-4 md:mb-6">
        <ExpiredAlert onUpgrade={onUpgrade} />
      </div>
    );
  }

  // Only show Free Trial banner if it's not expired
  if (planInfo?.name === 'Free Trial' && !planInfo.isExpired) {
    return (
      <Card className="mb-4 md:mb-6 border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-900">
        <CardContent className="p-4 md:pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 md:h-5 md:w-5" />
              7-Day Free Trial
            </h3>
            <p className="text-muted-foreground text-sm">
              {planInfo.daysLeft > 0 
                ? `${planInfo.daysLeft} ${planInfo.daysLeft === 1 ? 'day' : 'days'} left in your trial.`
                : 'Your free trial has ended.'
              }
            </p>
          </div>
          <Button onClick={onUpgrade} className="w-full sm:w-auto text-sm">
            Upgrade Now
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (shouldShowStarterCard) {
    return (
      <Card className="mb-4 md:mb-6 border-primary/50 bg-primary/5 relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6 rounded-full"
          onClick={handleCloseStarterCard}
        >
          <X className="h-4 w-4" />
        </Button>
        <CardContent className="p-4 md:pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pr-12">
          <div>
            <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
              <CreditCard className="h-4 w-4 md:h-5 md:w-5" />
              {planInfo?.name || 'Starter'} Plan
            </h3>
            <p className="text-muted-foreground text-sm">
              {planInfo?.daysLeft && planInfo.daysLeft > 0 
                ? `${planInfo.daysLeft} ${planInfo.daysLeft === 1 ? 'day' : 'days'} left until expiry. Upgrade for additional features.`
                : 'Upgrade for additional features.'
              }
            </p>
          </div>
          <Button onClick={onUpgrade} className="w-full sm:w-auto text-sm">
            Upgrade Now
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
}
