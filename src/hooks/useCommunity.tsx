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
    net_pnl: number;
    gross_pnl: number;
    percent_gain: number;
    trade_result: string;
    r_multiple?: number;
    trade_duration?: string;
  };
  app_users: {
    username: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  accounts: {
    name: string;
  };
  strategies?: {
    name: string;
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
  avatar_url?: string;
  bio?: string;
  about_content?: string;
  trading_experience?: string;
  risk_tolerance?: string;
  preferred_markets?: string[];
  location?: string;
  website_url?: string;
  social_links?: any;
  stats_visibility?: any;
  privacy_settings?: any;
  joined_at?: string;
  auth_id?: string;
  followers_count: number;
  following_count: number;
  win_rate: number;
  total_pnl: number;
  profit_factor?: number;
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
  return useQuery<{ data: TraderProfile }>({
    queryKey: ['traderProfile', username],
    queryFn: async () => {
      if (!username) {
        throw new Error('Username is required');
      }

      const { data, error } = await supabase.functions.invoke('trader-profile', {
        body: { username }
      });

      if (error) {
        throw new Error(`Failed to fetch trader profile: ${error.message}`);
      }

      return data;
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

export const useTraderSharedTrades = (userId: string, enabled = true) => {
  return useQuery({
    queryKey: ['trader-shared-trades', userId],
    queryFn: async () => {
      // Use community-feed with userId filter
      const { data, error } = await supabase.functions.invoke('community-feed', {
        body: {
          sortBy: 'recent',
          userId: userId, // Filter by specific user
          limit: 50,
          offset: 0
        }
      });

      if (error) {
        throw new Error(`Failed to fetch trader shared trades: ${error.message}`);
      }

      return data?.data || [];
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

      const currentUserId = userData.user.id;

      if (pin) {
        const { data, error } = await supabase
          .from('pinned_trades')
          .insert({
            user_id: currentUserId,
            trade_id: tradeId
          })
          .select();

        if (error) throw error;
        return data;
      } else {
        const { error } = await supabase
          .from('pinned_trades')
          .delete()
          .eq('user_id', currentUserId)
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
