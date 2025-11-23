import { handleCors } from '../_shared/cors.ts';
import { verifyAuth, createServiceClient } from '../_shared/auth.ts';
import { successResponse, errorResponse } from '../_shared/response.ts';
import { sendPushNotification } from '../_shared/notifications/push.ts';

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    await verifyAuth(req);
    const { userIds, title, message, url, data } = await req.json();

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return errorResponse('User IDs array required');
    }

    if (!title || !message) {
      return errorResponse('Title and message required');
    }

    const supabase = createServiceClient();

    // Get push subscriptions for the specified users
    const { data: subscriptions, error } = await supabase
      .from('user_push_tokens')
      .select('subscription_data')
      .in('user_id', userIds);

    if (error) throw error;

    if (!subscriptions || subscriptions.length === 0) {
      return successResponse({
        success: true,
        sent: 0,
        message: 'No push subscriptions found for specified users',
      });
    }

    // Send push notifications
    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        sendPushNotification(sub.subscription_data, {
          title,
          body: message,
          url,
          data,
        })
      )
    );

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return successResponse({
      success: true,
      sent: successful,
      failed,
      total: subscriptions.length,
    });
  } catch (error) {
    console.error('Send web push error:', error);
    return errorResponse(error.message, 500);
  }
});
