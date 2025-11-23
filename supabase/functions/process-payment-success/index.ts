import { handleCors } from '../_shared/cors.ts';
import { verifyAuth, createServiceClient } from '../_shared/auth.ts';
import { successResponse, errorResponse } from '../_shared/response.ts';

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { user } = await verifyAuth(req);
    const { paymentId, planId, billingCycle } = await req.json();

    if (!paymentId || !planId || !billingCycle) {
      return errorResponse('Missing required fields');
    }

    const supabase = createServiceClient();

    // Verify payment exists and belongs to user
    const { data: payment } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .eq('user_id', user.id)
      .single();

    if (!payment) {
      return errorResponse('Payment not found', 404);
    }

    if (payment.status !== 'completed') {
      return errorResponse('Payment not completed', 400);
    }

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date(startDate);
    
    if (billingCycle === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (billingCycle === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Create or update subscription
    const { error: subError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: user.id,
        plan_id: planId,
        status: 'active',
        current_period_start: startDate.toISOString(),
        current_period_end: endDate.toISOString(),
        billing_cycle: billingCycle,
        payment_provider: payment.payment_provider,
        updated_at: new Date().toISOString(),
      });

    if (subError) {
      console.error('Error creating subscription:', subError);
      return errorResponse('Failed to activate subscription', 500);
    }

    return successResponse({
      success: true,
      subscription_active: true,
    });
  } catch (error) {
    console.error('Error processing payment success:', error);
    return errorResponse(error.message, 500);
  }
});
