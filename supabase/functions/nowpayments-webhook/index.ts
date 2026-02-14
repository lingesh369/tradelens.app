import { createServiceClient } from '../_shared/auth.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { verifyNowPaymentsWebhook } from '../_shared/payment-providers/nowpayments.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get('x-nowpayments-sig');
    const rawBody = await req.text();

    if (!signature) {
      console.error('Missing NOWPayments signature'); 
      return new Response('Missing signature', { status: 401 });
    }

    if (!verifyNowPaymentsWebhook(signature, rawBody)) {
      console.error('Invalid NOWPayments signature');
      return new Response('Invalid signature', { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    console.log('NOWPayments IPN received:', payload);

    const { payment_status, payment_id, invoice_id, order_id, pay_amount, pay_currency } = payload;

    // NOWPayments statuses: finished, partially_paid, waiting, confirming, sending, failed, refunding, expired
    const isCompleted = payment_status === 'finished';
    const status = isCompleted ? 'succeeded' : 
                   (payment_status === 'waiting' || payment_status === 'confirming' || payment_status === 'sending') ? 'pending' : 'failed';

    const supabase = createServiceClient();

    // Find payment record
    // We stored invoice_id as gateway_order_id in create-nowpayments-invoice
    // OR we stored order_id as transaction_id
    // Let's try to match by invoice_id first as it's most reliable from IPN
    let { data: payment } = await supabase
      .from('payment_history')
      .select('*')
      .eq('gateway_order_id', invoice_id) // This corresponds to invoice.id from creation
      .single();

    // Fallback: try order_id if invoice match fails (legacy support)
    if (!payment && order_id) {
         const { data: legacyPayment } = await supabase
            .from('payment_history')
            .select('*')
            .eq('transaction_id', order_id)
            .single();
         payment = legacyPayment;
    }

    if (!payment) {
        console.warn(`Payment not found for invoice ${invoice_id} or order ${order_id}. Creating new record if possible? No, we should rely on creation.`);
        // Note: For crypto, sometimes people send money without invoice via static components? 
        // If so, we might need to create here. But standard flow is invoice based.
        return new Response('Payment record not found', { status: 200 }); // Return 200 to acknowledge IPN
    }

    // Update payment history
    await supabase
        .from('payment_history')
        .update({
            status: status,
            // If we didn't have the payment_id (transaction on NP side) before, save it now
            metadata: { ...payment.metadata, nowpayments: payload },
            paid_at: isCompleted ? new Date().toISOString() : null,
        })
        .eq('id', payment.id);

    // If finished, activate subscription
    if (isCompleted) {
        const planId = payment.metadata?.plan_id;
        const billingCycle = payment.metadata?.billing_cycle;
        const userId = payment.user_id;

        if (planId && billingCycle && userId) {
             const { error: processError } = await supabase.functions.invoke('process-payment-success', {
                body: {
                  userId: userId,
                  planId: planId,
                  billingCycle: billingCycle,
                  amount: pay_amount, // Amount actually paid
                  paymentMethod: 'crypto',
                  transactionId: payment_id?.toString() || invoice_id.toString(),
                  providerRef: invoice_id.toString()
                }
              });

             if (processError) console.error('Error activating subscription via NP webhook:', processError);
             else console.log(`Subscription activated for user ${userId}`);
        } else {
            console.error('Missing plan details in payment metadata, cannot activate subscription');
        }
    }

    return new Response('OK', { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('Error processing NOWPayments webhook:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});
