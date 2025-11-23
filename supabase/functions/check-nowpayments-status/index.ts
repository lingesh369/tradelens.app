import { handleCors } from '../_shared/cors.ts';
import { verifyAuth } from '../_shared/auth.ts';
import { successResponse, errorResponse } from '../_shared/response.ts';
import { getNowPaymentsInvoiceStatus } from '../_shared/payment-providers/nowpayments.ts';

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    await verifyAuth(req);
    const { invoice_id } = await req.json();

    if (!invoice_id) {
      return errorResponse('Missing invoice_id');
    }

    const invoiceStatus = await getNowPaymentsInvoiceStatus(invoice_id);

    return successResponse({
      status: invoiceStatus.payment_status,
      invoice_id: invoiceStatus.id,
      order_id: invoiceStatus.order_id,
      payment_status: invoiceStatus.payment_status,
    });
  } catch (error) {
    console.error('Error checking NOWPayments status:', error);
    return errorResponse(error.message, 500);
  }
});
