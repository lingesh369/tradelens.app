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
    const now = new Date().toISOString();

    console.log('Running subscription expiration check at:', now);

    // Find expired subscriptions
    const { data: expiredSubs, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('status', 'active')
      .lt('current_period_end', now);

    if (error) throw error;

    if (!expiredSubs || expiredSubs.length === 0) {
      console.log('No expired subscriptions found');
      return new Response(
        JSON.stringify({ message: 'No expired subscriptions', checked: now }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${expiredSubs.length} expired subscriptions`);

    // Update expired subscriptions
    const updates = expiredSubs.map((sub) => ({
      id: sub.id,
      status: 'expired',
      updated_at: now,
    }));

    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .upsert(updates);

    if (updateError) throw updateError;

    // Create notifications for expired subscriptions
    const notifications = expiredSubs.map((sub) => ({
      user_id: sub.user_id,
      title: 'Subscription Expired',
      message: 'Your subscription has expired. Please renew to continue using premium features.',
      type: 'warning',
      url: '/pricing',
      is_read: false,
    }));

    const { error: notifError } = await supabase
      .from('notifications')
      .insert(notifications);

    if (notifError) {
      console.error('Error creating notifications:', notifError);
    }

    console.log(`Updated ${expiredSubs.length} subscriptions to expired status`);

    return new Response(
      JSON.stringify({
        success: true,
        expired_count: expiredSubs.length,
        checked_at: now,
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
