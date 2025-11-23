
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import { openUpgradePage } from "@/lib/subscription-utils";

export function TrialBanner() {
  const { calculateDaysLeftInTrial } = useSubscription();
  const daysLeft = calculateDaysLeftInTrial();

  return (
    <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
      <AlertDescription className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="font-medium">Free Trial: </span>
          {daysLeft > 0 ? (
            <span>You have {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left in your trial.</span>
          ) : (
            <span>Your free trial has ended.</span>
          )}
        </div>
        <Button 
          size="sm" 
          className="whitespace-nowrap" 
          onClick={openUpgradePage}
        >
          Upgrade Now
        </Button>
      </AlertDescription>
    </Alert>
  );
}
