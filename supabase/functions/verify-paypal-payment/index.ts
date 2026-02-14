import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
const PAYPAL_BASE_URL = Deno.env.get('PAYPAL_BASE_URL') || 'https://api-m.sandbox.paypal.com';
const PAYPAL_CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID');
const PAYPAL_CLIENT_SECRET = Deno.env.get('PAYPAL_CLIENT_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
  console.error('Missing PayPal credentials in environment variables');
}
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase credentials in environment variables');
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
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
    console.error('Failed to get PayPal access token:', data);
    throw new Error('Failed to authenticate with PayPal');
  }
  return data.access_token;
}
async function verifyPayPalOrder(token, orderId) {
  const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  if (!response.ok) {
    console.error('Failed to verify PayPal order:', data);
    throw new Error('Failed to verify PayPal payment');
  }
  return data;
}
async function verifyPayPalSubscription(token, subscriptionId) {
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/billing/subscriptions/${subscriptionId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  if (!response.ok) {
    console.error('Failed to verify PayPal subscription:', data);
    throw new Error('Failed to verify PayPal subscription');
  }
  return data;
}
async function updateUserSubscription(userId, subscriptionDetails, isSubscription) {
  try {
    // Get the transaction ID
    const paypalId = isSubscription ? subscriptionDetails.id : subscriptionDetails.id;
    const status = isSubscription ? subscriptionDetails.status : subscriptionDetails.status;
    if (!paypalId) {
      throw new Error('No PayPal ID found in the verification response');
    }
    // Find the associated subscription record
    const { data: subscriptionData, error: subscriptionQueryError } = await supabase.from('user_subscriptions').select('*').eq('user_id', userId).eq('status', 'pending').order('created_at', {
      ascending: false
    }).limit(1).single();
    if (subscriptionQueryError) {
      console.error('Error querying subscription:', subscriptionQueryError);
      throw new Error('Failed to find subscription record');
    }
    if (!subscriptionData) {
      throw new Error('No pending subscription found for this user');
    }
    // Update the subscription status
    const { error: updateError } = await supabase.from('user_subscriptions').update({
      status: 'active',
      payment_method_id: 'paypal',
      payment_provider_subscription_id: paypalId,
      updated_at: new Date().toISOString()
    }).eq('subscription_id', subscriptionData.subscription_id);
    if (updateError) {
      console.error('Error updating subscription:', updateError);
      throw new Error('Failed to update subscription status');
    }
    // Update payment record
    const { error: paymentError } = await supabase.from('payment_history').update({
      status: 'succeeded',
      transaction_id: paypalId,
      updated_at: new Date().toISOString()
    }).eq('subscription_id', subscriptionData.subscription_id).eq('status', 'pending');
    if (paymentError) {
      console.error('Error updating payment record:', paymentError);
    // Not throwing here as this is not critical to the subscription activation
    }
    // Update user record with subscription info
    const { error: userError } = await supabase.from('users').update({
      subscription_plan: subscriptionData.plan_id,
      trial_active: false,
      current_subscription_id: subscriptionData.subscription_id,
      updated_at: new Date().toISOString()
    }).eq('user_id', userId);
    if (userError) {
      console.error('Error updating user record:', userError);
    // Not throwing here as this is not critical
    }
    return {
      success: true,
      subscriptionId: subscriptionData.subscription_id,
      planId: subscriptionData.plan_id
    };
  } catch (error) {
    console.error('Error updating user subscription:', error);
    throw error;
  }
}
serve(async (req)=>{
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    const requestData = await req.json();
    const { userId, paypalId, isSubscription = false } = requestData;
    console.log('Verifying PayPal payment:', requestData);
    if (!userId || !paypalId) {
      throw new Error('Missing required parameters');
    }
    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();
    // Verify with PayPal
    let verificationResult;
    if (isSubscription) {
      verificationResult = await verifyPayPalSubscription(accessToken, paypalId);
    } else {
      verificationResult = await verifyPayPalOrder(accessToken, paypalId);
    }
    console.log('PayPal verification result:', verificationResult);
    // Update user subscription
    const result = await updateUserSubscription(userId, verificationResult, isSubscription);
    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    console.error('Error verifying PayPal payment:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to verify payment'
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 400
    });
  }
});
