import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface CommunityAction {
  action: 'like' | 'unlike' | 'follow' | 'unfollow' | 'comment' | 'pin' | 'unpin';
  tradeId?: string;
  userId?: string;
  commentText?: string;
}



interface CommunityTrade {
  trade_id: string;
  instrument: string;
  action: string;
  quantity: number;
  entry_price: number;
  exit_price?: number;
  entry_time: string;
  exit_time?: string;
  notes?: string;
  trade_metrics?: {
    net_p_and_l: number;
    gross_p_and_l: number;
    percent_gain: number;
    trade_outcome: string;
    r2r?: number;
    trade_duration?: string;
  };
  app_users: {
    username: string;
    first_name: string;
    last_name: string;
    profile_picture_url?: string;
  };
  accounts: {
    account_name: string;
  };
  strategies?: {
    strategy_name: string;
  };
  likes_count: number;
  comments_count: number;
  is_liked_by_user: boolean;
  created_at: string;
}

interface TraderProfile {
  user_id: string;
  username: string;
  first_name: string;
  last_name: string;
  profile_picture_url?: string;
  bio?: string;
  followers_count: number;
  win_rate: number;
  total_pnl: number;
  profit_factor: number;
  trades_count: number;
  badge?: string;
  is_followed_by_user: boolean;
}

interface LeaderboardEntry {
  user_id: string;
  username: string;
  full_name: string;
  profile_picture_url: string;
  netPnL: number;
  winRate: number;
  profitFactor: number;
  totalTrades: number;
  followersCount: number;
  leaderboardScore: number;
  rank: number;
}

