import { handleCors } from '../_shared/cors.ts';
import { successResponse, errorResponse } from '../_shared/response.ts';
import { getVapidPublicKey } from '../_shared/notifications/push.ts';

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const publicKey = getVapidPublicKey();

    if (!publicKey) {
      return errorResponse('VAPID keys not configured', 500);
    }

    return successResponse({ publicKey });
  } catch (error) {
    console.error('Error getting VAPID key:', error);
    return errorResponse(error.message, 500);
  }
});
