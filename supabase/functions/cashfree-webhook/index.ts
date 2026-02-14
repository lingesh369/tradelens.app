import { corsHeaders } from '../_shared/cors.ts';
import { createServiceClient } from '../_shared/auth.ts';
import { verifyCashfreeWebhook, getCashfreeOrderStatus } from '../_shared/payment-providers/cashfree.ts';

Deno.serve(async (req) => {
  try {
    const timestamp = req.headers.get('x-webhook-timestamp') || '';
    const signature = req.headers.get('x-webhook-signature') || '';
    const rawBody = await req.text();

    // Verify webhook signature
    // Note: In development/sandbox sometimes signatures might be tricky, but we should try to verify
    if (!verifyCashfreeWebhook(timestamp, rawBody, signature)) {
      console.error('Invalid Cashfree webhook signature');
      return new Response('Invalid signature', { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    console.log('Cashfree webhook received:', payload);

    const { data, type } = payload;
    
    // We only care about success webhooks for now
    if (type !== 'PAYMENT_SUCCESS_WEBHOOK') {
         return new Response('Ignored event type', { status: 200, headers: corsHeaders });
    }

    const orderId = data?.order?.order_id;

    if (!orderId) {
      console.error('No order ID in webhook');
      return new Response('No order ID', { status: 400 });
    }

    // Get full order details from Cashfree to be sure
    const orderDetails = await getCashfreeOrderStatus(orderId);
    
    const supabase = createServiceClient();

    // Check if payment exists
    let { data: payment } = await supabase
      .from('payment_history')
      .select('*')
      .eq('gateway_order_id', orderId)
      .single();

    const paymentStatus = orderDetails.order_status === 'PAID' ? 'succeeded' : 'failed';
    const transactionId = orderDetails.cf_order_id?.toString() || data?.payment?.cf_payment_id?.toString();

    if (payment) {
        // Update
        await supabase
          .from('payment_history')
          .update({
            status: paymentStatus,
            transaction_id: transactionId,
            metadata: { ...payment.metadata, cashfree: orderDetails },
            paid_at: paymentStatus === 'succeeded' ? new Date().toISOString() : null,
          })
          .eq('id', payment.id);
    } else {
        // Insert
        const { data: newPayment, error: insertError } = await supabase
          .from('payment_history')
          .insert({
            user_id: orderDetails.customer_details.customer_id, // Assuming customer_id is user_id
            amount: parseFloat(orderDetails.order_amount),
            currency: orderDetails.order_currency,
            status: paymentStatus,
            payment_method: 'cashfree',
            payment_gateway: 'cashfree',
            gateway_order_id: orderId,
            transaction_id: transactionId,
            metadata: { cashfree: orderDetails },
            paid_at: paymentStatus === 'succeeded' ? new Date().toISOString() : null,
          })
          .select()
          .single();
          
        if (insertError) console.error('Error creating payment from webhook:', insertError);
        payment = newPayment;
    }

    // If payment successful, activate subscription
    if (orderDetails.order_status === 'PAID') {
        const planId = orderDetails.order_tags?.planId;
        const billingCycle = orderDetails.order_tags?.billingCycle;
        
        if (planId && billingCycle) {
            const { error: processError } = await supabase.functions.invoke('process-payment-success', {
                body: {
                  userId: orderDetails.customer_details.customer_id,
                  planId: planId,
                  billingCycle: billingCycle,
                  amount: parseFloat(orderDetails.order_amount),
                  paymentMethod: 'cashfree',
                  transactionId: transactionId,
                  providerRef: orderId
                }
              });
              
            if (processError) console.error('Error activating subscription via webhook:', processError);
        } else {
            console.warn('Missing planId/billingCycle in webhook order_tags, skipping subscription activation');
        }
    }

    return new Response('OK', { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error('Cashfree webhook error:', error);
    return new Response('Error', { status: 500, headers: corsHeaders });
  }
});