export const useCommunityAction = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (action: CommunityAction) => {
      const { data, error } = await supabase.functions.invoke('community-actions', {
        body: action
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Success",
        description: `${variables.action} completed successfully`,
      });

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['community-feed'] });
      queryClient.invalidateQueries({ queryKey: ['community-traders'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      
      // Also invalidate trader profile if it's a follow/unfollow action
      if ((variables.action === 'follow' || variables.action === 'unfollow') && variables.userId) {
        queryClient.invalidateQueries({ queryKey: ['traderProfile'] });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });
};

export const useCommunityFeed = (
  sortBy: string = 'recent',
  searchQuery: string = '',
  limit: number = 20,
  offset: number = 0
) => {
  return useQuery<{ data: CommunityTrade[] }>({
    queryKey: ['community-feed', sortBy, searchQuery, limit, offset],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('community-feed', {
        body: {
          sortBy,
          searchQuery,
          limit,
          offset
        }
      });
      
      if (error) {
        throw new Error(`Failed to fetch community feed: ${error.message}`);
      }
      
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};



export const useCommunityTraders = (
  sortBy: string = 'followers',
  searchQuery: string = '',
  limit: number = 20,
  offset: number = 0
) => {
  return useQuery<{ data: TraderProfile[] }>({
    queryKey: ['community-traders', sortBy, searchQuery, limit, offset],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('community-traders', {
        body: {
          sortBy,
          searchQuery,
          limit,
          offset
        }
      });
      
      if (error) {
        throw new Error(`Failed to fetch community traders: ${error.message}`);
      }
      
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useTraderProfile = (username: string) => {
  return useQuery({
    queryKey: ['traderProfile', username],
    queryFn: async () => {
      if (!username) {
        throw new Error('Username is required');
      }

      // First, get the user by username
      const { data: userData, error: userError } = await supabase
        .from('app_users')
        .select('*')
        .eq('username', username)
        .single();

      if (userError) {
        throw userError;
      }

      if (!userData) {
        throw new Error('User not found');
      }

      // Then get the trader profile
      const { data: traderData, error: traderError } = await supabase
        .from('trader_profiles')
        .select('*')
        .eq('user_id', userData.user_id)
        .single();

      if (traderError) {
        throw traderError;
      }

      // Get follow status if authenticated
      let isFollowed = false;
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: currentUserData } = await supabase
          .from('app_users')
          .select('user_id')
          .eq('auth_id', user.id)
          .single();

        if (currentUserData) {
          const { data: followData } = await supabase
            .from('community_follows')
            .select('id')
            .eq('follower_id', currentUserData.user_id)
            .eq('following_id', userData.user_id)
            .single();
          
          isFollowed = !!followData;
        }
      }

      // Get follower count
      const { data: followers } = await supabase
        .from('community_follows')
        .select('id')
        .eq('following_id', userData.user_id);

      // Get trading stats from shared trades
      const { data: trades } = await supabase
        .from('trades')
        .select(`
          *,
          trade_metrics!inner(net_p_and_l, trade_outcome)
        `)
        .eq('user_id', userData.user_id)
        .eq('is_shared', true);

      let winRate = 0;
      let totalPnL = 0;
      let profitFactor = 1;
      let tradesCount = 0;

      if (trades && trades.length > 0) {
        tradesCount = trades.length;
        const winningTrades = trades.filter(trade => 
          trade.trade_metrics?.trade_outcome === 'WIN').length;
        winRate = (winningTrades / trades.length) * 100;

        totalPnL = trades.reduce((sum, trade) => 
          sum + (trade.trade_metrics?.net_p_and_l || 0), 0);

        // Calculate profit factor
        const profitableTrades = trades.filter(trade => 
          (trade.trade_metrics?.net_p_and_l || 0) > 0);
        const losingTrades = trades.filter(trade => 
          (trade.trade_metrics?.net_p_and_l || 0) < 0);
        
        const totalProfit = profitableTrades.reduce((sum, trade) => 
          sum + (trade.trade_metrics?.net_p_and_l || 0), 0);
        const totalLoss = Math.abs(losingTrades.reduce((sum, trade) => 
          sum + (trade.trade_metrics?.net_p_and_l || 0), 0));
        
        profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? 999 : 1;
      }

      // Get current user's subscription plan for badge
      const { data: subscription } = await supabase
        .from('user_subscriptions_new')
        .select(`
          subscription_plans!inner(name)
        `)
        .eq('user_id', userData.user_id)
        .eq('status', 'active')
        .single();

      const planName = subscription?.subscription_plans?.name || null;
      let badge = null;
      if (planName === 'Pro Plan') badge = 'Pro';
      else if (planName === 'Starter Plan') badge = 'Starter';

      return {
        ...traderData,
        app_users: userData,
        user_id: userData.user_id,
        is_followed_by_user: isFollowed,
        followers_count: followers?.length || 0,
        win_rate: winRate,
        total_pnl: totalPnL,
        profit_factor: profitFactor,
        trades_count: tradesCount,
        badge: badge
      };
    },
    enabled: !!username,
  });
};

export const useCreateTraderProfile = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profileData: any) => {
      const { data, error } = await supabase
        .from('trader_profiles')
        .upsert(profileData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Trader profile updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['trader-profile'] });
      queryClient.invalidateQueries({ queryKey: ['community-traders'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });
};

// Hook to fetch shared trades for a specific trader - UPDATED VERSION
export const useTraderSharedTrades = (userId: string, enabled = true) => {
  return useQuery({
    queryKey: ['trader-shared-trades', userId],
    queryFn: async () => {
      console.log('Fetching trader shared trades for userId:', userId);
      
      // Get the current session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      
      // Create URL with query parameters as expected by the Edge Function
      const baseUrl = supabase.supabaseUrl;
      const functionUrl = `${baseUrl}/functions/v1/trader-shared-trades?userId=${encodeURIComponent(userId)}&limit=50&offset=0`;
      
      const response = await fetch(functionUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'apikey': supabase.supabaseKey,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch trader shared trades:', errorText);
        throw new Error(`Failed to fetch trader shared trades: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Trader shared trades result:', result);
      return result?.data || [];
    },
    enabled: enabled && !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Hook to fetch pinned trades for a trader
export const usePinnedTrades = (userId: string, enabled = true) => {
  return useQuery({
    queryKey: ['pinned-trades', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pinned_trades')
        .select('trade_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: enabled && !!userId,
  });
};

// Hook to manage pinned trades
export const usePinTrade = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ tradeId, pin }: { tradeId: string; pin: boolean }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { data: userIdData } = await supabase.rpc('get_user_id_from_auth', {
        auth_user_id: userData.user.id
      });

      if (!userIdData) throw new Error('User not found');

      if (pin) {
        const { data, error } = await supabase
          .from('pinned_trades')
          .insert({
            user_id: userIdData,
            trade_id: tradeId
          })
          .select();

        if (error) throw error;
        return data;
      } else {
        const { error } = await supabase
          .from('pinned_trades')
          .delete()
          .eq('user_id', userIdData)
          .eq('trade_id', tradeId);

        if (error) throw error;
        return null;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pinned-trades'] });
      queryClient.invalidateQueries({ queryKey: ['trader-shared-trades'] });
    },
  });
};

// Hook to fetch leaderboard data
export const useLeaderboard = () => {
  return useQuery<LeaderboardEntry[]>({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('leaderboard-v2', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) {
        throw error;
      }

      return data as LeaderboardEntry[];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};
