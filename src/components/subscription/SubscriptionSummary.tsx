
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSubscription } from "@/hooks/useSubscription";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export function SubscriptionSummary() {
  const { 
    userSubscription, 
    isLoadingSubscription, 
    isProcessing, 
    cancelSubscription 
  } = useSubscription();

  if (isLoadingSubscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Subscription</CardTitle>
          <CardDescription>Loading your subscription details...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!userSubscription || !userSubscription.plan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Subscription</CardTitle>
          <CardDescription>You don't have an active subscription.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Subscribe to a plan to get access to premium features.</p>
        </CardContent>
        <CardFooter>
          <Button>Subscribe Now</Button>
        </CardFooter>
      </Card>
    );
  }

  const plan = userSubscription.plan;
  const isTrial = userSubscription.status === "trialing";
  const cycleType = userSubscription.billing_cycle;
  const formattedEndDate = userSubscription.end_date 
    ? format(new Date(userSubscription.end_date), "PPP") 
    : "N/A";

  const handleCancel = () => {
    cancelSubscription.mutate();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Your Subscription</CardTitle>
            <CardDescription>Current plan and billing details</CardDescription>
          </div>
          <div className="px-2 py-1 bg-primary/10 text-primary rounded-md text-sm font-medium">
            {isTrial ? "Free Trial" : userSubscription.status === "expired" ? "Expired" : "Active"}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-1">
          <h3 className="text-lg font-medium">{plan.name} Plan</h3>
          <p className="text-sm text-muted-foreground">{plan.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground">Billing Cycle</h4>
            <p className="font-medium capitalize">{cycleType}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-muted-foreground">
              {isTrial ? "Trial Ends" : "Next Billing Date"}
            </h4>
            <p className="font-medium">{formattedEndDate}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-muted-foreground">Amount</h4>
            <p className="font-medium">
              ${cycleType === "monthly" ? plan.monthly_price : plan.yearly_price}
              /{cycleType === "monthly" ? 'month' : 'year'}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
            <p className="font-medium">{isTrial ? "Free Trial" : userSubscription.status === "expired" ? "Expired" : "Active"}</p>
          </div>
        </div>

        <div className="rounded-md bg-muted p-4">
          <h4 className="text-sm font-medium mb-2">Plan Features</h4>
          <ul className="space-y-1 text-sm">
            <li>• {plan.features?.trading_accounts === -1 ? "Unlimited" : plan.features?.trading_accounts || plan.trading_account_limit} Trading Accounts</li>
            <li>• {plan.features?.strategies === -1 ? "Unlimited" : plan.features?.strategies || plan.trading_strategy_limit} Strategies</li>
            <li>• {plan.features?.data_storage || "Standard"} Storage</li>
            {(plan.features?.advanced_analytics || plan.analytics_other_access) && <li>• Advanced Analytics</li>}
            {(plan.features?.automatic_price_chart || plan.analytics_overview_access) && <li>• Automatic Price Charts</li>}
            {plan.features?.trade_replay && <li>• Trade Replay</li>}
            {plan.features?.ai_insights && <li>• AI-Powered Insights</li>}
          </ul>
        </div>
      </CardContent>
      <CardFooter>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="text-destructive">
              Cancel Subscription
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                {isTrial 
                  ? "Cancelling during your trial will immediately end your access to premium features." 
                  : "Your subscription will remain active until the end of your current billing period."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep my subscription</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancel}
                disabled={isProcessing}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Yes, cancel"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
