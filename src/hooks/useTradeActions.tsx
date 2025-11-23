
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useAppUserId } from '@/hooks/useAppUserId';
import { useToast } from '@/hooks/use-toast';

export const useTradeActions = () => {
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const { user } = useAuth();
  const { appUserId } = useAppUserId();
  const { toast } = useToast();

  const toggleLike = async (tradeId: string, isLiked: boolean) => {
    if (!user || isLiking) return;

    setIsLiking(true);
    try {
      if (isLiked) {
        // Remove like
        const { error } = await supabase
          .from('trade_likes')
          .delete()
          .eq('trade_id', tradeId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Add like
        const { error } = await supabase
          .from('trade_likes')
          .insert({
            trade_id: tradeId,
            user_id: user.id
          });

        if (error) throw error;

        // Get trade owner to create notification
        const { data: tradeData } = await supabase
          .from('trades')
          .select('user_id, instrument')
          .eq('trade_id', tradeId)
          .single();

        if (tradeData && tradeData.user_id !== appUserId && appUserId) {
          // Create notification for trade owner
          await (supabase as any).rpc('create_notification', {
            target_user_id: tradeData.user_id,
            notification_type: 'like',
            source_user_id: appUserId,
            trade_id: tradeId,
            title: 'New Like',
            message: `${user.user_metadata?.username || user.email} liked your ${tradeData.instrument} trade`
          });
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLiking(false);
    }
  };

  const addComment = async (tradeId: string, commentText: string) => {
    if (!user || !commentText.trim() || isCommenting) return;

    setIsCommenting(true);
    try {
      const { error } = await supabase
        .from('trade_comments')
        .insert({
          trade_id: tradeId,
          user_id: user.id,
          comment_text: commentText.trim()
        });

      if (error) throw error;

      // Get trade owner to create notification
      const { data: tradeData } = await supabase
        .from('trades')
        .select('user_id, instrument')
        .eq('trade_id', tradeId)
        .single();

      if (tradeData && tradeData.user_id !== appUserId && appUserId) {
        // Create notification for trade owner
        await (supabase as any).rpc('create_notification', {
          target_user_id: tradeData.user_id,
          notification_type: 'comment',
          source_user_id: appUserId,
          trade_id: tradeId,
          title: 'New Comment',
          message: `${user.user_metadata?.username || user.email} commented on your ${tradeData.instrument} trade`
        });
      }

      toast({
        title: "Comment added",
        description: "Your comment has been posted successfully.",
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCommenting(false);
    }
  };

  return {
    toggleLike,
    addComment,
    isLiking,
    isCommenting
  };
};
