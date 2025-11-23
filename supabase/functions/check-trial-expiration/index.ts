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
      .select('id, user_id')
      .eq('status', 'trialing')
      .lt('current_period_end', new Date().toISOString());

    if (error) throw error;

    console.log(`Found ${expiredTrials?.length || 0} expired trials`);

    for (const sub of expiredTrials || []) {
      // Update status to expired
      await supabase
        .from('user_subscriptions')
        .update({ status: 'expired', updated_at: new Date().toISOString() })
        .eq('id', sub.id);

      // Queue email notification
      await supabase.from('email_queue').insert({
        user_id: sub.user_id,
        email_type: 'trial_expired',
        recipient_email: 'user@example.com', // In real app, fetch user email
        subject: 'Your TradeLens Trial Has Expired',
        email_data: {}
      });
      
      console.log(`Expired subscription ${sub.id} for user ${sub.user_id}`);
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
