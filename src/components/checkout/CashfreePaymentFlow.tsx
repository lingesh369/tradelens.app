import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowLeft, CreditCard, IndianRupee } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

interface CashfreePaymentFlowProps {
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

export default function CashfreePaymentFlow({
  planId,
  billingCycle,
  amount,
  userDetails,
  onPaymentComplete,
  onStageChange,
  onBack,
  couponData,
  planDetails
}: CashfreePaymentFlowProps) {
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  // Removed local payment status - always redirect to confirmation page
  const [paymentSessionId, setPaymentSessionId] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [cfOrderId, setCfOrderId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

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

  const createCashfreeOrder = async () => {
    setIsCreatingOrder(true);
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        throw new Error('User not authenticated');
      }

      // Prepare customer details
      const customerDetails = {
        customerId: user.data.user.id,
        customerEmail: userDetails.email,
        customerPhone: userDetails.phoneNumber || '9999999999', // Default phone if not provided
        customerName: userDetails.fullName
      };

      // Call the create-cashfree-order function
      const { data, error } = await supabase.functions.invoke('create-cashfree-order', {
        body: {
          planId: planId,
          billingCycle: billingCycle,
          amount: totalAmount,
          currency: 'INR',
          customerDetails
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      // Debug: Log the complete response from create-cashfree-order
      console.log('Create Cashfree Order Response:', JSON.stringify(data, null, 2));
      console.log('Payment Session ID:', data.paymentSessionId);

      // Validate that we received a payment session ID
      if (!data.paymentSessionId) {
        throw new Error('Payment session ID is missing from the server response. Please try again.');
      }

      // Store order details
      setOrderId(data.orderId); // Store the generated order ID
      setCfOrderId(data.cfOrderId); // Store Cashfree order ID for tracking
      setPaymentSessionId(data.paymentSessionId);

      // Load Cashfree SDK and initiate payment
      await initiateCashfreePayment(data.paymentSessionId, data.cfOrderId);

    } catch (error) {
      console.error('Error creating Cashfree order:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create payment order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const initiateCashfreePayment = async (sessionId: string, cfOrderId: string) => {
    try {
      // Load Cashfree SDK
      if (!window.Cashfree) {
        const script = document.createElement('script');
        script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
        script.async = true;
        document.head.appendChild(script);
        
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
        });
      }

      // Initialize Cashfree
      const cashfree = window.Cashfree({
        mode: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'
      });

      // Store cfOrderId in sessionStorage as backup
      sessionStorage.setItem('cashfree_order_id', cfOrderId);
      sessionStorage.setItem('cashfree_payment_initiated', 'true');
      
      console.log('Initiating Cashfree payment with:', {
        sessionId,
        cfOrderId,
        storedInSession: sessionStorage.getItem('cashfree_order_id')
      });

      // Configure checkout options - use redirect for better reliability
      const checkoutOptions = {
        paymentSessionId: sessionId,
        redirectTarget: '_self' // Use redirect to ensure return URL is used
      };

      // Open payment
      const result = await cashfree.checkout(checkoutOptions);
      
      console.log('Cashfree checkout result:', result);
      
      // Handle the result
      if (result.error) {
        console.error('Payment failed:', result.error);
        handlePaymentCompletion('failed', cfOrderId);
        return;
      }
      
      if (result.redirect) {
        console.log('Payment redirect detected:', result.redirect);
        // For redirect scenarios, the user will be redirected automatically
        // The return URL will handle the confirmation
        return;
      }
      
      if (result.paymentDetails) {
        console.log('Payment completed:', result.paymentDetails);
        handlePaymentCompletion('success', cfOrderId);
        return;
      }
      
      // Handle case where payment is successful but no explicit paymentDetails
      if (result.order && result.order.status === 'PAID') {
        console.log('Payment successful based on order status');
        handlePaymentCompletion('success', cfOrderId);
        return;
      }
      
      // Default case - redirect to confirmation for verification
      console.log('Default case - redirecting to confirmation');
      handlePaymentCompletion('success', cfOrderId);

    } catch (error) {
      console.error('Error initiating Cashfree payment:', error);
      
      // Try to get cfOrderId from sessionStorage if state is lost
      const storedOrderId = sessionStorage.getItem('cashfree_order_id');
      if (storedOrderId) {
        console.log('Using stored order ID for error handling:', storedOrderId);
        handlePaymentCompletion('failed', storedOrderId);
      } else {
        toast({
          title: "Error",
          description: "Failed to load payment interface. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const handlePaymentCompletion = async (status: 'success' | 'failed' | 'cancelled', orderIdToUse?: string) => {
    // Get current user for user_id parameter
    const user = await supabase.auth.getUser();
    const userId = user.data.user?.id;

    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ["payment-history"] });
    queryClient.invalidateQueries({ queryKey: ["subscription"] });

    // Use the provided orderIdToUse or fall back to state variable
    const orderIdForRedirect = orderIdToUse || cfOrderId || '';
    
    console.log('Redirecting with order_id:', orderIdForRedirect);

    // Always redirect to payment confirmation page with proper parameters
    const params = new URLSearchParams({
      source: 'cashfree',
      order_id: orderIdForRedirect,
      ...(userId && { user_id: userId })
    });

    navigate(`/payment/confirmation?${params.toString()}`);
  };

  // Removed handleContinueToDashboard - not needed since we redirect to confirmation

  // Removed periodic status checking - confirmation page handles verification

  // Removed local payment status UI - always redirect to confirmation page

  return (
    <div className="space-y-3">
      {couponData && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">
            <strong>Coupon Applied:</strong> {couponData.code} - ₹{couponData.discountAmount} discount
          </AlertDescription>
        </Alert>
      )}

      <Button
        onClick={createCashfreeOrder}
        disabled={isCreatingOrder}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
        size="lg"
      >
        {isCreatingOrder ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Preparing Payment...
          </>
        ) : (
          <>
            <IndianRupee className="mr-2 h-4 w-4" />
            Pay ₹{totalAmount.toLocaleString()}
          </>
        )}
      </Button>
    </div>
  );
}

// Extend Window interface for Cashfree SDK
declare global {
  interface Window {
    Cashfree: any;
  }
}
