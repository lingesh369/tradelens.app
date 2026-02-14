import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { handleCors } from '../_shared/cors.ts';
import { verifyAuth, createServiceClient } from '../_shared/auth.ts';
import { successResponse, errorResponse } from '../_shared/response.ts';

interface CommunityAction {
  action: 'like' | 'unlike' | 'follow' | 'unfollow' | 'comment' | 'pin' | 'unpin';
  tradeId?: string;
  userId?: string;
  commentText?: string;
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { user } = await verifyAuth(req);
    const actionData: CommunityAction = await req.json();
    const { action, tradeId, userId, commentText } = actionData;

    const supabase = createServiceClient();

    // Simplified current user identification
    const currentUserId = user.id;

    // Verify user exists in app_users
    const { data: appUser, error: appUserError } = await supabase
      .from('app_users')
      .select('id')
      .eq('id', currentUserId)
      .single();

    if (appUserError || !appUser) {
      return errorResponse('User profile not found. Please complete onboarding.', 404);
    }

    switch (action) {
      case 'like': {
        if (!tradeId) return errorResponse('Trade ID required for like action');

        const { error } = await supabase
          .from('trade_likes')
          .insert({
            user_id: currentUserId,
            trade_id: tradeId,
          });

        if (error) {
          if (error.code === '23505') return successResponse({ success: true, action: 'already_liked' });
          throw error;
        }
        return successResponse({ success: true, action: 'liked' });
      }

      case 'unlike': {
        if (!tradeId) return errorResponse('Trade ID required for unlike action');

        const { error } = await supabase
          .from('trade_likes')
          .delete()
          .eq('user_id', currentUserId)
          .eq('trade_id', tradeId);

        if (error) throw error;
        return successResponse({ success: true, action: 'unliked' });
      }

      case 'follow': {
        if (!userId) return errorResponse('User ID required for follow action');

        const { error } = await supabase
          .from('community_follows')
          .insert({
            follower_id: currentUserId,
            following_id: userId,
          });

        if (error) {
          if (error.code === '23505') return successResponse({ success: true, action: 'already_followed' });
          throw error;
        }
        return successResponse({ success: true, action: 'followed' });
      }

      case 'unfollow': {
        if (!userId) return errorResponse('User ID required for unfollow action');

        const { error } = await supabase
          .from('community_follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', userId);

        if (error) throw error;
        return successResponse({ success: true, action: 'unfollowed' });
      }

      case 'comment': {
        if (!tradeId || !commentText) {
          return errorResponse('Trade ID and comment text required');
        }

        const { data, error } = await supabase
          .from('trade_comments')
          .insert({
            trade_id: tradeId,
            user_id: currentUserId,
            content: commentText, // Local column name is content
          })
          .select()
          .single();

        if (error) throw error;
        return successResponse({ success: true, action: 'commented', comment: data });
      }

      case 'pin': {
        if (!tradeId) return errorResponse('Trade ID required for pin action');

        // Check if user owns the trade
        const { data: trade } = await supabase
          .from('trades')
          .select('user_id')
          .eq('id', tradeId) // Local PK name is id
          .single();

        if (!trade || trade.user_id !== currentUserId) {
          return errorResponse('Can only pin your own trades', 403);
        }

        const { error } = await supabase
          .from('pinned_trades')
          .insert({
            user_id: currentUserId,
            trade_id: tradeId,
          });

        if (error) {
          if (error.code === '23505') return successResponse({ success: true, action: 'already_pinned' });
          throw error;
        }
        return successResponse({ success: true, action: 'pinned' });
      }

      case 'unpin': {
        if (!tradeId) return errorResponse('Trade ID required for unpin action');

        const { error } = await supabase
          .from('pinned_trades')
          .delete()
          .eq('user_id', currentUserId)
          .eq('trade_id', tradeId);

        if (error) throw error;
        return successResponse({ success: true, action: 'unpinned' });
      }

      default:
        return errorResponse('Invalid action', 400);
    }
  } catch (error) {
    console.error('Community action error:', error);
    return errorResponse(error.message, 500);
  }
});
