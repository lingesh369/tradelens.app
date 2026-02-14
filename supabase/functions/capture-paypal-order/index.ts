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
async function capturePayPalOrder(accessToken, orderId) {
  const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    }
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error('Failed to capture PayPal order');
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
    const { orderId, planId } = await req.json();
    if (!orderId || !planId) {
      throw new Error('Order ID and Plan ID are required');
    }
    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: {
        headers: {
          authorization: authHeader
        }
      }
    });
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }
    // Get plan details
    const { data: plan, error: planError } = await supabase.from('subscription_plans').select('price_monthly, name').eq('plan_id', planId).single();
    if (planError || !plan) {
      throw new Error('Plan not found');
    }
    // Get PayPal access token and capture order
    const accessToken = await getPayPalAccessToken();
    const captureResult = await capturePayPalOrder(accessToken, orderId);
    // Verify payment was completed
    if (captureResult.status !== 'COMPLETED') {
      throw new Error('Payment not completed');
    }
    const capturedAmount = parseFloat(captureResult.purchase_units[0].payments.captures[0].amount.value);
    // Verify amount matches plan price
    if (Math.abs(capturedAmount - plan.price_monthly) > 0.01) {
      throw new Error('Payment amount mismatch');
    }
    // Get user's internal ID
    const { data: appUser } = await supabase.from('app_users').select('user_id').eq('auth_id', user.id).single();
    if (!appUser) {
      throw new Error('User profile not found');
    }
    const userId = appUser.user_id;
    // Insert payment record
    const { error: paymentError } = await supabase.from('payments').insert({
      user_id: userId,
      subscription_plan: planId,
      amount: capturedAmount,
      payment_method: 'paypal',
      payment_status: 'succeeded',
      description: `TradeLens ${plan.name} Plan`
    });
    if (paymentError) {
      console.error('Payment record error:', paymentError);
    }
    // Update user subscription
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30); // 30 days access
    const { error: subscriptionError } = await supabase.from('user_subscriptions_new').upsert({
      user_id: userId,
      plan_id: planId,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      status: 'active',
      payment_method: 'paypal',
      billing_cycle: 'monthly'
    }, {
      onConflict: 'user_id'
    });
    if (subscriptionError) {
      throw new Error('Failed to update subscription');
    }
    return new Response(JSON.stringify({
      success: true,
      message: 'Payment processed successfully'
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error capturing PayPal order:', error);
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
