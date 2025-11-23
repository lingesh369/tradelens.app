import { handleCors } from '../_shared/cors.ts';
import { verifyAuth } from '../_shared/auth.ts';
import { successResponse, errorResponse } from '../_shared/response.ts';
import { createNowPaymentsInvoice } from '../_shared/payment-providers/nowpayments.ts';

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { user } = await verifyAuth(req);
    const { planId, amount, currency = 'USD', billingCycle } = await req.json();

    if (!planId || !amount || !billingCycle) {
      return errorResponse('Missing required fields: planId, amount, billingCycle');
    }

    const orderId = `TL_NP_${user.id.substring(0, 8)}_${Date.now()}`;

    const invoiceData = {
      price_amount: amount,
      price_currency: currency,
      order_id: orderId,
      order_description: `TradeLens ${planId} - ${billingCycle}`,
      ipn_callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/nowpayments-webhook`,
      success_url: `${Deno.env.get('FRONTEND_URL')}/payment-confirmation`,
      cancel_url: `${Deno.env.get('FRONTEND_URL')}/pricing`,
    };

    const invoice = await createNowPaymentsInvoice(invoiceData);

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
