import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get Brevo configuration
    const brevoApiKey = Deno.env.get('BREVO_API_KEY');
    const brevoSenderEmail = Deno.env.get('BREVO_SENDER_EMAIL') || 'noreply@tradelens.app';
    const brevoSenderName = Deno.env.get('BREVO_SENDER_NAME') || 'TradeLens';

    if (!brevoApiKey) {
      throw new Error('BREVO_API_KEY environment variable is required');
    }

    console.log('🔄 Starting email queue processing...');

    // Fetch pending emails from queue
    const { data: pendingEmails, error: fetchError } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .lt('retry_count', 3) // Hardcoded max_retries for safety
      .order('created_at', { ascending: true })
      .limit(50); // Process up to 50 emails per run

    if (fetchError) {
      console.error('❌ Error fetching pending emails:', fetchError);
      throw fetchError;
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      console.log('✅ No pending emails to process');
      return new Response(JSON.stringify({
        success: true,
        message: 'No pending emails to process',
        processed: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    console.log(`📨 Found ${pendingEmails.length} emails to process`);

    let successCount = 0;
    let failureCount = 0;

    for (const email of pendingEmails) {
      try {
        // Update status to processing
        await supabase
          .from('email_queue')
          .update({ status: 'processing', updated_at: new Date().toISOString() })
          .eq('id', email.id);

        // Prepare Brevo payload
        const payload = {
          sender: { name: brevoSenderName, email: brevoSenderEmail },
          to: [{ email: email.recipient_email }],
          subject: email.subject,
          templateId: getTemplateId(email.email_type),
          params: email.email_data || {}
        };

        // If no template ID found, maybe send as html content if provided in data?
        // For now, we assume template ID is required or we fail.
        if (!payload.templateId) {
            // Fallback: if email_data has 'html_content', use that?
            // But for now let's just log error if no template map
            if (email.email_data?.html_content) {
                payload.htmlContent = email.email_data.html_content;
                delete payload.templateId;
            } else {
                 throw new Error(`No template ID found for email type: ${email.email_type}`);
            }
        }

        console.log(`🚀 Sending email ${email.id} to ${email.recipient_email} (Type: ${email.email_type})`);

        // Send to Brevo
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': brevoApiKey,
            'content-type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const responseData = await response.json();

        if (!response.ok) {
          throw new Error(`Brevo API error: ${JSON.stringify(responseData)}`);
        }

        // Mark as sent
        await supabase
          .from('email_queue')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', email.id);

        // Log to email_logs
        await logEmail(supabase, email, 'sent', null, responseData.messageId);

        successCount++;
        console.log(`✅ Email ${email.id} sent successfully`);

      } catch (error: any) {
        console.error(`❌ Failed to send email ${email.id}:`, error);

        // Update retry count and status
        const newRetryCount = (email.retry_count || 0) + 1;
        const newStatus = newRetryCount >= 3 ? 'failed' : 'pending';

        await supabase
          .from('email_queue')
          .update({
            status: newStatus,
            retry_count: newRetryCount,
            error_message: error.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', email.id);

        // Log failure
        await logEmail(supabase, email, 'failed', error.message);

        failureCount++;
      }
    }

    console.log(`🎯 Email processing complete: ${successCount} sent, ${failureCount} failed`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Email queue processing completed',
      processed: pendingEmails.length,
      sent: successCount,
      failed: failureCount
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error: any) {
    console.error('❌ Email queue processing failed:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

// Helper function to map email types to Brevo template IDs
function getTemplateId(emailType: string): number | undefined {
  const templateMap: Record<string, number> = {
    'welcome': 5,
    'trial_started': 11,
    'trial_midpoint': 12,
    'trial_ending': 6,
    'trial_expired': 14,
    'first_trade': 15,
    'milestone_10': 16,
    'milestone_50': 17,
    'milestone_100': 18,
    'inactivity_7d': 19,
    'inactivity_14d': 20,
    'inactivity_30d': 21,
    'winback': 22,
    'subscription_activated': 23,
    'payment_success': 24,
    'payment_failed': 25,
    'subscription_cancelled': 26
  };
  return templateMap[emailType];
}

// Helper function to log email attempts
async function logEmail(supabase: any, email: any, status: string, errorMessage?: string, responseId?: string) {
  try {
    const { error } = await supabase.from('email_logs').insert({
      user_id: email.user_id,
      recipient_email: email.recipient_email,
      email_type: email.email_type,
      template_id: getTemplateId(email.email_type)?.toString(),
      status: status,
      provider: 'brevo',
      provider_message_id: responseId,
      error_message: errorMessage,
      subject: email.subject,
      template_data: email.email_data
    });

    if (error) {
      console.error('❌ Error logging email:', error);
    }
  } catch (logError) {
    console.error('❌ Error in logEmail function:', logError);
  }
}
