import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://your-production-domain.com', // Replace with your actual production domain
  'https://your-staging-domain.com',    // Replace with your staging domain
  ...(Deno.env.get('NODE_ENV') === 'development' || Deno.env.get('ENVIRONMENT') === 'local' 
    ? ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173'] 
    : []
  )
];

// Get CORS headers based on origin
export function getCorsHeaders(origin: string | null): Record<string, string> {
  // Check if origin is allowed
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature, x-webhook-timestamp, x-nowpayments-sig',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400', // 24 hours
    };
  }
  
  // For development, allow localhost
  if (Deno.env.get('NODE_ENV') === 'development' && origin?.includes('localhost')) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature, x-webhook-timestamp, x-nowpayments-sig',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Credentials': 'true',
    };
  }
  
  // Reject unknown origins
  return {};
}

// Legacy wildcard CORS for backward compatibility (use getCorsHeaders instead)
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    const origin = req.headers.get('origin');
    const headers = getCorsHeaders(origin);
    
    // If no headers returned, origin is not allowed
    if (Object.keys(headers).length === 0) {
      return new Response('Forbidden', { status: 403 });
    }
    
    return new Response('ok', { headers });
  }
  return null;
}
