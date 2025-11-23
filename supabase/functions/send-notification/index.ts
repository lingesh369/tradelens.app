import { handleCors } from '../_shared/cors.ts';
import { verifyAuth, createServiceClient } from '../_shared/auth.ts';
import { successResponse, errorResponse } from '../_shared/response.ts';
import { sendPushNotification } from '../_shared/notifications/push.ts';

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    await verifyAuth(req);
    const {
      userIds,
      title,
      message,
      type = 'info',
      url,
      sendPush = true,
      sendEmail = false,
    } = await req.json();

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return errorResponse('User IDs array required');
    }

    if (!title || !message) {
      return errorResponse('Title and message required');
    }

    const supabase = createServiceClient();

    // Create in-app notifications
    const notifications = userIds.map((userId) => ({
      user_id: userId,
      title,
      message,
      type,
      url,
      is_read: false,
    }));

    const { error: dbError } = await supabase
      .from('notifications')
      .insert(notifications);

    if (dbError) throw dbError;

    let pushResults = { sent: 0, failed: 0 };

    // Send push notifications if enabled
    if (sendPush) {
      const { data: subscriptions } = await supabase
        .from('user_push_tokens')
        .select('subscription_data')
        .in('user_id', userIds);

      if (subscriptions && subscriptions.length > 0) {
        const results = await Promise.allSettled(
          subscriptions.map((sub) =>
            sendPushNotification(sub.subscription_data, {
              title,
              body: message,
              url,
            })
          )
        );

        pushResults.sent = results.filter((r) => r.status === 'fulfilled').length;
        pushResults.failed = results.filter((r) => r.status === 'rejected').length;
      }
    }

    // TODO: Send email notifications if enabled
    if (sendEmail) {
      // Implement email sending logic here
      console.log('Email notifications not yet implemented');
    }

    return successResponse({
      success: true,
      notifications_created: userIds.length,
      push_sent: pushResults.sent,
      push_failed: pushResults.failed,
    });
  } catch (error) {
    console.error('Send notification error:', error);
    return errorResponse(error.message, 500);
  }
});
