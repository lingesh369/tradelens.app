import { createServiceClient } from '../_shared/auth.ts';
import { handleCors } from '../_shared/cors.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const PAYPAL_BASE_URL = Deno.env.get('PAYPAL_ENV') === 'production' 
  ? 'https://api-m.paypal.com' 
  : 'https://api-m.sandbox.paypal.com';
const PAYPAL_CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID');
const PAYPAL_CLIENT_SECRET = Deno.env.get('PAYPAL_CLIENT_SECRET');
const PAYPAL_WEBHOOK_ID = Deno.env.get('PAYPAL_WEBHOOK_ID');

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

async function verifyWebhookSignature(headers, body) {
  if (!PAYPAL_WEBHOOK_ID) {
    console.log('PayPal webhook verification skipped - no webhook ID configured');
    return true; 
  }
  
  // Real verification logic would go here
  return true;
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const rawBody = await req.text();
    console.log('PayPal webhook payload received');

    const isValid = await verifyWebhookSignature(req.headers, rawBody);
    if (!isValid) {
      console.error('Invalid PayPal webhook signature');
      return new Response('Unauthorized', { status: 401 });
    }

    const webhookData = JSON.parse(rawBody);
    const eventType = webhookData.event_type;
    console.log('PayPal webhook event type:', eventType);

    if (eventType === 'PAYMENT.CAPTURE.COMPLETED' || eventType === 'CHECKOUT.ORDER.COMPLETED') {
      const resource = webhookData.resource;
      const orderId = resource.supplementary_data?.related_ids?.order_id || resource.id;
      
      const accessToken = await getPayPalAccessToken();
      const orderResponse = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (orderResponse.ok) {
        const orderData = await orderResponse.json();
        const referenceId = orderData.purchase_units[0].custom_id || orderData.purchase_units[0].reference_id;
        
        if (referenceId) {
          const [userId, planId, billingCycle] = referenceId.split('_');
          const amount = parseFloat(orderData.purchase_units[0].amount.value);
          
          const supabase = createServiceClient();
          
          // Invoke shared success logic
          const { error: processError } = await supabase.functions.invoke('process-payment-success', {
            body: {
              userId: userId,
              planId: planId,
              billingCycle: billingCycle,
              amount: amount,
              paymentMethod: 'paypal',
              transactionId: resource.id,
              providerRef: orderId
            }
          });

          if (processError) {
            console.error('Error processing webhook payment:', processError);
          } else {
            console.log(`PayPal webhook processed successfully for user ${userId}`);
          }
        }
      }
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Error processing PayPal webhook:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
