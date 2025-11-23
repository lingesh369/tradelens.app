
import { useEffect, useState } from "react";
import { CheckCircle2, ArrowRight, Calendar, DollarSign, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface CheckoutSuccessProps {
  source: string;
}

export default function CheckoutSuccess({ source }: CheckoutSuccessProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [countdown, setCountdown] = useState(10);
  const [isProcessing, setIsProcessing] = useState(true);
  const [accessEndDate, setAccessEndDate] = useState<string | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  useEffect(() => {
    const processPaymentSuccess = async () => {
      if (!user) return;
      
      try {
        // Get payment details from URL params or localStorage
        let paymentId, planId, billingCycle;
        
        if (source === 'crypto') {
          paymentId = searchParams.get('payment_id') || localStorage.getItem('nowpayments_invoice_id');
          planId = searchParams.get('plan_id') || localStorage.getItem('selectedPlan');
          billingCycle = searchParams.get('billing_cycle') || localStorage.getItem('billingCycle');
        } else {
          paymentId = searchParams.get('payment_id') || localStorage.getItem(`${source}_transaction_id`);
          planId = searchParams.get('plan_id') || localStorage.getItem('selectedPlan');
          billingCycle = searchParams.get('billing_cycle') || localStorage.getItem('billingCycle');
        }
        
        if (paymentId && planId && billingCycle) {
          // Call our payment success function
          const { data, error } = await supabase.functions.invoke('process-payment-success', {
            body: {
              userId: user.id,
              planId: planId,
              billingCycle: billingCycle,
              amount: billingCycle === 'yearly' ? 
                (planId.includes('starter') ? 84 : 180) : 
                (planId.includes('starter') ? 9 : 19),
              paymentMethod: source,
              transactionId: paymentId
            }
          });
          
          if (error) {
            console.error('Error processing payment success:', error);
          } else if (data?.success) {
            setAccessEndDate(data.accessEndDate);
          }
        }
      } catch (error) {
        console.error('Error in payment success processing:', error);
      } finally {
        setIsProcessing(false);
      }
    };

    processPaymentSuccess();
  }, [user, source, searchParams]);

  useEffect(() => {
    if (!isProcessing) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate("/dashboard");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [navigate, isProcessing]);

  const handleCheckPaymentStatus = async () => {
    if (source !== 'crypto') return;
    
    setIsCheckingStatus(true);
    try {
      const invoiceId = localStorage.getItem('nowpayments_invoice_id');
      if (!invoiceId) {
        throw new Error('No invoice ID found');
      }
      
      const { data, error } = await supabase.functions.invoke('check-nowpayments-status', {
        body: { invoice_id: invoiceId }
      });
      
      if (error) {
        console.error('Error checking payment status:', error);
        return;
      }
      
      if (data?.success && (data.payment_status === 'confirmed' || data.payment_status === 'finished')) {
        // Refresh the page to process the confirmed payment
        window.location.reload();
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const getPaymentMethodName = () => {
    switch (source) {
      case "paypal":
        return "PayPal";
      case "crypto":
        return "Crypto (NOWPayments)";
      default:
        return "Payment Gateway";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Processing your payment...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl text-green-600">Payment Successful!</CardTitle>
          <CardDescription>
            Your one-time payment has been processed via {getPaymentMethodName()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg space-y-2">
            <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-400">
              <DollarSign className="h-4 w-4" />
              <span className="font-medium">One-Time Payment Complete</span>
            </div>
            {accessEndDate && (
              <div className="flex items-center justify-center gap-2 text-sm text-green-600 dark:text-green-400">
                <Calendar className="h-4 w-4" />
                <span>Access expires: {formatDate(accessEndDate)}</span>
              </div>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground">
            Thank you for your purchase! You now have access to all plan features. 
            No automatic renewals - you can manually re-purchase when your access expires.
          </p>
          
          {source === 'crypto' && (
            <div className="space-y-2">
              <Button 
                variant="outline"
                onClick={handleCheckPaymentStatus}
                disabled={isCheckingStatus}
                className="w-full"
              >
                {isCheckingStatus ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Checking Status...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" /> Check Payment Status
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">
                If your crypto payment was confirmed but access hasn't been activated, use this button to check status.
              </p>
            </div>
          )}
          
          <div className="space-y-2">
            <Button 
              onClick={() => navigate("/dashboard")} 
              className="w-full"
            >
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <p className="text-xs text-muted-foreground">
              Redirecting automatically in {countdown} seconds...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
