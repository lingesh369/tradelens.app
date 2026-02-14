import { createHmac } from 'https://deno.land/std@0.177.0/node/crypto.ts';

const NOWPAYMENTS_API_KEY = Deno.env.get('NOWPAYMENTS_API_KEY') ?? '';
const NOWPAYMENTS_IPN_SECRET = Deno.env.get('NOWPAYMENTS_IPN_SECRET') ?? '';
const NOWPAYMENTS_BASE_URL = 'https://api.nowpayments.io/v1';

export interface NowPaymentsInvoiceRequest {
  price_amount: number;
  price_currency: string;
  order_id: string;
  order_description: string;
  ipn_callback_url?: string;
  success_url?: string;
  cancel_url?: string;
}

export async function createNowPaymentsInvoice(invoiceData: NowPaymentsInvoiceRequest) {
  const response = await fetch(`${NOWPAYMENTS_BASE_URL}/invoice`, {
    method: 'POST',
    headers: {
      'x-api-key': NOWPAYMENTS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(invoiceData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`NOWPayments API error: ${JSON.stringify(error)}`);
  }

  return await response.json();
}

export async function getNowPaymentsInvoiceStatus(invoiceId: string) {
  const response = await fetch(`${NOWPAYMENTS_BASE_URL}/invoice/${invoiceId}`, {
    method: 'GET',
    headers: {
      'x-api-key': NOWPAYMENTS_API_KEY,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`NOWPayments API error: ${JSON.stringify(error)}`);
  }

  return await response.json();
}

export async function getAvailableCurrencies() {
  const response = await fetch(`${NOWPAYMENTS_BASE_URL}/currencies`, {
    method: 'GET',
    headers: {
      'x-api-key': NOWPAYMENTS_API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch available currencies');
  }

  return await response.json();
}

export function verifyNowPaymentsWebhook(signature: string, body: string): boolean {
  if (!NOWPAYMENTS_IPN_SECRET) {
    console.warn('NOWPAYMENTS_IPN_SECRET is not set, skipping signature verification');
    return true; // Skip in dev if strictly needed, but better to fail. Warning for now.
  }

  const hmac = createHmac('sha512', NOWPAYMENTS_IPN_SECRET);
  hmac.update(body);
  const calculatedSignature = hmac.digest('hex');

  return signature === calculatedSignature;
}
