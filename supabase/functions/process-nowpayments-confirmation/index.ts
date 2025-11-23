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

    const invoiceStatus = await getNowPaymentsInvoiceStatus(invoice_id);
    const supabase = createServiceClient();

    // Find payment by order_id
    let { data: payment } = await supabase
      .from('payments')
      .select('*')
      .eq('transaction_id', invoiceStatus.order_id)
      .eq('user_id', user.id)
      .single();

    if (!payment) {
      return errorResponse('Payment not found', 404);
    }

    // Map NOWPayments status to our status
    const paymentStatus = invoiceStatus.payment_status === 'finished' ? 'completed' :
                         invoiceStatus.payment_status === 'partially_paid' ? 'pending' :
                         invoiceStatus.payment_status === 'waiting' ? 'pending' :
                         invoiceStatus.payment_status === 'confirming' ? 'pending' :
                         invoiceStatus.payment_status === 'sending' ? 'pending' : 'failed';

    await supabase
      .from('payments')
      .update({
        status: paymentStatus,
        payment_details: invoiceStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.id);

    // If payment successful, activate subscription
    if (invoiceStatus.payment_status === 'finished') {
      const startDate = new Date();
      const endDate = new Date(startDate);
      
      if (payment.billing_cycle === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (payment.billing_cycle === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      const { error: subError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          plan_id: payment.plan_id,
          status: 'active',
          current_period_start: startDate.toISOString(),
          current_period_end: endDate.toISOString(),
          billing_cycle: payment.billing_cycle,
          payment_provider: 'nowpayments',
          updated_at: new Date().toISOString(),
        });

      if (subError) {
        console.error('Error creating subscription:', subError);
        return errorResponse('Failed to activate subscription', 500);
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
    });
  } catch (error) {
    console.error('Error processing NOWPayments confirmation:', error);
    return errorResponse(error.message, 500);
  }
});
