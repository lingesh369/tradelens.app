import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { provider, planId, amount, userId, billingCycle, couponCode } = await req.json();

    if (!provider || !planId || !amount || !userId) {
      throw new Error('Missing required fields: provider, planId, amount, userId');
    }

    console.log(`Processing ${provider} payment for user ${userId}, plan ${planId}`);

    let result;

    if (provider === 'paypal') {
      result = await createPayPalOrder(planId, amount, userId, billingCycle);
    } else if (provider === 'cashfree') {
      result = await createCashfreeOrder(planId, amount, userId, billingCycle);
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error: any) {
    console.error('Payment creation failed:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });
  }
});

// PayPal Implementation
async function createPayPalOrder(planId: string, amount: string, userId: string, billingCycle: string) {
  const clientId = Deno.env.get('PAYPAL_CLIENT_ID');
  const clientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET');
  const baseUrl = 'https://api-m.paypal.com'; // Use sandbox for dev if needed: https://api-m.sandbox.paypal.com

  if (!clientId || !clientSecret) throw new Error('PayPal credentials missing');

  // Get Access Token
  const auth = btoa(`${clientId}:${clientSecret}`);
  const tokenResp = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  const { access_token } = await tokenResp.json();

  // Create Order
  const orderResp = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: amount
        },
        custom_id: JSON.stringify({ userId, planId, billingCycle }) // Pass metadata
      }],
      application_context: {
        return_url: `${Deno.env.get('APP_URL') || 'http://localhost:3000'}/payment/success`,
        cancel_url: `${Deno.env.get('APP_URL') || 'http://localhost:3000'}/payment/cancel`
      }
    })
  });

  const orderData = await orderResp.json();
  const approvalUrl = orderData.links.find((l: any) => l.rel === 'approve')?.href;

  return {
    orderId: orderData.id,
    approvalUrl,
    provider: 'paypal'
  };
}

// NowPayments Implementation
async function createNowPaymentsInvoice(planId: string, amount: string, userId: string, billingCycle: string) {
  const apiKey = Deno.env.get('NOWPAYMENTS_API_KEY');
  const baseUrl = 'https://api.nowpayments.io/v1';

  if (!apiKey) throw new Error('NowPayments API key missing');

  const resp = await fetch(`${baseUrl}/invoice`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      price_amount: parseFloat(amount),
      price_currency: 'usd',
      order_id: `${userId}-${Date.now()}`, // Unique order ID
      order_description: `Subscription: ${planId} (${billingCycle})`,
      ipn_callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/handle-payment-webhook`,
      success_url: `${Deno.env.get('APP_URL') || 'http://localhost:3000'}/payment/success`,
      cancel_url: `${Deno.env.get('APP_URL') || 'http://localhost:3000'}/payment/cancel`
    })
  });

  const data = await resp.json();

  return {
    orderId: data.id,
    approvalUrl: data.invoice_url,
    provider: 'nowpayments'
  };
}

// Cashfree Implementation
async function createCashfreeOrder(planId: string, amount: string, userId: string, billingCycle: string) {
  const appId = Deno.env.get('CASHFREE_APP_ID');
  const secretKey = Deno.env.get('CASHFREE_SECRET_KEY');
  const baseUrl = 'https://sandbox.cashfree.com/pg'; // Use sandbox for dev

  if (!appId || !secretKey) throw new Error('Cashfree credentials missing');

  const orderId = `order_${userId}_${Date.now()}`;
  
  const resp = await fetch(`${baseUrl}/orders`, {
    method: 'POST',
    headers: {
      'x-client-id': appId,
      'x-client-secret': secretKey,
      'x-api-version': '2022-09-01',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      order_id: orderId,
      order_amount: parseFloat(amount),
      order_currency: 'INR', // Cashfree is typically INR
      customer_details: {
        customer_id: userId,
        customer_phone: '9999999999' // Required by Cashfree, maybe fetch from user profile or use dummy
      },
      order_meta: {
        return_url: `${Deno.env.get('APP_URL') || 'http://localhost:3000'}/payment/success?order_id={order_id}`,
        notify_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/handle-payment-webhook`
      },
      order_tags: {
        planId,
        billingCycle
      }
    })
  });

  const data = await resp.json();

  if (data.type === 'error') {
      throw new Error(data.message);
  }

  return {
    orderId: data.order_id,
    paymentSessionId: data.payment_session_id,
    provider: 'cashfree'
  };
}
