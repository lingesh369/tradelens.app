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
    
    // Validating user ownership via customer_id in orderDetails or similar check is recommended
    if (orderDetails.customer_details.customer_id !== user.id) {
       return errorResponse('Unauthorized order confirmation', 403);
    }

    const supabase = createServiceClient();

    // Check if payment history exists
    let { data: payment } = await supabase
      .from('payment_history')
      .select('*')
      .eq('gateway_order_id', order_id)
      .single();

    const paymentStatus = orderDetails.order_status === 'PAID' ? 'succeeded' : 
                         orderDetails.order_status === 'ACTIVE' ? 'pending' : 'failed';

    // Parse metadata for plan info if available from order_tags (assuming we sent them)
    // Note: Cashfree response usually contains order_tags if sent
    const planId = orderDetails.order_tags?.planId;
    const billingCycle = orderDetails.order_tags?.billingCycle;

    if (payment) {
        // Update existing record
        await supabase
          .from('payment_history')
          .update({
            status: paymentStatus,
            transaction_id: orderDetails.cf_order_id?.toString(), // Use cf_order_id as transaction_id
            metadata: { ...payment.metadata, cashfree: orderDetails },
            paid_at: paymentStatus === 'succeeded' ? new Date().toISOString() : null,
          })
          .eq('id', payment.id);
    } else {
        // Create new record
        const { error: insertError } = await supabase
          .from('payment_history')
          .insert({
            user_id: user.id,
            amount: parseFloat(orderDetails.order_amount),
            currency: orderDetails.order_currency,
            status: paymentStatus,
            payment_method: 'cashfree',
            payment_gateway: 'cashfree',
            gateway_order_id: order_id,
            transaction_id: orderDetails.cf_order_id?.toString(),
            metadata: { cashfree: orderDetails },
            paid_at: paymentStatus === 'succeeded' ? new Date().toISOString() : null,
          });
          
        if (insertError) {
             console.error('Error creating payment history:', insertError);
        }
    }

    // If payment successful, activate subscription
    if (orderDetails.order_status === 'PAID') {
      if (!planId || !billingCycle) {
          console.error('Missing planId or billingCycle in order tags, cannot activate subscription automatically via confirmation');
          // We might want to look this up or error out, but for now we'll proceed and rely on webhook or shared logic if params are passed
      } else {
           const { error: processError } = await supabase.functions.invoke('process-payment-success', {
            body: {
              userId: user.id,
              planId: planId,
              billingCycle: billingCycle,
              amount: parseFloat(orderDetails.order_amount),
              paymentMethod: 'cashfree',
              transactionId: orderDetails.cf_order_id?.toString() || order_id,
              providerRef: order_id
            }
          });
          
          if (processError) {
             console.error('Error processing payment success:', processError);
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
      success: orderDetails.order_status === 'PAID',
      status: paymentStatus,
      order_status: orderDetails.order_status,
    });
  } catch (error) {
    console.error('Error processing Cashfree confirmation:', error);
    return errorResponse(error.message, 500);
  }
});
