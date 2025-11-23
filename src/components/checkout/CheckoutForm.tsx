import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import PaymentOptions from "./PaymentOptions";
import UpiPaymentFlow from "./UpiPaymentFlow";
import CryptoPaymentFlow from "./CryptoPaymentFlow";
import CashfreePaymentFlow from "./CashfreePaymentFlow";
import PayPalCheckout from "./PayPalCheckout";
import { CouponInput } from "./CouponInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useCoupon } from "@/hooks/useCoupon";

interface CheckoutFormProps {
  user: User;
  selectedPlan: string | null;
  isYearly: boolean;
  planDetails: any;
  onPaymentMethodChange: (method: string) => void;
  onStageChange?: (stage: number) => void;
  onCouponChange?: (couponData: any) => void;
}

export default function CheckoutForm({
  user,
  selectedPlan,
  isYearly,
  planDetails,
  onPaymentMethodChange,
  onStageChange,
  onCouponChange
}: CheckoutFormProps) {
  const [activePaymentMethod, setActivePaymentMethod] = useState("paypal");
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.user_metadata?.phone || "");
  const { toast } = useToast();
  
  const {
    appliedCoupon,
    couponDiscount,
    isValidating,
    finalAmount,
    validateCoupon,
    removeCoupon,
    resetCoupon
  } = useCoupon();

  const handleMethodChange = (method: string) => {
    setActivePaymentMethod(method);
    onPaymentMethodChange(method);
  };

  const handlePaymentComplete = () => {
    if (onStageChange) {
      onStageChange(3);
    }
    
    toast({
      title: "Payment Successful",
      description: "Your subscription has been activated!",
    });
  };

  const handleProceedToPayment = () => {
    if (!fullName.trim() || !email.trim() || (activePaymentMethod === "cashfree" && !phoneNumber.trim())) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    console.log("Processing payment with method:", activePaymentMethod);
  };

  const baseAmount = isYearly ? planDetails?.yearly_price : planDetails?.monthly_price;
  const currency = (activePaymentMethod === "upi" || activePaymentMethod === "cashfree") ? "INR" : "USD";
  const exchangeRate = 85;
  
  const displayedPlanPrice = currency === "USD" ? baseAmount : baseAmount * exchangeRate;
  
  const isStarterPlan = planDetails?.name?.toLowerCase().includes('starter');
  const isCryptoPayment = activePaymentMethod === "crypto";
  const isMonthly = !isYearly;
  const needsCryptoProcessingFee = isStarterPlan && isCryptoPayment && isMonthly && baseAmount < 11;
  
  const cryptoProcessingFee = needsCryptoProcessingFee ? 
    (currency === "USD" ? (11 - baseAmount) : (11 - baseAmount) * exchangeRate) : 0;
  
  const subtotal = displayedPlanPrice + cryptoProcessingFee;
  
  let couponDiscountAmount = 0;
  if (appliedCoupon && couponDiscount) {
    if (couponDiscount.type === 'percentage') {
      couponDiscountAmount = (displayedPlanPrice * couponDiscount.value) / 100;
    } else {
      couponDiscountAmount = currency === "USD" ? couponDiscount.value : couponDiscount.value * exchangeRate;
    }
  }
  
  const finalTotal = subtotal - couponDiscountAmount;

  const billingCycle = isYearly ? "yearly" : "monthly";

  const handleApplyCoupon = async (couponCode: string) => {
    if (!selectedPlan || !user?.id) {
      toast({
        title: "Error",
        description: "Missing plan or user information",
        variant: "destructive"
      });
      return;
    }

    await validateCoupon(couponCode, selectedPlan, user.id, displayedPlanPrice, currency);
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
  };

  useEffect(() => {
    if (onCouponChange) {
      onCouponChange({
        appliedCoupon,
        couponDiscount,
        finalAmount: finalTotal
      });
    }
  }, [appliedCoupon, couponDiscount, finalTotal, onCouponChange]);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium mb-4">Contact Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phoneNumber">
            Phone Number{activePaymentMethod === "cashfree" ? " *" : ""}
          </Label>
          <Input
            id="phoneNumber"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Enter your phone number"
            required={activePaymentMethod === "cashfree"}
          />
        </div>
      </div>

      <CouponInput
        onApplyCoupon={handleApplyCoupon}
        onRemoveCoupon={handleRemoveCoupon}
        appliedCoupon={appliedCoupon}
        couponDiscount={couponDiscount}
        isValidating={isValidating}
        originalAmount={displayedPlanPrice}
        finalAmount={finalTotal}
        currency={currency}
      />

      <PaymentOptions
        activeMethod={activePaymentMethod}
        onMethodChange={handleMethodChange}
        userDetails={{ fullName, email, phoneNumber }}
        planId={selectedPlan || ""}
        amount={finalTotal || 0}
      />

      <div className="space-y-4">
        {activePaymentMethod === "paypal" && (
          <PayPalCheckout
            planId={selectedPlan || ""}
            amount={finalTotal || 0}
            billingCycle={billingCycle}
            onSuccess={handlePaymentComplete}
            onError={(error) => {
              toast({
                title: "Payment Error",
                description: error,
                variant: "destructive"
              });
            }}
            couponData={appliedCoupon ? {
              id: appliedCoupon.id,
              code: appliedCoupon.code,
              discountAmount: couponDiscountAmount
            } : undefined}
          />
        )}

        {activePaymentMethod === "crypto" && (
          <CryptoPaymentFlow
            planId={selectedPlan || ""}
            billingCycle={billingCycle}
            amount={finalTotal || 0}
            userDetails={{
              fullName,
              email,
              phoneNumber
            }}
            onPaymentComplete={handlePaymentComplete}
            onStageChange={onStageChange}
            couponData={appliedCoupon ? {
              id: appliedCoupon.id,
              code: appliedCoupon.code,
              discountAmount: couponDiscountAmount
            } : undefined}
          />
        )}

        {activePaymentMethod === "upi" && (
          <UpiPaymentFlow
            planId={selectedPlan || ""}
            billingCycle={billingCycle}
            amount={finalTotal || 0}
            userDetails={{
              fullName,
              email,
              phoneNumber
            }}
            onPaymentComplete={handlePaymentComplete}
            onStageChange={onStageChange}
            planDetails={planDetails}
            couponData={appliedCoupon ? {
              id: appliedCoupon.id,
              code: appliedCoupon.code,
              discountAmount: couponDiscountAmount
            } : undefined}
          />
        )}

        {activePaymentMethod === "cashfree" && (
          <CashfreePaymentFlow
            planId={selectedPlan || ""}
            billingCycle={billingCycle}
            amount={finalTotal || 0}
            userDetails={{
              fullName,
              email,
              phoneNumber
            }}
            onPaymentComplete={handlePaymentComplete}
            onStageChange={onStageChange}
            planDetails={planDetails}
            couponData={appliedCoupon ? {
              id: appliedCoupon.id,
              code: appliedCoupon.code,
              discountAmount: couponDiscountAmount
            } : undefined}
          />
        )}

        {!["paypal", "crypto", "upi", "cashfree"].includes(activePaymentMethod) && (
          <Button 
            onClick={handleProceedToPayment}
            className="w-full"
            size="lg"
            disabled={isValidating}
          >
            {isValidating ? "Validating coupon..." : "Proceed to Payment"}
          </Button>
        )}
      </div>
    </div>
  );
}
