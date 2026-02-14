import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔄 Checking for expired trials...');

    // Find subscriptions that are 'trialing' and past their end date
    const { data: expiredTrials, error } = await supabase
      .from('user_subscriptions')
      .select('id, user_id, plan_id')
      .eq('status', 'trialing')
      .lt('current_period_end', new Date().toISOString());

    if (error) throw error;

    console.log(`Found ${expiredTrials?.length || 0} expired trials`);

    for (const sub of expiredTrials || []) {
      // 1. Fetch user email
      const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(sub.user_id);
      
      if (userError || !user || !user.email) {
          console.error(`Could not fetch user/email for sub ${sub.id}:`, userError);
          continue;
      }

      // 2. Check if email already queued today (Idempotency for email)
      // This prevents spamming if this cron runs multiple times or if processing failed but didn't update sub status yet
      const { data: existingEmail } = await supabase
          .from('email_queue')
          .select('id')
          .eq('user_id', sub.user_id)
          .eq('email_type', 'trial_expired')
          .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Within last 24h
          .maybeSingle();

      if (existingEmail) {
          console.log(`Trial expired email already queued for user ${sub.user_id}. Skipping.`);
      } else {
          // Queue email notification
          await supabase.from('email_queue').insert({
            user_id: sub.user_id,
            recipient_email: user.email,
            email_type: 'trial_expired',
            status: 'pending',
            subject: 'Your TradeLens Trial Has Expired',
            email_data: {
                plan_name: sub.plan_id // Add more data if needed
            }
          });
          console.log(`Queued expiration email for user ${sub.user_id}`);
      }

      // 3. Update status to expired
      // We do this AFTER queuing email to ensure we don't miss sending it if update succeeds but email fails (though valid point: if update fails, we might send email twice next run. With idempotency check above, we are safe).
      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update({ status: 'expired', updated_at: new Date().toISOString() })
        .eq('id', sub.id);

      if (updateError) {
          console.error(`Failed to update subscription status for ${sub.id}:`, updateError);
      } else {
          console.log(`Expired subscription ${sub.id} status updated.`);
      }
    }

    return new Response(JSON.stringify({ success: true, processed: expiredTrials?.length }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error: any) {
    console.error('Trial check failed:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
