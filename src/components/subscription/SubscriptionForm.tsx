
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useSubscription } from "@/hooks/useSubscription";
import { Loader2 } from "lucide-react";
import { BillingCycleToggle } from "./BillingCycleToggle";
import { SubscriptionPlan, SubscriptionFormValues } from "@/types/subscription";
import { useNavigate } from "react-router-dom";

const subscriptionFormSchema = z.object({
  planId: z.string().min(1, "Please select a plan"),
  billingCycle: z.enum(["monthly", "yearly"]),
});

interface SubscriptionFormProps {
  selectedPlanId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function SubscriptionForm({ 
  selectedPlanId,
  onSuccess,
  onCancel
}: SubscriptionFormProps) {
  const navigate = useNavigate();
  const { plans, isLoadingPlans, isProcessing } = useSubscription();
  const [isYearly, setIsYearly] = useState(false);

  const form = useForm<z.infer<typeof subscriptionFormSchema>>({
    resolver: zodResolver(subscriptionFormSchema),
    defaultValues: {
      planId: selectedPlanId || "",
      billingCycle: "monthly",
    },
  });

  function onSubmit(values: z.infer<typeof subscriptionFormSchema>) {
    const subscriptionValues: SubscriptionFormValues = {
      planId: values.planId,
      billingCycle: values.billingCycle
    };
    
    // Instead of using the missing subscribe mutation, navigate to checkout
    navigate("/checkout", {
      state: {
        plan: values.planId,
        isYearly: values.billingCycle === "yearly"
      }
    });
    
    // Call onSuccess if provided
    if (onSuccess) {
      onSuccess();
    }
  }

  // Handle yearly toggle change
  const handleBillingCycleChange = (yearly: boolean) => {
    setIsYearly(yearly);
    form.setValue("billingCycle", yearly ? "yearly" : "monthly");
  };

  if (isLoadingPlans) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex justify-center mb-6">
          <BillingCycleToggle 
            isYearly={isYearly} 
            onChange={handleBillingCycleChange} 
          />
        </div>

        <FormField
          control={form.control}
          name="planId"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Select a Plan</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  {plans.map((plan: SubscriptionPlan) => (
                    <FormItem key={plan.plan_id?.toString() || plan.id.toString()}>
                      <FormControl>
                        <RadioGroupItem
                          value={plan.plan_id?.toString() || plan.id.toString()}
                          id={plan.plan_id?.toString() || plan.id.toString()}
                          className="peer sr-only"
                        />
                      </FormControl>
                      <FormLabel
                        htmlFor={plan.plan_id?.toString() || plan.id.toString()}
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        <div className="text-center mb-3">
                          <div className="text-lg font-semibold">{plan.name}</div>
                          <div className="text-sm text-muted-foreground">{plan.description}</div>
                        </div>
                        <div className="text-2xl font-bold">
                          ${isYearly ? plan.yearly_price : plan.monthly_price}
                          <span className="text-sm font-normal text-muted-foreground">
                            /{isYearly ? 'year' : 'month'}
                          </span>
                        </div>
                      </FormLabel>
                    </FormItem>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormDescription>
                {isYearly
                  ? "Yearly plans are billed annually and save you approximately 2 months worth of subscription fees."
                  : "Monthly plans are billed every month. Consider yearly billing for better savings."}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3 justify-end">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Subscribe Now"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
