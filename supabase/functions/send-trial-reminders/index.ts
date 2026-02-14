import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Verify cron secret
  const authHeader = req.headers.get('Authorization');
  const cronSecret = Deno.env.get('CRON_SECRET');
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔄 Checking for trials expiring in 3 days...');

    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    // Expand window slightly to catch anything in that day range we haven't processed
    const startWindow = new Date(threeDaysFromNow.getTime() - 12 * 60 * 60 * 1000).toISOString(); // 2.5 days
    const endWindow = new Date(threeDaysFromNow.getTime() + 12 * 60 * 60 * 1000).toISOString();   // 3.5 days

    // Find trials ending soon
    const { data: trialsEndingSoon, error } = await supabase
      .from('user_subscriptions')
      .select('id, user_id, current_period_end')
      .eq('status', 'trialing')
      .gte('current_period_end', startWindow)
      .lte('current_period_end', endWindow);

    if (error) throw error;

    console.log(`Found ${trialsEndingSoon?.length || 0} trials ending soon`);

    let emailsQueued = 0;

    for (const sub of trialsEndingSoon || []) {
      // 1. Fetch user email
      const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(sub.user_id);
      
      if (userError || !user || !user.email) {
          console.error(`Could not fetch user/email for sub ${sub.id}`);
          continue;
      }

      // 2. Check if already notified about trial ending
      const { data: existingEmail } = await supabase
          .from('email_queue')
          .select('id')
          .eq('user_id', sub.user_id)
          .eq('email_type', 'trial_ending_soon')
           // Check if sent in the last 7 days (don't send twice for same trial)
          .gt('created_at', new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .maybeSingle();

      if (existingEmail) {
          console.log(`Trial reminder already queued for user ${sub.user_id}. Skipping.`);
          continue;
      }

      // 3. Queue Email
      await supabase.from('email_queue').insert({
        user_id: sub.user_id,
        recipient_email: user.email,
        email_type: 'trial_ending_soon',
        status: 'pending',
        subject: 'Your TradeLens Trial Ends in 3 Days',
        email_data: {
            days_left: 3,
            end_date: sub.current_period_end
        }
      });
      emailsQueued++;
      console.log(`Queued trial reminder for user ${sub.user_id}`);
    }

    return new Response(JSON.stringify({ success: true, processed: trialsEndingSoon?.length, queued: emailsQueued }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error: any) {
    console.error('Trial reminder check failed:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
