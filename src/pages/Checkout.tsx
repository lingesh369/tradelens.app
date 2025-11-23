
import { useState, useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import CheckoutForm from "@/components/checkout/CheckoutForm";
import CheckoutSuccess from "@/components/checkout/CheckoutSuccess";
import CheckoutLoader from "@/components/checkout/CheckoutLoader";
import CheckoutSummary from "@/components/checkout/CheckoutSummary";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Checkout() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { plans, isLoadingPlans } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isYearly, setIsYearly] = useState<boolean>(false);
  const [step, setStep] = useState(1);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("paypal");
  
  // Coupon state
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponDiscount, setCouponDiscount] = useState<any>(null);
  const [finalAmount, setFinalAmount] = useState<number | null>(null);
  
  // Get status from URL for return from payment provider
  const status = searchParams.get("status");
  const source = searchParams.get("source");
  
  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    // Check if returning from payment gateway
    if (status === "success" && source === "paypal") {
      setStep(3); // Payment success step
      return;
    }
    
    // Get selected plan from location state or localStorage
    const planFromState = location.state?.plan;
    const isYearlyFromState = location.state?.isYearly;
    const savedPlan = localStorage.getItem("selectedPlan");
    const savedBillingCycle = localStorage.getItem("billingCycle");
    
    if (planFromState) {
      setSelectedPlan(planFromState);
      setIsYearly(isYearlyFromState || false);
      
      // Save to localStorage
      localStorage.setItem("selectedPlan", planFromState);
      localStorage.setItem("billingCycle", isYearlyFromState ? "yearly" : "monthly");
    } else if (savedPlan) {
      setSelectedPlan(savedPlan);
      setIsYearly(savedBillingCycle === "yearly");
    } else {
      // No plan selected, redirect to subscription page
      navigate("/subscription");
    }
  }, [user, location, navigate, status, source]);

  const handlePaymentMethodChange = (paymentMethod: string) => {
    setSelectedPaymentMethod(paymentMethod);
  };

  const handlePlanChange = (planId: string, yearly: boolean) => {
    setSelectedPlan(planId);
    setIsYearly(yearly);
    
    // Reset coupon when plan changes
    setAppliedCoupon(null);
    setCouponDiscount(null);
    setFinalAmount(null);
    
    // Update localStorage
    localStorage.setItem("selectedPlan", planId);
    localStorage.setItem("billingCycle", yearly ? "yearly" : "monthly");
  };

  const handleStageChange = (newStep: number) => {
    setStep(newStep);
  };

  const handleCouponChange = (couponData: any) => {
    setAppliedCoupon(couponData.appliedCoupon);
    setCouponDiscount(couponData.couponDiscount);
    setFinalAmount(couponData.finalAmount);
  };
  
  // Get the selected plan details
  const planDetails = plans.find(p => p.plan_id === selectedPlan) || null;
  
  // Show loader while waiting for user or plan data
  if (isLoadingPlans || !user) {
    return <CheckoutLoader message="Loading checkout..." />;
  }

  // If plans are loaded but no plan is found, redirect to subscription
  if (!isLoadingPlans && selectedPlan && !planDetails) {
    navigate("/subscription");
    return null;
  }
  
  // Show payment success or checkout form
  if (step === 3 && status === "success" && source) {
    return (
      <Layout title="Checkout">
        <div className="container mx-auto px-4 py-6">
          <CheckoutSuccess source={source} />
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout title="Checkout">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Button 
            variant="outline" 
            size="sm" 
            className="mb-4"
            onClick={() => navigate("/subscription")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Subscription
          </Button>
          
          <h1 className="text-3xl font-bold">Checkout</h1>
          <p className="text-muted-foreground">Complete your subscription purchase</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Complete Your Purchase</CardTitle>
                <CardDescription>
                  Please provide your details to complete your subscription
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CheckoutForm 
                  user={user}
                  selectedPlan={selectedPlan}
                  isYearly={isYearly}
                  planDetails={planDetails}
                  onPaymentMethodChange={handlePaymentMethodChange}
                  onStageChange={handleStageChange}
                  onCouponChange={handleCouponChange}
                />
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-1">
            <CheckoutSummary 
              plan={planDetails}
              isYearly={isYearly}
              paymentMethod={selectedPaymentMethod}
              promoDiscount={0}
              onPlanChange={handlePlanChange}
              availablePlans={plans}
              appliedCoupon={appliedCoupon}
              couponDiscount={couponDiscount}
              finalAmount={finalAmount}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}
