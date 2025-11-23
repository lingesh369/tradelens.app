
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

interface PaymentDetails {
  invoice_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  status: string;
  order_description: string;
  payer_email?: string;
  payer_id?: string;
  payment_mode?: string;
  gateway_reference?: string;
  bank_reference?: string;
  transaction_id?: string;
  order_number?: string;
}

interface ConfirmationData {
  success: boolean;
  payment_status: string;
  message: string;
  messageType: 'success' | 'warning' | 'error' | 'info';
  subscriptionActivated: boolean;
  environment?: string;
  paymentDetails: PaymentDetails;
}

export default function PaymentConfirmation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [confirmationData, setConfirmationData] = useState<ConfirmationData | null>(null);

  const source = searchParams.get('source');
  const status = searchParams.get('status');
  const environment = searchParams.get('environment');
  const npId = searchParams.get('NP_id') || searchParams.get('invoice_id');
  const orderId = searchParams.get('order_id') || searchParams.get('token');
  
  // For Cashfree, check multiple possible parameter names
  let cashfreeOrderId = searchParams.get('cf_order_id');
  
  // If source is cashfree, try all possible parameter names that Cashfree might use
  if (source === 'cashfree') {
    if (!cashfreeOrderId) {
      // Try alternative parameter names that Cashfree might send
      cashfreeOrderId = searchParams.get('order_id') ||  // Most common from return URL
                        searchParams.get('orderId') || 
                        searchParams.get('order_token') ||
                        searchParams.get('order_reference') ||
                        searchParams.get('cf_id') ||
                        searchParams.get('cashfree_order_id') ||
                        searchParams.get('payment_id') ||
                        searchParams.get('transaction_id');
    }
    
    // If still no cashfreeOrderId found, try sessionStorage as fallback
    if (!cashfreeOrderId) {
      const storedOrderId = sessionStorage.getItem('cashfree_order_id');
      if (storedOrderId) {
        console.log('Using stored Cashfree order ID from sessionStorage:', storedOrderId);
        cashfreeOrderId = storedOrderId;
        // Clear the stored value after use
        sessionStorage.removeItem('cashfree_order_id');
        sessionStorage.removeItem('cashfree_payment_initiated');
      }
    }
  }

  // Debug: Log all URL parameters
  console.log('PaymentConfirmation - All URL params:', Object.fromEntries(searchParams.entries()));
  console.log('PaymentConfirmation - Source:', source);
  console.log('PaymentConfirmation - Extracted cashfreeOrderId:', cashfreeOrderId);
  console.log('PaymentConfirmation - cf_order_id param:', searchParams.get('cf_order_id'));
  console.log('PaymentConfirmation - order_id param:', searchParams.get('order_id'));
  console.log('PaymentConfirmation URL parameters:', {
    source,
    status,
    environment,
    npId,
    orderId,
    cashfreeOrderId,
    allParams: Object.fromEntries(searchParams.entries())
  });

  // Additional debug for Cashfree
  if (source === 'cashfree') {
    console.log('Cashfree specific parameters:', {
      cf_order_id: searchParams.get('cf_order_id'),
      order_id: searchParams.get('order_id'),
      orderId: searchParams.get('orderId'),
      order_token: searchParams.get('order_token'),
      order_reference: searchParams.get('order_reference'),
      cf_id: searchParams.get('cf_id'),
      cashfree_order_id: searchParams.get('cashfree_order_id'),
      finalCashfreeOrderId: cashfreeOrderId
    });
  }

  const checkPaymentStatus = async (showToast = false) => {
    let paymentId: string | null = null;
    
    if (source === 'crypto') {
      paymentId = npId;
    } else if (source === 'cashfree') {
      paymentId = cashfreeOrderId;
    } else {
      paymentId = orderId;
    }
    
    console.log('Checking payment status for:', { source, npId, orderId, cashfreeOrderId, userId: user?.id });
    
    if (!paymentId) {
      setConfirmationData({
        success: false,
        payment_status: 'unknown',
        message: 'No payment information found. Please try again or contact support.',
        messageType: 'error',
        subscriptionActivated: false,
        environment: environment || undefined,
        paymentDetails: {} as PaymentDetails
      });
      setLoading(false);
      return;
    }

    try {
      setChecking(true);
      
      let data, error;
      
      if (source === 'crypto') {
        // Handle crypto payments via NowPayments
        console.log('Processing crypto payment confirmation for npId:', npId);
        const response = await supabase.functions.invoke('process-nowpayments-confirmation', {
          body: {
            invoice_id: npId,
            user_id: user?.id
          }
        });
        data = response.data;
        error = response.error;
      } else if (source === 'paypal') {
        // Handle PayPal payments (production)
        console.log('Processing PayPal payment confirmation for orderId:', orderId);
        const response = await supabase.functions.invoke('process-paypal-confirmation', {
          body: {
            order_id: orderId,
            user_id: user?.id
          }
        });
        data = response.data;
        error = response.error;
      } else if (source === 'cashfree') {
        // Handle Cashfree payments
        // Send both Cashfree's order id (cf_order_id) if available and our internal order_number (order_...)
        const orderNumber = searchParams.get('order_id') || searchParams.get('orderId') || orderId || undefined;
        console.log('Processing Cashfree payment confirmation for:', { cfOrderId: cashfreeOrderId, orderNumber });
        const response = await supabase.functions.invoke('process-cashfree-confirmation', {
          body: {
            order_id: cashfreeOrderId,     // Cashfree-generated cf_order_id (numeric-like)
            order_number: orderNumber,     // Our generated order_... string
            user_id: user?.id
          }
        });
        data = response.data;
        error = response.error;
      } else {
        throw new Error('Unsupported payment source');
      }

      if (error) throw error;

      if (data?.subscriptionActivated) {
        console.log('Invalidating subscription, plan access, and payment history queries...');
        await queryClient.invalidateQueries({ queryKey: ['user-subscription', user?.id] });
        await queryClient.invalidateQueries({ queryKey: ['plan-access', user?.id] });
        await queryClient.invalidateQueries({ queryKey: ['payment-history', user?.id] });
      }

      setConfirmationData(data);
      
      if (showToast) {
        toast({
          title: "Status Updated",
          description: data.message,
          variant: data.messageType === 'error' ? 'destructive' : 'default'
        });
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      const errorData = {
        success: false,
        payment_status: 'error',
        message: 'Unable to verify payment status. Please contact support if this persists.',
        messageType: 'error' as const,
        subscriptionActivated: false,
        environment: environment || undefined,
        paymentDetails: {} as PaymentDetails
      };
      setConfirmationData(errorData);
      
      if (showToast) {
        toast({
          title: "Error",
          description: "Failed to check payment status",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
      setChecking(false);
    }
  };

  useEffect(() => {
    if ((source === 'crypto' && npId) || (source === 'paypal' && orderId) || (source === 'cashfree' && cashfreeOrderId)) {
      checkPaymentStatus();
    } else {
      // Handle other payment sources or show error for missing data
      let errorMessage = 'Invalid payment confirmation link. Please contact support.';
      
      if (source === 'cashfree' && !cashfreeOrderId) {
        errorMessage = 'Cashfree order ID is missing from the confirmation link. This may be due to a payment flow issue. Please check your payment history or contact support.';
      } else if (source === 'crypto' && !npId) {
        errorMessage = 'Crypto payment ID is missing from the confirmation link.';
      } else if (source === 'paypal' && !orderId) {
        errorMessage = 'PayPal order ID is missing from the confirmation link.';
      }
      
      setConfirmationData({
        success: false,
        payment_status: 'unknown',
        message: errorMessage,
        messageType: 'error',
        subscriptionActivated: false,
        environment: environment || undefined,
        paymentDetails: {} as PaymentDetails
      });
      setLoading(false);
    }
  }, [source, npId, orderId, cashfreeOrderId, user, environment]);

  const getStatusIcon = (messageType: string) => {
    switch (messageType) {
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'warning':
        return <Clock className="h-6 w-6 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-6 w-6 text-red-500" />;
      default:
        return <AlertCircle className="h-6 w-6 text-blue-500" />;
    }
  };

  const getAlertVariant = (messageType: string) => {
    switch (messageType) {
      case 'error':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getCurrencySymbol = (currency: string) => {
    switch (currency?.toUpperCase()) {
      case 'INR':
        return '₹';
      case 'USD':
        return '$';
      case 'EUR':
        return '€';
      case 'GBP':
        return '£';
      default:
        return '$';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p className="text-muted-foreground">
                Verifying your payment...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {confirmationData && getStatusIcon(confirmationData.messageType)}
            Payment Confirmation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {confirmationData && (
            <>
              <Alert variant={getAlertVariant(confirmationData.messageType)}>
                <AlertDescription className="text-sm">
                  {confirmationData.message}
                </AlertDescription>
              </Alert>

              {confirmationData.paymentDetails?.invoice_id && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Payment Details</h3>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                    {/* Primary Payment Information */}
                    <div className="grid grid-cols-1 gap-3 text-sm">
                      <div className="flex justify-between items-center py-1">
                        <span className="text-muted-foreground font-medium">
                          {source === 'paypal' ? 'Order ID:' : source === 'cashfree' ? 'Cashfree Order ID:' : 'Invoice ID:'}
                        </span>
                        <span className="font-mono bg-white dark:bg-gray-700 px-2 py-1 rounded text-xs">{confirmationData.paymentDetails.invoice_id}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-muted-foreground font-medium">Amount:</span>
                        <span className="font-semibold text-lg">{getCurrencySymbol(confirmationData.paymentDetails.currency)}{confirmationData.paymentDetails.amount} {confirmationData.paymentDetails.currency}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-muted-foreground font-medium">Payment Method:</span>
                        <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs font-medium">{confirmationData.paymentDetails.payment_method}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-muted-foreground font-medium">Status:</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                          confirmationData.paymentDetails.status === 'completed' || confirmationData.paymentDetails.status === 'success' 
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                            : confirmationData.paymentDetails.status === 'pending'
                            ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                            : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                        }`}>{confirmationData.paymentDetails.status}</span>
                      </div>
                      {confirmationData.paymentDetails.order_description && (
                        <div className="flex justify-between items-center py-1">
                          <span className="text-muted-foreground font-medium">Plan:</span>
                          <span className="font-medium">{confirmationData.paymentDetails.order_description}</span>
                        </div>
                      )}
                      {confirmationData.paymentDetails.payer_email && (
                        <div className="flex justify-between items-center py-1">
                          <span className="text-muted-foreground font-medium">Payer Email:</span>
                          <span className="text-sm">{confirmationData.paymentDetails.payer_email}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Cashfree-specific details */}
                    {source === 'cashfree' && (
                      <>
                        <div className="border-t pt-3 mt-4">
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Transaction Details</h4>
                          <div className="grid grid-cols-1 gap-2 text-sm">
                            {confirmationData.paymentDetails.payment_mode && (
                              <div className="flex justify-between items-center py-1">
                                <span className="text-muted-foreground">Payment Mode:</span>
                                <span className="capitalize bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded text-xs font-medium">{confirmationData.paymentDetails.payment_mode}</span>
                              </div>
                            )}
                            {confirmationData.paymentDetails.order_number && (
                              <div className="flex justify-between items-center py-1">
                                <span className="text-muted-foreground">Order Number:</span>
                                <span className="font-mono bg-white dark:bg-gray-700 px-2 py-1 rounded text-xs">{confirmationData.paymentDetails.order_number}</span>
                              </div>
                            )}
                            {confirmationData.paymentDetails.transaction_id && (
                              <div className="flex justify-between items-start py-1">
                                <span className="text-muted-foreground">Transaction ID:</span>
                                <span className="font-mono bg-white dark:bg-gray-700 px-2 py-1 rounded text-xs max-w-[200px] break-all">{confirmationData.paymentDetails.transaction_id}</span>
                              </div>
                            )}
                            {confirmationData.paymentDetails.gateway_reference && (
                              <div className="flex justify-between items-start py-1">
                                <span className="text-muted-foreground">Gateway Reference:</span>
                                <span className="font-mono bg-white dark:bg-gray-700 px-2 py-1 rounded text-xs max-w-[200px] break-all">{confirmationData.paymentDetails.gateway_reference}</span>
                              </div>
                            )}
                            {confirmationData.paymentDetails.bank_reference && (
                              <div className="flex justify-between items-start py-1">
                                <span className="text-muted-foreground">Bank Reference:</span>
                                <span className="font-mono bg-white dark:bg-gray-700 px-2 py-1 rounded text-xs max-w-[200px] break-all">{confirmationData.paymentDetails.bank_reference}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button 
                  onClick={() => navigate('/dashboard')}
                  className="flex-1"
                  variant={confirmationData.messageType === 'success' ? 'default' : 'outline'}
                >
                  Go to Dashboard
                </Button>
                
                {(confirmationData.payment_status === 'waiting' || 
                  confirmationData.payment_status === 'confirming' ||
                  confirmationData.payment_status === 'sending' ||
                  confirmationData.payment_status === 'pending') && (
                  <Button
                    onClick={() => checkPaymentStatus(true)}
                    disabled={checking}
                    variant="outline"
                  >
                    {checking ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      'Check Status'
                    )}
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
