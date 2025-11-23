import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExternalLink, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

interface UpiPaymentFlowProps {
  planId: string;
  billingCycle: string;
  amount: number;
  userDetails: {
    fullName: string;
    email: string;
    phoneNumber?: string;
  };
  onPaymentComplete: () => void;
  onStageChange?: (stage: number) => void;
  onBack?: () => void;
  couponData?: {
    id: string;
    code: string;
    discountAmount: number;
  };
  planDetails?: {
    name: string;
    plan_id?: string | number;
  };
}

export default function UpiPaymentFlow({
  planId,
  billingCycle,
  amount,
  userDetails,
  onPaymentComplete,
  onStageChange,
  onBack,
  couponData,
  planDetails
}: UpiPaymentFlowProps) {
  const [orderNumber, setOrderNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'pending'>('idle');
  const [orderNumberError, setOrderNumberError] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Payment links mapping
  const getPaymentLink = () => {
    console.log('Current planId:', planId);
    console.log('Current billingCycle:', billingCycle);
    console.log('Plan details:', planDetails);
    
    const linkMap: { [key: string]: string } = {
      'starter-monthly': 'https://peakify.store/checkout/?add-to-cart=15325',
      'starter-yearly': 'https://peakify.store/checkout/?add-to-cart=15465',
      'pro-monthly': 'https://peakify.store/checkout/?add-to-cart=15514',
      'pro-yearly': 'https://peakify.store/checkout/?add-to-cart=15468'
    };

    // Determine plan type - use planDetails.name if available, otherwise fallback to planId parsing
    let planKey = '';
    
    if (planDetails?.name) {
      const planName = planDetails.name.toLowerCase();
      if (planName.includes('starter')) {
        planKey = 'starter';
      } else if (planName.includes('pro')) {
        planKey = 'pro';
      }
    }
    
    // Fallback to planId parsing if planDetails is not available
    if (!planKey) {
      const normalizedPlanId = planId.toString().toLowerCase();
      if (normalizedPlanId.includes('starter') || normalizedPlanId === '1') {
        planKey = 'starter';
      } else if (normalizedPlanId.includes('pro') || normalizedPlanId === '2') {
        planKey = 'pro';
      } else {
        // Final fallback - default to starter
        planKey = 'starter';
      }
    }

    // Normalize billing cycle
    const normalizedBillingCycle = billingCycle.toString().toLowerCase();
    const cycleKey = normalizedBillingCycle.includes('year') ? 'yearly' : 'monthly';
    
    const mapKey = `${planKey}-${cycleKey}`;
    console.log('Generated map key:', mapKey);
    
    const selectedLink = linkMap[mapKey] || linkMap['starter-monthly'];
    console.log('Selected payment link:', selectedLink);
    return selectedLink;
  };

  // Use the amount directly as passed from parent (already the final total from CheckoutSummary)
  const totalAmount = Math.round(amount);

  // Get plan display name - use planDetails if available
  const getPlanDisplayName = () => {
    if (planDetails?.name) {
      return planDetails.name;
    }
    
    // Fallback to planId parsing
    const normalizedPlanId = planId.toString().toLowerCase();
    if (normalizedPlanId.includes('starter') || normalizedPlanId === '1') {
      return 'Starter';
    } else if (normalizedPlanId.includes('pro') || normalizedPlanId === '2') {
      return 'Pro';
    }
    return 'Starter'; // fallback
  };

  // Validate order number (exactly 5 digits)
  const validateOrderNumber = (value: string): boolean => {
    const pattern = /^\d{5}$/;
    return pattern.test(value);
  };

  const handleOrderNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setOrderNumber(value);

    // Clear error when user starts typing
    if (orderNumberError) {
      setOrderNumberError("");
    }
  };

  const handleConfirmPayment = async () => {
    // Validate order number
    if (!validateOrderNumber(orderNumber)) {
      setOrderNumberError("Please enter a valid order number");
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        throw new Error('User not authenticated');
      }

      // Call the UPI payment processing function
      const { data, error } = await supabase.functions.invoke('process-upi-payment', {
        body: {
          userId: user.data.user.id,
          planId: planId,
          orderNumber: orderNumber.trim(),
          amount: totalAmount,
          billingCycle: billingCycle,
          couponData
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["payment-history"] });
      queryClient.invalidateQueries({ queryKey: ["subscription"] });

      setPaymentStatus(data.status || 'pending');

      // Move to confirmation stage
      if (onStageChange) {
        onStageChange(3);
      }

      const statusMessage = data.status === 'success' 
        ? "Your payment was successful. Your subscription is now active." 
        : "Your payment is being verified. Your subscription is now active. If the payment fails, access will be revoked within 24 hours.";

      toast({
        title: "Payment Confirmed",
        description: statusMessage
      });

    } catch (error) {
      console.error('UPI payment confirmation error:', error);
      toast({
        title: "Error",
        description: error.message || "An error occurred while confirming your payment.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinueToDashboard = () => {
    navigate('/');
  };

  if (paymentStatus !== 'idle') {
    const statusMessage = paymentStatus === 'success' 
      ? "Your payment was successful." 
      : "Your payment is being verified. If the payment fails, access will be revoked within 24 hours.";

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Payment Confirmation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className={paymentStatus === 'success' ? "bg-green-50 border-green-200" : "bg-blue-50 border-blue-200"}>
            <AlertDescription className={paymentStatus === 'success' ? "text-green-800" : "text-blue-800"}>
              <strong>
                {paymentStatus === 'success' ? '✅ Payment Successful' : '⏳ Payment Pending'}
              </strong><br />
              {statusMessage} <strong>Your subscription is now active.</strong>
            </AlertDescription>
          </Alert>
          <Button onClick={handleContinueToDashboard} className="w-full mt-4">
            Continue to Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack} className="p-1 h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <CardTitle>Complete UPI Payment</CardTitle>
        </div>
        <CardDescription>
          Complete your payment through our secure checkout and enter your order number below
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <Button asChild className="w-full" size="lg">
            <a 
              href={getPaymentLink()} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-2"
            >
              Make Payment (₹{totalAmount.toLocaleString()})
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>

          {couponData && (
            <Alert className="bg-orange-50 border-orange-200">
              <AlertDescription className="text-orange-800">
                <strong>Coupon Applied:</strong> Please apply coupon code <strong>{couponData.code}</strong> on the payment page to get your discount.
              </AlertDescription>
            </Alert>
          )}

          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription className="text-blue-800">
              Click the button above to complete your payment. After payment, you'll receive an order number. 
              Enter that number below to confirm your payment.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="orderNumber">Order Number</Label>
            <Input
              id="orderNumber"
              value={orderNumber}
              onChange={handleOrderNumberChange}
              className={orderNumberError ? "border-red-500" : ""}
              maxLength={5}
            />
            {orderNumberError && (
              <p className="text-sm text-red-500">{orderNumberError}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Enter the order number from your payment receipt.
            </p>
          </div>

          <Button
            onClick={handleConfirmPayment}
            disabled={isSubmitting || !orderNumber.trim()}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Confirming Payment...
              </>
            ) : (
              "Confirm Payment"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
