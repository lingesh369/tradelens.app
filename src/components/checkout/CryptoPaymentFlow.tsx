
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2, Bitcoin } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface CryptoPaymentFlowProps {
  planId: string;
  billingCycle: string;
  amount: number;
  userDetails: {
    fullName: string;
    email: string;
    phoneNumber?: string;
  };
  onPaymentComplete?: () => void;
  onStageChange?: (stage: number) => void;
  couponData?: {
    id: string;
    code: string;
    discountAmount: number;
  };
}

export default function CryptoPaymentFlow({ 
  planId, 
  billingCycle, 
  amount, 
  userDetails, 
  onPaymentComplete,
  couponData
}: CryptoPaymentFlowProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleCryptoPayment = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!user) {
        throw new Error('User not authenticated');
      }

      // Create NOWPayments invoice
      const { data, error: invoiceError } = await supabase.functions.invoke('create-nowpayments-invoice', {
        body: {
          userId: user.id,
          planId,
          amount,
          billingCycle,
          customerName: userDetails.fullName,
          customerEmail: userDetails.email,
          couponData
        }
      });

      if (invoiceError) throw invoiceError;
      if (!data.success) throw new Error(data.error);

      // Redirect to NOWPayments checkout
      window.location.href = data.invoice_url;
      
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to process crypto payment';
      setError(errorMessage);
      
      toast({
        title: 'Payment Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <div className="text-center p-4">
        <p className="text-red-500 mb-4">{error}</p>
        <Button 
          onClick={() => {
            setError(null);
          }}
          variant="outline"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Creating payment...</span>
        </div>
      )}
      <Button 
        onClick={handleCryptoPayment}
        disabled={isLoading}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Bitcoin className="mr-2 h-4 w-4" />
            Pay with Cryptocurrency
          </>
        )}
      </Button>
    </div>
  );
}
