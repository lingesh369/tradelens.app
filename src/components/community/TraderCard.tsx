import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle } from "lucide-react";
import { useCommunityAction } from "@/hooks/useCommunity";

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

interface TraderCardProps {
  trader: TraderProfile;
  calculatedStats?: {
    totalTrades: number;
    netPnL: number;
    winRate: number;
  };
  onTraderClick?: (username: string) => void;
  onMessageClick?: (userId: string) => void;
}

export const TraderCard = ({ trader, calculatedStats, onTraderClick, onMessageClick }: TraderCardProps) => {
  const communityAction = useCommunityAction();

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await communityAction.mutateAsync({
      action: trader.is_followed_by_user ? 'unfollow' : 'follow',
      userId: trader.user_id
    });
  };

  const handleMessage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMessageClick) {
      onMessageClick(trader.user_id);
    }
  };

  const handleTraderClick = () => {
    if (onTraderClick) {
      onTraderClick(trader.username);
    }
  };

  // Use calculated stats if available, otherwise fallback to trader data
  const displayStats = {
    trades: calculatedStats?.totalTrades ?? trader.trades_count,
    netPnL: calculatedStats?.netPnL ?? trader.total_pnl,
    winRate: calculatedStats?.winRate ?? trader.win_rate
  };

  const formatLargeNumber = (value: number) => {
    const absValue = Math.abs(value);
    if (absValue >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M`;
    } else if (absValue >= 1000) {
      return `${(value / 1000).toFixed(2)}K`;
    }
    return value.toFixed(2);
  };

  const formatPnL = (value: number) => {
    // Display "--" for zero values
    if (value === 0) {
      return "--";
    }
    
    // Use the exact same logic as ProfileHeader with large number formatting
    if (calculatedStats) {
      return `$${formatLargeNumber(value)}`;
    } else {
      return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
    }
  };

  return (
    <Card 
      className="rounded-xl p-4 sm:p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer border-0 bg-card hover:ring-2 hover:ring-primary/20"
      onClick={handleTraderClick}
    >
      <div className="space-y-4">
        {/* Top Section (Header) */}
        <div className="flex items-start gap-4">
          <div className="relative">
            <Avatar className="h-12 w-12 ring-2 ring-primary/10">
              <AvatarImage src={trader.profile_picture_url} />
              <AvatarFallback className="text-lg font-medium">
                {trader.username?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            {/* Subscription Plan Badge */}
            {trader.badge && trader.badge !== 'Free' && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-[8px] font-bold text-white">
                  {trader.badge === 'Pro' ? 'P' : 'S'}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate leading-tight">
              {trader.first_name && trader.last_name 
                ? `${trader.first_name} ${trader.last_name}`
                : trader.username
              }
            </h3>
            <p className="text-sm text-muted-foreground">@{trader.username}</p>
          </div>
        </div>

        {/* Stats Section (Middle) - Single Row Responsive Grid */}
        <div className="grid grid-cols-4 gap-1 sm:gap-2">
          {/* Followers */}
          <div className="text-center">
            <p className="text-sm sm:text-lg font-semibold text-foreground">{trader.followers_count}</p>
            <p className="text-xs text-muted-foreground">Followers</p>
          </div>
          
          {/* Trades */}
          <div className="text-center">
            <p className="text-sm sm:text-lg font-semibold text-foreground">{displayStats.trades}</p>
            <p className="text-xs text-muted-foreground">Trades</p>
          </div>
          
          {/* P&L */}
          <div className="text-center">
            <p className={`text-sm sm:text-lg font-semibold ${
              displayStats.netPnL === 0 
                ? 'text-muted-foreground' 
                : displayStats.netPnL >= 0 
                  ? 'text-green-600' 
                  : 'text-red-600'
            }`}>
              {formatPnL(displayStats.netPnL)}
            </p>
            <p className="text-xs text-muted-foreground">Net P&L</p>
          </div>
          
          {/* Win Rate */}
          <div className="text-center">
            <p className="text-sm sm:text-lg font-semibold text-green-600">
              {displayStats.winRate.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">Win Rate</p>
          </div>
        </div>

        {/* Bottom Section (Actions) */}
        <div className="flex items-center gap-3">
          <Button 
            className="flex-1" 
            size="sm"
            variant={trader.is_followed_by_user ? "outline" : "default"}
            onClick={handleFollow}
            disabled={communityAction.isPending}
          >
            {communityAction.isPending ? 'Loading...' : (trader.is_followed_by_user ? 'Unfollow' : 'Follow')}
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            className="px-3"
            onClick={handleMessage}
          >
            <MessageCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};