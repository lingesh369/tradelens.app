import { handleCors } from '../_shared/cors.ts';
import { verifyAuth, createServiceClient } from '../_shared/auth.ts';
import { successResponse, errorResponse } from '../_shared/response.ts';
import { getNowPaymentsInvoiceStatus } from '../_shared/payment-providers/nowpayments.ts';

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { user } = await verifyAuth(req);
    const { invoice_id } = await req.json();

    if (!invoice_id) {
      return errorResponse('Missing invoice_id');
    }

    console.log('Processing NOWPayments confirmation for invoice:', invoice_id);

    // Fetch latest status
    const invoiceStatus = await getNowPaymentsInvoiceStatus(invoice_id);
    const supabase = createServiceClient();

    // Find payment by invoice_id (gateway_order_id)
    let { data: payment } = await supabase
      .from('payment_history')
      .select('*')
      .eq('gateway_order_id', invoice_id) // We store invoice.id here
      .single();

    if (!payment) {
        // Fallback search by order_id (legacy)
        const { data: legacyPayment } = await supabase
            .from('payment_history')
            .select('*')
            .eq('transaction_id', invoiceStatus.order_id)
            .single();
        payment = legacyPayment;
    }

    if (!payment) {
      return errorResponse('Payment record not found', 404);
    }

    if (payment.user_id !== user.id) {
        return errorResponse('Unauthorized', 403);
    }

    // Map NOWPayments status
    const paymentStatus = invoiceStatus.payment_status === 'finished' ? 'succeeded' :
                         (invoiceStatus.payment_status === 'waiting' || invoiceStatus.payment_status === 'confirming' || invoiceStatus.payment_status === 'sending' || invoiceStatus.payment_status === 'partially_paid') ? 'pending' : 'failed';

    // Update payment record
    await supabase
      .from('payment_history')
      .update({
        status: paymentStatus,
        metadata: { ...payment.metadata, nowpayments: invoiceStatus },
        paid_at: paymentStatus === 'succeeded' ? new Date().toISOString() : null,
      })
      .eq('id', payment.id);

    // If finished, activate subscription
    if (invoiceStatus.payment_status === 'finished') {
      const planId = payment.metadata?.plan_id;
      const billingCycle = payment.metadata?.billing_cycle;
      
      if (planId && billingCycle) {
          const { error: processError } = await supabase.functions.invoke('process-payment-success', {
            body: {
              userId: user.id,
              planId: planId,
              billingCycle: billingCycle,
              amount: parseFloat(invoiceStatus.pay_amount || invoiceStatus.price_amount),
              paymentMethod: 'crypto',
              transactionId: invoiceStatus.payment_id?.toString() || invoice_id.toString(),
              providerRef: invoice_id.toString()
            }
          });
          
          if (processError) {
             console.error('Error activating subscription via confirmation:', processError);
             return errorResponse('Failed to activate subscription', 500);
          }
      }
      
      return successResponse({
        success: true,
        status: 'completed',
        subscription_active: true,
      });
    }

    return successResponse({
      success: invoiceStatus.payment_status === 'finished',
      status: paymentStatus,
      payment_status: invoiceStatus.payment_status,
      invoice_url: invoiceStatus.invoice_url
    });
  } catch (error) {
    console.error('Error processing NOWPayments confirmation:', error);
    return errorResponse(error.message, 500);
  }
});
