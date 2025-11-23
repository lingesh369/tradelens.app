import { corsHeaders } from '../_shared/cors.ts';
import { createServiceClient } from '../_shared/auth.ts';

Deno.serve(async (req) => {
  // Verify cron secret for security
  const authHeader = req.headers.get('Authorization');
  const cronSecret = Deno.env.get('CRON_SECRET');
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const supabase = createServiceClient();
    const now = new Date();
    
    // Calculate dates for trial expiry warnings
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    const oneDayFromNow = new Date(now);
    oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);

    console.log('Running trial expiry check at:', now.toISOString());

    // Find trials expiring in 3 days
    const { data: threeDayTrials, error: threeDayError } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        app_users!inner(email, first_name)
      `)
      .eq('status', 'trialing')
      .gte('trial_end', now.toISOString())
      .lte('trial_end', threeDaysFromNow.toISOString());

    if (threeDayError) throw threeDayError;

    // Find trials expiring in 1 day
    const { data: oneDayTrials, error: oneDayError } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        app_users!inner(email, first_name)
      `)
      .eq('status', 'trialing')
      .gte('trial_end', now.toISOString())
      .lte('trial_end', oneDayFromNow.toISOString());

    if (oneDayError) throw oneDayError;

    let notificationsSent = 0;

    // Send 3-day warnings
    if (threeDayTrials && threeDayTrials.length > 0) {
      const notifications = threeDayTrials.map((sub) => ({
        user_id: sub.user_id,
        title: 'Trial Ending Soon',
        message: 'Your trial ends in 3 days. Upgrade now to keep your premium features!',
        type: 'info',
        url: '/pricing',
        is_read: false,
      }));

      const { error: notifError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (!notifError) {
        notificationsSent += threeDayTrials.length;
      }

      console.log(`Sent 3-day warnings to ${threeDayTrials.length} users`);
    }

    // Send 1-day warnings
    if (oneDayTrials && oneDayTrials.length > 0) {
      const notifications = oneDayTrials.map((sub) => ({
        user_id: sub.user_id,
        title: 'Trial Ending Tomorrow',
        message: 'Your trial ends tomorrow! Upgrade now to avoid losing access.',
        type: 'warning',
        url: '/pricing',
        is_read: false,
      }));

      const { error: notifError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (!notifError) {
        notificationsSent += oneDayTrials.length;
      }

      console.log(`Sent 1-day warnings to ${oneDayTrials.length} users`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        three_day_warnings: threeDayTrials?.length || 0,
        one_day_warnings: oneDayTrials?.length || 0,
        notifications_sent: notificationsSent,
        checked_at: now.toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Cron job error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
