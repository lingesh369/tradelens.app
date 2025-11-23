
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SubscriptionPlan } from "@/types/subscription";
import { InfoIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CheckoutSummaryProps {
  plan: SubscriptionPlan | null;
  isYearly: boolean;
  paymentMethod: string;
  promoDiscount: number;
  onPlanChange?: (planId: string, isYearly: boolean) => void;
  availablePlans?: SubscriptionPlan[];
  appliedCoupon?: {
    code: string;
    name: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
  } | null;
  couponDiscount?: {
    amount: number;
    type: 'percentage' | 'fixed';
    value: number;
  } | null;
  finalAmount?: number | null;
}

export default function CheckoutSummary({ 
  plan, 
  isYearly, 
  paymentMethod, 
  promoDiscount,
  onPlanChange,
  availablePlans = [],
  appliedCoupon,
  couponDiscount,
  finalAmount
}: CheckoutSummaryProps) {
  if (!plan) {
    return (
      <Card className="sticky top-6">
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
          <CardDescription>Loading plan details...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-8 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Determine currency based on payment method - UPI and Cashfree should show INR
  const currency = (paymentMethod === "upi" || paymentMethod === "cashfree") ? "INR" : "USD";
  
  // Calculate amounts - Updated pricing for one-time payments
  const basePrice = isYearly ? plan.yearly_price : plan.monthly_price;
  const exchangeRate = 85; // 1 USD = 85 INR
  
  // Get the displayed price in the selected currency (this is what shows in "Plan Price")
  const displayedPlanPrice = currency === "USD" ? basePrice : basePrice * exchangeRate;
  
  // Check if crypto processing fee applies
  const isStarterPlan = plan.name.toLowerCase().includes('starter');
  const isCryptoPayment = paymentMethod === "crypto";
  const isMonthly = !isYearly;
  const needsCryptoProcessingFee = isStarterPlan && isCryptoPayment && isMonthly && basePrice < 11;
  const cryptoProcessingFee = needsCryptoProcessingFee ? (currency === "USD" ? (11 - basePrice) : (11 - basePrice) * exchangeRate) : 0;
  
  // Calculate subtotal (plan price + any fees)
  const subtotal = displayedPlanPrice + cryptoProcessingFee;
  
  // Calculate coupon discount based on the displayed plan price
  let couponDiscountAmount = 0;
  let couponDiscountDisplay = "";
  
  if (appliedCoupon && couponDiscount) {
    if (couponDiscount.type === 'percentage') {
      // Apply percentage discount to the displayed plan price
      couponDiscountAmount = (displayedPlanPrice * couponDiscount.value) / 100;
      couponDiscountDisplay = `${couponDiscount.value}% Discount (${appliedCoupon.code})`;
    } else {
      // Fixed amount discount - convert to display currency if needed
      couponDiscountAmount = currency === "USD" ? couponDiscount.value : couponDiscount.value * exchangeRate;
      const currencySymbol = currency === "USD" ? "$" : "₹";
      couponDiscountDisplay = `${currencySymbol}${couponDiscountAmount.toLocaleString()} Discount (${appliedCoupon.code})`;
    }
  }
  
  // Calculate final total
  const finalTotal = subtotal - couponDiscountAmount;
  
  // Format currency
  const currencySymbol = currency === "USD" ? "$" : "₹";
  const formatPrice = (amount: number) => {
    return `${currencySymbol}${amount.toLocaleString(undefined, {
      minimumFractionDigits: currency === "INR" ? 0 : 2,
      maximumFractionDigits: currency === "INR" ? 0 : 2
    })}`;
  };

  // Filter out Free Trial plans and generate plan options for dropdown
  const filteredPlans = availablePlans.filter(p => p.name !== 'Free Trial');
  const planOptions = filteredPlans.flatMap(p => [
    { value: `${String(p.plan_id || p.id)}-monthly`, label: `${p.name} - 1 Month Access`, planId: String(p.plan_id || p.id), isYearly: false },
    { value: `${String(p.plan_id || p.id)}-yearly`, label: `${p.name} - 1 Year Access`, planId: String(p.plan_id || p.id), isYearly: true }
  ]);

  const currentPlanValue = `${String(plan.plan_id || plan.id)}-${isYearly ? 'yearly' : 'monthly'}`;

  const handlePlanChange = (value: string) => {
    const option = planOptions.find(opt => opt.value === value);
    if (option && onPlanChange) {
      onPlanChange(option.planId, option.isYearly);
    }
  };

  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
        <CardDescription>Review your one-time payment details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Plan selection dropdown */}
        {onPlanChange && planOptions.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Selected Plan</label>
            <Select value={currentPlanValue} onValueChange={handlePlanChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a plan" />
              </SelectTrigger>
              <SelectContent>
                {planOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Plan details */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-foreground">Current Plan</h3>
            <span className="text-lg font-semibold text-foreground">{plan.name}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Access Duration</span>
            <span>{isYearly ? "1 Year" : "1 Month"}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Payment Type</span>
            <span className="font-medium text-primary">One-Time Payment</span>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Currency</span>
            <span>{currency === "USD" ? "US Dollar (USD)" : "Indian Rupee (INR)"}</span>
          </div>
        </div>
        
        <Separator />
        
        {/* Pricing details */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-foreground">
            <span>Plan Price</span>
            <span>{formatPrice(displayedPlanPrice)}</span>
          </div>
          
          {/* Show crypto processing fee if applicable */}
          {needsCryptoProcessingFee && (
            <div className="flex items-center justify-between text-foreground">
              <span className="text-sm">Crypto Network Processing Fee</span>
              <span>{formatPrice(cryptoProcessingFee)}</span>
            </div>
          )}
          
          {/* Show coupon discount if applied */}
          {appliedCoupon && couponDiscountAmount > 0 && (
            <div className="flex items-center justify-between text-green-600 dark:text-green-400">
              <span>{couponDiscountDisplay}</span>
              <span>-{formatPrice(couponDiscountAmount)}</span>
            </div>
          )}
          
          {promoDiscount > 0 && !appliedCoupon && (
            <div className="flex items-center justify-between text-green-600">
              <span>Discount ({promoDiscount}%)</span>
              <span>-{formatPrice((displayedPlanPrice * promoDiscount) / 100)}</span>
            </div>
          )}
        </div>
        
        <Separator />
        
        {/* Total */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Total Amount</h3>
          <span className="text-xl font-bold text-foreground">{formatPrice(finalTotal)}</span>
        </div>
        
        {/* Billing note */}
        <div className="flex items-start gap-2 rounded-md bg-primary/5 p-3 text-sm">
          <InfoIcon className="h-5 w-5 flex-shrink-0 text-primary" />
          <p className="text-muted-foreground">
            <strong>One-Time Payment:</strong> You'll be charged {formatPrice(finalTotal)} once for {isYearly ? "1 year" : "1 month"} of access.
            {isYearly && ` This saves you ${Math.round(100 - (plan.yearly_price / (plan.monthly_price * 12)) * 100)}% compared to monthly purchases.`}
            {needsCryptoProcessingFee && (
              <span className="block mt-1 text-xs text-orange-600">
                <strong>Note:</strong> A processing fee is applied to meet the minimum requirement for crypto payments.
              </span>
            )}
            {appliedCoupon && (
              <span className="block mt-1 text-xs text-green-600">
                <strong>Coupon Applied:</strong> {appliedCoupon.name} discount has been applied to your order.
              </span>
            )}
            <br />
            <span className="text-xs mt-1 block">No automatic renewals - you can manually re-purchase when your access expires.</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
