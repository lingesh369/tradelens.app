import { handleCors } from '../_shared/cors.ts';
import { verifyAuth, createServiceClient } from '../_shared/auth.ts';
import { successResponse, errorResponse } from '../_shared/response.ts';
import { capturePayPalOrder, getPayPalOrderDetails } from '../_shared/payment-providers/paypal.ts';

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { user } = await verifyAuth(req);
    const { order_id } = await req.json();

    if (!order_id) {
      return errorResponse('Missing order_id');
    }

    console.log('Processing PayPal confirmation for order:', order_id);

    // Get order details
    const orderDetails = await getPayPalOrderDetails(order_id);
    const referenceId = orderDetails.purchase_units[0].custom_id || orderDetails.purchase_units[0].reference_id;
    
    if (!referenceId) {
      return errorResponse('Missing reference ID in PayPal order');
    }

    const [userId, planId, billingCycle] = referenceId.split('_');

    if (userId !== user.id) {
      return errorResponse('Unauthorized order confirmation', 403);
    }

    // Capture order if approved
    let captureResult = orderDetails;
    if (orderDetails.status === 'APPROVED') {
      captureResult = await capturePayPalOrder(order_id);
    }

    const supabase = createServiceClient();

    // Check if payment history already exists
    const { data: existingPayment } = await supabase
      .from('payment_history')
      .select('*')
      .eq('gateway_order_id', order_id)
      .single();

    const paymentStatus = captureResult.status === 'COMPLETED' ? 'succeeded' : 
                         captureResult.status === 'APPROVED' ? 'pending' : 'failed';

    if (existingPayment) {
      // Update existing record
      await supabase
        .from('payment_history')
        .update({
          status: paymentStatus,
          transaction_id: captureResult.purchase_units[0]?.payments?.captures[0]?.id || order_id,
          metadata: { ...existingPayment.metadata, paypal: captureResult },
          paid_at: paymentStatus === 'succeeded' ? new Date().toISOString() : null,
        })
        .eq('id', existingPayment.id);
    } else {
      // Create new payment history record
      const { data: newPayment, error: payError } = await supabase
        .from('payment_history')
        .insert({
          user_id: user.id,
          amount: parseFloat(orderDetails.purchase_units[0].amount.value),
          currency: orderDetails.purchase_units[0].amount.currency_code,
          status: paymentStatus,
          payment_method: 'paypal',
          payment_gateway: 'paypal',
          gateway_order_id: order_id,
          transaction_id: captureResult.purchase_units[0]?.payments?.captures[0]?.id || order_id,
          metadata: { paypal: captureResult },
          paid_at: paymentStatus === 'succeeded' ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (payError) {
        console.error('Error creating payment history:', payError);
      }
    }

    // If payment successful, activate subscription
    if (captureResult.status === 'COMPLETED') {
      // Invoke shared logic for activating subscription
      const { error: processError } = await supabase.functions.invoke('process-payment-success', {
        body: {
          userId: user.id,
          planId: planId,
          billingCycle: billingCycle,
          amount: parseFloat(orderDetails.purchase_units[0].amount.value),
          paymentMethod: 'paypal',
          transactionId: captureResult.purchase_units[0]?.payments?.captures[0]?.id || order_id,
          providerRef: order_id
        }
      });

      if (processError) {
        console.error('Error activating subscription via process-payment-success:', processError);
        return errorResponse('Failed to activate subscription', 500);
      }

      return successResponse({
        success: true,
        status: 'completed',
        subscription_active: true,
      });
    }

    return successResponse({
      success: captureResult.status === 'COMPLETED',
      status: paymentStatus,
      order_status: captureResult.status,
    });
  } catch (error) {
    console.error('Error processing PayPal confirmation:', error);
    return errorResponse(error.message, 500);
  }
});
