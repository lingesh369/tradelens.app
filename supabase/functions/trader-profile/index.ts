import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { handleCors } from '../_shared/cors.ts';
import { getOptionalUser, createServiceClient } from '../_shared/auth.ts';
import { successResponse, errorResponse } from '../_shared/response.ts';

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { user } = await getOptionalUser(req);
    const { userId, username } = await req.json();

    if (!userId && !username) {
        return errorResponse('userId or username is required', 400);
    }

    const supabase = createServiceClient();

    // 1. Simplified current user identification
    const currentUserId = user?.id;

    // 2. Resolve target user ID
    let targetUserId = userId;
    if (!targetUserId && username) {
        const { data: targetUser } = await supabase
            .from('app_users')
            .select('id')
            .eq('username', username)
            .single();
        
        if (!targetUser) return errorResponse('User not found', 404);
        targetUserId = targetUser.id;
    }

    // 3. Fetch Profile Data
    // Join app_users and trader_profiles
    const { data: profile, error: profileError } = await supabase
      .from('trader_profiles')
      .select(`
        user_id,
        bio,
        about_content,
        trading_experience,
        risk_tolerance,
        preferred_markets,
        location,
        website_url,
        social_links,
        is_public,
        created_at,
        total_trades,
        win_rate,
        total_pnl,
        app_users!inner (
          id,
          username,
          first_name,
          last_name,
          avatar_url,
          subscription_status
        )
      `)
      .eq('user_id', targetUserId)
      .single();

    if (profileError || !profile) {
          return errorResponse('Trader profile not found', 404);
    }

    // access control: if not private and not self, deny
    if (!profile.is_public && currentUserId !== targetUserId) {
        return errorResponse('Profile is private', 403);
    }

    // 4. Enrich with dynamic Follow Status and Counts
    // Get followers count
    const { count: followersCount } = await supabase
        .from('community_follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', targetUserId);

    const { count: followingCount } = await supabase
        .from('community_follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', targetUserId);

    // Check if current user follows this trader
    let isFollowedByUser = false;
    if (currentUserId && currentUserId !== targetUserId) {
        const { data: follow } = await supabase
        .from('community_follows')
        .select('id')
        .eq('follower_id', currentUserId)
        .eq('following_id', targetUserId)
        .maybeSingle();
        isFollowedByUser = !!follow;
    }

    // Get subscription badge
    const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select(`subscription_plans!inner(name)`)
        .eq('user_id', targetUserId)
        .eq('status', 'active')
        .single();

    let badge = null;
    const planName = subscription?.subscription_plans?.name;
    if (planName?.includes('Pro')) badge = 'Pro';
    else if (planName?.includes('Starter')) badge = 'Starter';

    // 5. Construct Response using cached stats for performance
    const fullProfile = {
        user_id: profile.user_id,
        username: profile.app_users.username,
        first_name: profile.app_users.first_name,
        last_name: profile.app_users.last_name,
        avatar_url: profile.app_users.avatar_url,
        bio: profile.bio,
        about_content: profile.about_content,
        trading_experience: profile.trading_experience,
        risk_tolerance: profile.risk_tolerance,
        preferred_markets: profile.preferred_markets,
        location: profile.location,
        website_url: profile.website_url,
        social_links: profile.social_links,
        joined_at: profile.created_at,
        
        // Stats
        followers_count: followersCount || 0,
        following_count: followingCount || 0,
        win_rate: profile.win_rate || 0,
        total_pnl: profile.total_pnl || 0,
        trades_count: profile.total_trades || 0,
        badge,
        is_followed_by_user: isFollowedByUser,
    };

    return successResponse({ data: fullProfile });

  } catch (error) {
    console.error('Trader profile error:', error);
    return errorResponse(error.message, 500);
  }
});
