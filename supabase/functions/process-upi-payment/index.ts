import { handleCors } from '../_shared/cors.ts';
import { verifyAuth, createServiceClient } from '../_shared/auth.ts';
import { successResponse, errorResponse } from '../_shared/response.ts';

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { user } = await verifyAuth(req);
    const { upiId, amount, planId, billingCycle } = await req.json();

    if (!upiId || !amount || !planId || !billingCycle) {
      return errorResponse('Missing required fields');
    }

    const supabase = createServiceClient();

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: user.id,
        plan_id: planId,
        amount,
        currency: 'INR',
        billing_cycle: billingCycle,
        payment_provider: 'upi',
        status: 'pending',
        transaction_id: `UPI_${Date.now()}`,
        payment_details: { upi_id: upiId },
      })
      .select()
      .single();

    if (paymentError) {
      return errorResponse('Failed to create payment record', 500);
    }

    // Note: UPI payments typically require manual verification
    // This is a placeholder - integrate with actual UPI gateway
    return successResponse({
      success: true,
      payment_id: payment.id,
      message: 'UPI payment initiated. Please complete payment and verify.',
    });
  } catch (error) {
    console.error('Error processing UPI payment:', error);
    return errorResponse(error.message, 500);
  }
});
