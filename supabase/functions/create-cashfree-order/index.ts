import { handleCors } from '../_shared/cors.ts';
import { verifyAuth } from '../_shared/auth.ts';
import { successResponse, errorResponse } from '../_shared/response.ts';
import { createCashfreeOrder } from '../_shared/payment-providers/cashfree.ts';

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { user } = await verifyAuth(req);
    const { planId, billingCycle, amount, currency = 'INR' } = await req.json();

    if (!planId || !billingCycle || !amount) {
      return errorResponse('Missing required fields: planId, billingCycle, amount');
    }

    // Generate unique order ID
    const orderId = `TL_${user.id.substring(0, 8)}_${Date.now()}`;

    // Create Cashfree order
    const orderData = {
      order_id: orderId,
      order_amount: amount,
      order_currency: currency,
      customer_details: {
        customer_id: user.id,
        customer_email: user.email || '',
        customer_phone: user.phone || '0000000000',
        customer_name: user.user_metadata?.full_name || 'TradeLens User',
      },
      order_meta: {
        return_url: `${Deno.env.get('FRONTEND_URL')}/payment-confirmation`,
        notify_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/cashfree-webhook`,
      },
    };

    const cashfreeResponse = await createCashfreeOrder(orderData);

    return successResponse({
      order_id: orderId,
      cf_order_id: cashfreeResponse.cf_order_id,
      payment_session_id: cashfreeResponse.payment_session_id,
      order_status: cashfreeResponse.order_status,
    });
  } catch (error) {
    console.error('Error creating Cashfree order:', error);
    return errorResponse(error.message, 500);
  }
});
