import { corsHeaders } from '../_shared/cors.ts';
import { createServiceClient } from '../_shared/auth.ts';
import { verifyCashfreeWebhook, getCashfreeOrderStatus } from '../_shared/payment-providers/cashfree.ts';

Deno.serve(async (req) => {
  try {
    const timestamp = req.headers.get('x-webhook-timestamp') || '';
    const signature = req.headers.get('x-webhook-signature') || '';
    const rawBody = await req.text();

    // Verify webhook signature
    if (!verifyCashfreeWebhook(timestamp, rawBody, signature)) {
      console.error('Invalid webhook signature');
      return new Response('Invalid signature', { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    console.log('Cashfree webhook received:', payload);

    const { data } = payload;
    const orderId = data?.order?.order_id;

    if (!orderId) {
      console.error('No order ID in webhook');
      return new Response('No order ID', { status: 400 });
    }

    // Get full order details from Cashfree
    const orderDetails = await getCashfreeOrderStatus(orderId);
    
    const supabase = createServiceClient();

    // Update payment record
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: orderDetails.order_status === 'PAID' ? 'completed' : 'failed',
        payment_details: orderDetails,
        updated_at: new Date().toISOString(),
      })
      .eq('transaction_id', orderId);

    if (updateError) {
      console.error('Error updating payment:', updateError);
    }

    // If payment successful, activate subscription
    if (orderDetails.order_status === 'PAID') {
      const { data: payment } = await supabase
        .from('payments')
        .select('user_id, plan_id, billing_cycle')
        .eq('transaction_id', orderId)
        .single();

      if (payment) {
        // Calculate subscription dates
        const startDate = new Date();
        const endDate = new Date(startDate);
        
        if (payment.billing_cycle === 'monthly') {
          endDate.setMonth(endDate.getMonth() + 1);
        } else if (payment.billing_cycle === 'yearly') {
          endDate.setFullYear(endDate.getFullYear() + 1);
        }

        // Create or update subscription
        await supabase
          .from('subscriptions')
          .upsert({
            user_id: payment.user_id,
            plan_id: payment.plan_id,
            status: 'active',
            current_period_start: startDate.toISOString(),
            current_period_end: endDate.toISOString(),
            billing_cycle: payment.billing_cycle,
            payment_provider: 'cashfree',
            updated_at: new Date().toISOString(),
          });
      }
    }

    return new Response('OK', { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error('Cashfree webhook error:', error);
    return new Response('Error', { status: 500, headers: corsHeaders });
  }
});
