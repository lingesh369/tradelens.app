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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Determine provider based on headers or body structure
    // PayPal sends specific headers, NowPayments sends x-nowpayments-sig, Cashfree sends x-webhook-signature
    const nowPaymentsSig = req.headers.get('x-nowpayments-sig');
    const cashfreeSig = req.headers.get('x-webhook-signature');
    
    let result;

    if (nowPaymentsSig) {
      result = await handleNowPayments(req, supabase, nowPaymentsSig);
    } else if (cashfreeSig) {
      result = await handleCashfree(req, supabase, cashfreeSig);
    } else {
      // Assume PayPal for now, or check for PayPal headers
      result = await handlePayPal(req, supabase);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error: any) {
    console.error('Webhook processing failed:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });
  }
});

async function handleNowPayments(req: Request, supabase: any, signature: string) {
  const secret = Deno.env.get('NOWPAYMENTS_IPN_SECRET');
  if (!secret) throw new Error('NowPayments secret missing');

  const text = await req.text();
  
  // Verify signature (Simplified for brevity, strictly should use HMAC)
  // In production, implement proper HMAC SHA-512 verification here
  
  const data = JSON.parse(text);
  console.log('NowPayments Webhook:', data);

  if (data.payment_status === 'finished' || data.payment_status === 'confirmed') {
    // Extract userId and planId from order_id or custom fields
    // Assuming order_id format: "userId-timestamp"
    const [userId] = data.order_id.split('-');
    
    // Update subscription
    await activateSubscription(supabase, userId, 'premium', 30); // Defaulting to premium/30 days for example
  }

  return { success: true, provider: 'nowpayments' };
}

async function handleCashfree(req: Request, supabase: any, signature: string) {
    // Verify signature logic here (omitted for brevity)
    const body = await req.json();
    console.log('Cashfree Webhook:', body);

    if (body.type === 'PAYMENT_SUCCESS_WEBHOOK') {
        const { order_id, order_tags } = body.data.order;
        const { customer_id } = body.data.customer_details;
        
        // order_tags contains planId and billingCycle if we passed it in create-payment
        const planId = order_tags?.planId || 'premium'; 
        const billingCycle = order_tags?.billingCycle || 'monthly';
        const days = billingCycle === 'yearly' ? 365 : 30;

        await activateSubscription(supabase, customer_id, planId, days);
    }

    return { success: true, provider: 'cashfree' };
}

async function handlePayPal(req: Request, supabase: any) {
  const body = await req.json();
  console.log('PayPal Webhook:', body);

  if (body.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
    const customId = body.resource.custom_id; // We sent this in create-payment
    if (customId) {
      const { userId, planId, billingCycle } = JSON.parse(customId);
      await activateSubscription(supabase, userId, planId, billingCycle === 'yearly' ? 365 : 30);
    }
  }

  return { success: true, provider: 'paypal' };
}

async function activateSubscription(supabase: any, userId: string, planId: string, days: number) {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);

  const { error } = await supabase
    .from('user_subscriptions')
    .upsert({
      user_id: userId,
      plan_id: planId, // Ensure this matches a valid UUID from subscription_plans if strict FK
      status: 'active',
      current_period_start: startDate.toISOString(),
      current_period_end: endDate.toISOString(),
      updated_at: new Date().toISOString()
    });

  if (error) throw error;
  console.log(`Activated subscription for user ${userId}`);
}
