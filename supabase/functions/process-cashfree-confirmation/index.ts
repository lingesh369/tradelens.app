import { handleCors } from '../_shared/cors.ts';
import { verifyAuth, createServiceClient } from '../_shared/auth.ts';
import { successResponse, errorResponse } from '../_shared/response.ts';
import { getCashfreeOrderStatus } from '../_shared/payment-providers/cashfree.ts';

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { user } = await verifyAuth(req);
    const { order_id } = await req.json();

    if (!order_id) {
      return errorResponse('Missing order_id');
    }

    console.log('Processing Cashfree confirmation for order:', order_id);

    // Get order status from Cashfree
    const orderDetails = await getCashfreeOrderStatus(order_id);
    
    const supabase = createServiceClient();

    // Check if payment exists
    let { data: payment } = await supabase
      .from('payments')
      .select('*')
      .eq('transaction_id', order_id)
      .eq('user_id', user.id)
      .single();

    if (!payment) {
      return errorResponse('Payment not found', 404);
    }

    // Update payment status
    const paymentStatus = orderDetails.order_status === 'PAID' ? 'completed' : 
                         orderDetails.order_status === 'ACTIVE' ? 'pending' : 'failed';

    await supabase
      .from('payments')
      .update({
        status: paymentStatus,
        payment_details: orderDetails,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.id);

    // If payment successful, activate subscription
    if (orderDetails.order_status === 'PAID') {
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
          payment_provider: 'cashfree',
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
      success: orderDetails.order_status === 'PAID',
      status: paymentStatus,
      order_status: orderDetails.order_status,
    });
  } catch (error) {
    console.error('Error processing Cashfree confirmation:', error);
    return errorResponse(error.message, 500);
  }
});
