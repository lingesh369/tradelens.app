import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { UserPlus, UserMinus, Trophy, Medal, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCommunityAction } from '@/hooks/useCommunity';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

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
  is_followed_by_user?: boolean;
}

interface LeaderboardCardProps {
  trader: LeaderboardEntry;
  className?: string;
}

const formatCurrency = (amount: number) => {
  const absAmount = Math.abs(amount);
  if (absAmount >= 1000000) {
    return `${amount >= 0 ? '+' : '-'}$${(absAmount / 1000000).toFixed(1)}M`;
  } else if (absAmount >= 1000) {
    return `${amount >= 0 ? '+' : '-'}$${(absAmount / 1000).toFixed(1)}K`;
  } else {
    return `${amount >= 0 ? '+' : '-'}$${absAmount.toFixed(0)}`;
  }
};

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Trophy className="h-4 w-4 text-yellow-500" />;
    case 2:
      return <Medal className="h-4 w-4 text-gray-400" />;
    case 3:
      return <Award className="h-4 w-4 text-amber-600" />;
    default:
      return null;
  }
};

const getRankBadgeColor = (rank: number) => {
  switch (rank) {
    case 1:
      return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
    case 2:
      return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
    case 3:
      return 'bg-gradient-to-r from-amber-400 to-amber-600 text-white';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export const LeaderboardCard: React.FC<LeaderboardCardProps> = ({ trader, className = '' }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const communityAction = useCommunityAction();
  
  // Local state for follow status with optimistic updates
  const [isFollowed, setIsFollowed] = useState(trader.is_followed_by_user || false);
  const [followersCount, setFollowersCount] = useState(trader.followersCount);
  const [isLoading, setIsLoading] = useState(false);

  // Update local state when trader data changes
  useEffect(() => {
    setIsFollowed(trader.is_followed_by_user || false);
    setFollowersCount(trader.followersCount);
  }, [trader.is_followed_by_user, trader.followersCount]);

  // Check follow status on component mount
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!user?.id || !trader.user_id) return;
      
      try {
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
            .eq('following_id', trader.user_id)
            .single();
          
          setIsFollowed(!!followData);
        }
      } catch (error) {
        console.error('Error checking follow status:', error);
      }
    };

    checkFollowStatus();
  }, [user?.id, trader.user_id]);

  const handleCardClick = () => {
    navigate(`/traders/${trader.username}`);
  };

  const handleFollowClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || isLoading) return;
    
    setIsLoading(true);
    
    // Optimistic update
    const newFollowState = !isFollowed;
    setIsFollowed(newFollowState);
    setFollowersCount(prev => newFollowState ? prev + 1 : prev - 1);
    
    try {
      await communityAction.mutateAsync({
        action: newFollowState ? 'follow' : 'unfollow',
        userId: trader.user_id
      });
    } catch (error) {
      // Revert optimistic update on error
      setIsFollowed(!newFollowState);
      setFollowersCount(prev => newFollowState ? prev - 1 : prev + 1);
      console.error('Error updating follow status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isCurrentUser = user?.id === trader.user_id;

  return (
    <Card 
      className={`flex-shrink-0 w-80 p-4 cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 ${
        trader.rank <= 3 ? 'border-l-yellow-500' : 'border-l-muted'
      } ${className}`}
      onClick={handleCardClick}
    >
      <div className="space-y-4">
        {/* Header with rank and profile */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Badge 
                className={`absolute -top-2 -left-2 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${getRankBadgeColor(trader.rank)}`}
              >
                {trader.rank}
              </Badge>
              <Avatar className="h-12 w-12">
                <AvatarImage src={trader.profile_picture_url} alt={trader.username} />
                <AvatarFallback>
                  {trader.full_name?.split(' ').map(n => n[0]).join('') || trader.username?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-sm truncate">
                  {trader.full_name || trader.username}
                </h3>
                {trader.rank <= 3 && getRankIcon(trader.rank)}
              </div>
              <p className="text-xs text-muted-foreground">
                @{trader.username}
              </p>
              <p className="text-xs text-muted-foreground">
                {followersCount} followers
              </p>
            </div>
          </div>
          
          {!isCurrentUser && (
            <Button
              size="sm"
              variant={isFollowed ? "outline" : "default"}
              onClick={handleFollowClick}
              disabled={isLoading}
              className="flex-shrink-0 w-8 h-8 p-0"
            >
              {isFollowed ? (
                <UserMinus className="h-3 w-3" />
              ) : (
                <UserPlus className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>

        {/* Performance metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Net P&L</p>
            <p className={`text-sm font-semibold ${
              trader.netPnL >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(trader.netPnL)}
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Win Rate</p>
            <p className="text-sm font-semibold">
              {trader.winRate.toFixed(1)}%
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Total Trades</p>
            <p className="text-sm font-semibold">
              {trader.totalTrades.toLocaleString()}
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Profit Factor</p>
            <p className="text-sm font-semibold">
              {trader.profitFactor === 999 ? '∞' : trader.profitFactor.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Leaderboard score (optional, for debugging) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Score: {trader.leaderboardScore.toFixed(2)}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};