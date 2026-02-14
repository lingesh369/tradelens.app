import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
const PAYPAL_CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID');
const PAYPAL_CLIENT_SECRET = Deno.env.get('PAYPAL_CLIENT_SECRET');
const PAYPAL_ENV = Deno.env.get('PAYPAL_ENV') || 'sandbox';
const PAYPAL_BASE_URL = PAYPAL_ENV === 'production' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
async function getPayPalAccessToken() {
  const auth = btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`);
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${auth}`
    },
    body: 'grant_type=client_credentials'
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error('Failed to get PayPal access token');
  }
  return data.access_token;
}
async function createPayPalOrder(accessToken, planId, amount) {
  const orderData = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        reference_id: planId,
        amount: {
          currency_code: 'USD',
          value: amount.toFixed(2)
        },
        description: `TradeLens ${planId} Plan`
      }
    ],
    application_context: {
      return_url: `https://app.tradelens.app/dashboard`,
      cancel_url: `https://app.tradelens.app/pricing`
    }
  };
  const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify(orderData)
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error('Failed to create PayPal order');
  }
  return data;
}
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    const { planId } = await req.json();
    if (!planId) {
      throw new Error('Plan ID is required');
    }
    // Get plan details from database
    const { data: plan, error: planError } = await supabase.from('subscription_plans').select('price_monthly, name').eq('plan_id', planId).single();
    if (planError || !plan) {
      throw new Error('Plan not found');
    }
    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();
    // Create PayPal order
    const order = await createPayPalOrder(accessToken, planId, plan.price_monthly);
    return new Response(JSON.stringify({
      success: true,
      orderId: order.id
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 400
    });
  }
});
