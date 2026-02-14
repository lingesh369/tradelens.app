import { handleCors } from '../_shared/cors.ts';
import { verifyAuth, createServiceClient } from '../_shared/auth.ts';
import { successResponse, errorResponse } from '../_shared/response.ts';
import { createPayPalOrder } from '../_shared/payment-providers/paypal.ts';

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { user } = await verifyAuth(req);
    const { planId, billingCycle = 'monthly' } = await req.json();

    if (!planId) {
      return errorResponse('Missing required field: planId');
    }

    const supabase = createServiceClient();

    // Get plan details from database for security and consistency
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('name', planId)
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      console.error('Plan not found:', planError);
      return errorResponse('Invalid subscription plan', 400);
    }

    const amount = billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
    const currency = plan.currency || 'USD';

    console.log('Creating PayPal order for user:', user.id, 'plan:', plan.name, 'amount:', amount);

    // Create unique reference for this transaction
    const referenceId = `${user.id}_${plan.id}_${billingCycle}`;

    const paypalOrder = await createPayPalOrder(amount, currency, referenceId);

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
