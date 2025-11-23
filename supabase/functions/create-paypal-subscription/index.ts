import { handleCors } from '../_shared/cors.ts';
import { verifyAuth } from '../_shared/auth.ts';
import { successResponse, errorResponse } from '../_shared/response.ts';
import { createPayPalOrder } from '../_shared/payment-providers/paypal.ts';

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { user } = await verifyAuth(req);
    const { planId, amount, currency = 'USD' } = await req.json();

    if (!planId || !amount) {
      return errorResponse('Missing required fields: planId, amount');
    }

    console.log('Creating PayPal order for user:', user.id, 'plan:', planId);

    const paypalOrder = await createPayPalOrder(amount, currency, planId);

    return successResponse({
      orderId: paypalOrder.id,
      status: paypalOrder.status,
      links: paypalOrder.links,
    });
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    return errorResponse(error.message, 500);
  }
});
