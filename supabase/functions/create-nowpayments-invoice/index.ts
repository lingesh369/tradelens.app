import { handleCors } from '../_shared/cors.ts';
import { verifyAuth, createServiceClient } from '../_shared/auth.ts';
import { successResponse, errorResponse } from '../_shared/response.ts';
import { createNowPaymentsInvoice } from '../_shared/payment-providers/nowpayments.ts';

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { user } = await verifyAuth(req);
    const { planId, billingCycle } = await req.json();

    if (!planId || !billingCycle) {
      return errorResponse('Missing required fields: planId, billingCycle');
    }

    const supabase = createServiceClient();

    // Fetch plan details from database
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
    const currency = 'USD'; // NOWPayments takes fiat amount and converts

    // Generate unique order ID
    const orderId = `TL_NP_${user.id.substring(0, 8)}_${Date.now()}`;

    // Create NOWPayments invoice
    const invoiceData = {
      price_amount: amount,
      price_currency: currency,
      order_id: orderId,
      order_description: `${planId}:${billingCycle}:${user.id}`, // Encode meta in description or if API supports metadata
      ipn_callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/nowpayments-webhook`,
      success_url: `${Deno.env.get('FRONTEND_URL')}/payment-confirmation?order_id=${orderId}`,
      cancel_url: `${Deno.env.get('FRONTEND_URL')}/pricing`,
    };

    const invoice = await createNowPaymentsInvoice(invoiceData);

    // Create pending payment record
    const { error: insertError } = await supabase
      .from('payment_history')
      .insert({
        user_id: user.id,
        amount: amount,
        currency: currency,
        status: 'pending',
        payment_method: 'crypto',
        payment_gateway: 'nowpayments',
        gateway_order_id: invoice.id, // Store invoice ID to match webhook
        transaction_id: orderId,      // Our internal order ID
        metadata: { 
            nowpayments_invoice_id: invoice.id,
            plan_id: planId,
            billing_cycle: billingCycle,
            invoice_url: invoice.invoice_url
        }
      });

    if (insertError) {
        console.error('Error storing payment record:', insertError);
        // We still return success so user can pay, but logging is critical.
        // Ideally we might fail here, but invoice is already created on NOWPayments side.
    }

    return successResponse({
      invoice_id: invoice.id,
      invoice_url: invoice.invoice_url,
      order_id: orderId,
    });
  } catch (error) {
    console.error('Error creating NOWPayments invoice:', error);
    return errorResponse(error.message, 500);
  }
});
