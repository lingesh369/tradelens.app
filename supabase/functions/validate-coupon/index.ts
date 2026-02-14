import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/response.ts';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get user from auth
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { couponCode, planId, userId, planPrice, currency = 'USD' } = await req.json();

    if (!couponCode || !planId || !userId || !planPrice) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get coupon from database
    const { data: coupon, error: couponError } = await supabaseClient
      .from('coupons')
      .select('*')
      .eq('code', couponCode.toUpperCase())
      .eq('is_active', true)
      .single();

    if (couponError || !coupon) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: 'Invalid or expired coupon code',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if coupon is expired
    if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: 'This coupon has expired',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if coupon has usage limit
    if (coupon.max_uses && coupon.times_used >= coupon.max_uses) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: 'This coupon has reached its usage limit',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if user has already used this coupon
    if (coupon.max_uses_per_user) {
      const { data: usage, error: usageError } = await supabaseClient
        .from('coupon_usage')
        .select('*')
        .eq('coupon_id', coupon.id)
        .eq('user_id', userId);

      if (!usageError && usage && usage.length >= coupon.max_uses_per_user) {
        return new Response(
          JSON.stringify({
            valid: false,
            error: 'You have already used this coupon',
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Check if coupon is valid for this plan
    if (coupon.applicable_plans && coupon.applicable_plans.length > 0) {
      if (!coupon.applicable_plans.includes(planId)) {
        return new Response(
          JSON.stringify({
            valid: false,
            error: 'This coupon is not valid for the selected plan',
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discount_type === 'percentage') {
      discountAmount = (planPrice * coupon.discount_value) / 100;
      // Apply max discount if set
      if (coupon.max_discount_amount && discountAmount > coupon.max_discount_amount) {
        discountAmount = coupon.max_discount_amount;
      }
    } else if (coupon.discount_type === 'fixed') {
      discountAmount = coupon.discount_value;
    }

    // Ensure discount doesn't exceed plan price
    if (discountAmount > planPrice) {
      discountAmount = planPrice;
    }

    const finalAmount = Math.max(0, planPrice - discountAmount);

    return new Response(
      JSON.stringify({
        valid: true,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          description: coupon.description,
          discountType: coupon.discount_type,
          discountValue: coupon.discount_value,
        },
        discountAmount,
        finalAmount,
        currency,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error validating coupon:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
