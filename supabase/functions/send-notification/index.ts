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

    // Send email notifications if enabled
    if (sendEmail) {
      // Fetch emails for the users
      // Note: In a high-volume scenario, we might want to batch this or use a more efficient query.
      // For now, iterating or using 'in' with caution. 
      // Supabase Auth Admin getUserById is single-user. 
      // We'll trust the 'email_logs' table might also help, but best source is auth.
      // Actually, we can just insert into email_queue with user_id, and let process-email-queue fetch the email if it's missing?
      // Looking at process-email-queue (Step 328), it uses recipient_email from the queue row.
      // So we MUST fetch the email here.
      
      // OPTIMIZATION: If we had an 'app_users' public email column, we could query that.
      // Assuming 'app_users' has 'email' (it often does in these schemas as a cache).
      
      const { data: usersWithEmail, error: usersError } = await supabase
        .from('app_users')
        .select('id, email')
        .in('id', userIds);

      if (!usersError && usersWithEmail) {
          const emailInserts = usersWithEmail.map(u => ({
              user_id: u.id,
              recipient_email: u.email,
              email_type: 'general_notification', // Generic type
              status: 'pending',
              subject: title,
              email_data: {
                  message: message,
                  url: url,
                  type: type
              }
          }));

          if (emailInserts.length > 0) {
              const { error: queueError } = await supabase
                  .from('email_queue')
                  .insert(emailInserts);
              
              if (queueError) {
                  console.error('Failed to queue emails:', queueError);
              } else {
                  console.log(`Queued ${emailInserts.length} emails`);
              }
          }
      }
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
