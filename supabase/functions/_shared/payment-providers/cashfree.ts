import { createHmac } from 'https://deno.land/std@0.177.0/node/crypto.ts';

const CASHFREE_APP_ID = Deno.env.get('CASHFREE_APP_ID') ?? '';
const CASHFREE_SECRET_KEY = Deno.env.get('CASHFREE_SECRET_KEY') ?? '';
const CASHFREE_API_VERSION = '2023-08-01';
const CASHFREE_BASE_URL = Deno.env.get('CASHFREE_ENV') === 'production'
  ? 'https://api.cashfree.com/pg'
  : 'https://sandbox.cashfree.com/pg';

export interface CashfreeOrderRequest {
  order_id: string;
  order_amount: number;
  order_currency: string;
  customer_details: {
    customer_id: string;
    customer_email: string;
    customer_phone: string;
    customer_name?: string;
  };
  order_meta?: {
    return_url?: string;
    notify_url?: string;
  };
}

export async function createCashfreeOrder(orderData: CashfreeOrderRequest) {
  const response = await fetch(`${CASHFREE_BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-version': CASHFREE_API_VERSION,
      'x-client-id': CASHFREE_APP_ID,
      'x-client-secret': CASHFREE_SECRET_KEY,
    },
    body: JSON.stringify(orderData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Cashfree API error: ${JSON.stringify(error)}`);
  }

  return await response.json();
}

export async function getCashfreeOrderStatus(orderId: string) {
  const response = await fetch(`${CASHFREE_BASE_URL}/orders/${orderId}`, {
    method: 'GET',
    headers: {
      'x-api-version': CASHFREE_API_VERSION,
      'x-client-id': CASHFREE_APP_ID,
      'x-client-secret': CASHFREE_SECRET_KEY,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Cashfree API error: ${JSON.stringify(error)}`);
  }

  return await response.json();
}

export function verifyCashfreeWebhook(
  timestamp: string,
  rawBody: string,
  signature: string
): boolean {
  const signatureData = `${timestamp}${rawBody}`;
  const expectedSignature = createHmac('sha256', CASHFREE_SECRET_KEY)
    .update(signatureData)
    .digest('base64');

  return signature === expectedSignature;
}
