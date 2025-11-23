
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Steps, Step } from "@/components/ui/steps";
import { useSubscription } from "@/hooks/useSubscription";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FormControl, FormItem, FormLabel } from "@/components/ui/form";
import PaymentOptions from "@/components/checkout/PaymentOptions";
import { BillingCycleToggle } from "@/components/subscription/BillingCycleToggle";

export default function DirectPayment() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { plans, isLoadingPlans } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isYearly, setIsYearly] = useState<boolean>(false);
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("paypal");
  
  // Get plan from URL params if available
  useEffect(() => {
    const planFromUrl = searchParams.get("plan");
    const cycleFromUrl = searchParams.get("cycle");
    
    if (planFromUrl) {
      setSelectedPlan(planFromUrl);
    }
    
    if (cycleFromUrl === "yearly") {
      setIsYearly(true);
    }
  }, [searchParams]);
  
  // Get the selected plan details
  const planDetails = plans.find(p => 
    (p.plan_id?.toString() || p.id.toString()) === selectedPlan
  ) || null;
  
  // Handle continue to payment
  const handleContinueToPayment = () => {
    if (!fullName || !email) {
      return;
    }
    
    setStep(2);
  };
  
  // Handle billing cycle change
  const handleBillingCycleChange = (yearly: boolean) => {
    setIsYearly(yearly);
  };
  
  // Show loader while waiting for plan data
  if (isLoadingPlans) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p>Loading available plans...</p>
      </div>
    );
  }

  // Convert plan_id or id to string to ensure type safety
  const getSafePlanId = (plan: any) => {
    return plan.plan_id?.toString() || plan.id.toString();
  };
  
  if (step === 1) {
    return (
      <div className="flex flex-col min-h-screen bg-background p-6">
        <div className="mb-6 max-w-4xl mx-auto w-full">
          <Button 
            variant="outline" 
            size="sm" 
            className="mb-4"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          
          <h1 className="text-3xl font-bold">Direct Payment</h1>
          <p className="text-muted-foreground">Subscribe quickly without creating an account</p>
        </div>
        
        <div className="mb-8 max-w-4xl mx-auto w-full">
          <Steps currentStep={step} className="mb-8">
            <Step title="Select Plan" />
            <Step title="Payment" />
            <Step title="Confirmation" />
          </Steps>
        </div>
        
        <div className="grid grid-cols-1 gap-6 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Choose Your Plan</CardTitle>
              <CardDescription>
                Select a plan and enter your details to proceed to payment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center mb-6">
                <BillingCycleToggle 
                  isYearly={isYearly} 
                  onChange={handleBillingCycleChange} 
                />
              </div>
              
              <div className="space-y-4">
                <Label>Select a Plan</Label>
                <RadioGroup
                  value={selectedPlan || ""}
                  onValueChange={setSelectedPlan}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  {plans.map((plan) => (
                    <FormItem key={getSafePlanId(plan)}>
                      <FormControl>
                        <RadioGroupItem
                          value={getSafePlanId(plan)}
                          id={getSafePlanId(plan)}
                          className="peer sr-only"
                        />
                      </FormControl>
                      <FormLabel
                        htmlFor={getSafePlanId(plan)}
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
              </div>
              
              {selectedPlan && (
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-semibold">Your Information</h3>
                  <div className="grid gap-4">
                    <div className="grid w-full items-center gap-1.5">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        placeholder="Enter your full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="grid w-full items-center gap-1.5">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        We'll use this to send your payment receipt
                      </p>
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <Button 
                      onClick={handleContinueToPayment}
                      disabled={!selectedPlan || !fullName || !email}
                      className="w-full"
                    >
                      Continue to Payment
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-background p-6">
      <div className="mb-6 max-w-4xl mx-auto w-full">
        <Button 
          variant="outline" 
          size="sm" 
          className="mb-4"
          onClick={() => setStep(1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Plan Selection
        </Button>
        
        <h1 className="text-3xl font-bold">Direct Payment</h1>
        <p className="text-muted-foreground">Subscribe quickly without creating an account</p>
      </div>
      
      <div className="mb-8 max-w-4xl mx-auto w-full">
        <Steps currentStep={step} className="mb-8">
          <Step title="Select Plan" />
          <Step title="Payment" />
          <Step title="Confirmation" />
        </Steps>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
              <CardDescription>
                Choose your payment method to complete your subscription
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentOptions
                activeMethod={paymentMethod}
                onMethodChange={setPaymentMethod}
                userDetails={{
                  fullName,
                  email
                }}
                planId={selectedPlan || undefined}
                amount={planDetails ? (isYearly ? planDetails.yearly_price : planDetails.monthly_price) : undefined}
              />
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
              <CardDescription>Subscription details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {planDetails ? (
                <>
                  <div className="space-y-1">
                    <h3 className="font-medium">{planDetails.name} Plan</h3>
                    <p className="text-sm text-muted-foreground">{planDetails.description}</p>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between mb-2">
                      <span>Subscription:</span>
                      <span className="font-medium">
                        ${isYearly ? planDetails.yearly_price : planDetails.monthly_price}
                      </span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span>Billing Cycle:</span>
                      <span>{isYearly ? "Annual" : "Monthly"}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg mt-4">
                      <span>Total:</span>
                      <span>${isYearly ? planDetails.yearly_price : planDetails.monthly_price}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 text-right">
                      {isYearly ? "Billed annually" : "Billed monthly"}
                    </div>
                  </div>
                </>
              ) : (
                <p>Loading plan details...</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
