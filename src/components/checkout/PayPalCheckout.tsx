
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PayPalCheckoutProps {
  planId: string;
  amount: number;
  billingCycle: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  couponData?: {
    id: string;
    code: string;
    discountAmount: number;
  };
}

export default function PayPalCheckout({ 
  planId, 
  amount, 
  billingCycle,
  onSuccess, 
  onError, 
  couponData 
}: PayPalCheckoutProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const handlePayPalPayment = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setDebugInfo(null);

      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('Starting PayPal production payment flow...');

      // Create PayPal order
      const { data, error: orderError } = await supabase.functions.invoke('create-paypal-subscription', {
        body: { 
          planId,
          amount,
          userId: user.id,
          billingCycle: billingCycle,
          couponData
        }
      });

      console.log('PayPal production order response:', data);

      if (orderError) {
        console.error('Supabase function error:', orderError);
        throw orderError;
      }
      
      if (!data) {
        throw new Error('No response from PayPal service');
      }
      
      if (!data.success) {
        console.error('PayPal service error:', data);
        setDebugInfo(data.debug);
        throw new Error(data.error || 'PayPal service error');
      }

      // Redirect to PayPal for payment
      console.log('Redirecting to PayPal production:', data.approvalUrl);
      window.location.href = data.approvalUrl;
      
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to process PayPal payment';
      console.error('PayPal payment error:', err);
      setError(errorMessage);
      onError?.(errorMessage);
      
      // Check if it's a credentials error
      if (errorMessage.includes('Authentication Failed') || errorMessage.includes('invalid_client')) {
        toast({
          title: 'PayPal Configuration Error',
          description: 'Invalid credentials. Please check your PayPal API keys.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Payment Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>PayPal Error:</strong> {error}
          </AlertDescription>
        </Alert>
        
        {debugInfo && (
          <Alert>
            <AlertDescription>
              <strong>Debug Info:</strong>
              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </AlertDescription>
          </Alert>
        )}
        
        {error.includes('Authentication Failed') && (
          <Alert>
            <AlertDescription>
              <strong>How to Fix:</strong> Please verify your PayPal production credentials:
              <ul className="list-disc list-inside mt-2 text-sm">
                <li>Go to <a href="https://developer.paypal.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">PayPal Developer Dashboard</a></li>
                <li>Create a live app if you haven't already</li>
                <li>Copy the <strong>Client ID</strong> and <strong>Client Secret</strong> from your live app</li>
                <li>Add them as <code>PAYPAL_CLIENT_ID</code> and <code>PAYPAL_CLIENT_SECRET</code> in your Supabase project secrets</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}
        
        <Button 
          onClick={() => {
            setError(null);
            setDebugInfo(null);
          }}
          variant="outline"
          className="w-full"
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
          <span>Processing payment...</span>
        </div>
      )}
      <Button 
        onClick={handlePayPalPayment}
        disabled={isLoading}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          'Pay with PayPal'
        )}
      </Button>
    </div>
  );
}
