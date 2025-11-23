
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share2, Pin, PinOff } from "lucide-react";
import { useCommunityAction, usePinTrade } from "@/hooks/useCommunity";
import { useTradeActions } from "@/hooks/useTradeActions";
import { format } from "date-fns";
import { TradePnLBadge } from "@/components/trades/components/TradePnLBadge";

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
  main_image?: string;
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

interface TradeCardProps {
  trade: CommunityTrade;
  onTradeClick?: (tradeId: string) => void;
  onTraderClick?: (userId: string) => void;
  hideTraderInfo?: boolean;
  isOwner?: boolean;
  isPinned?: boolean;
  onPinToggle?: (tradeId: string, pin: boolean) => void;
}

export const TradeCard = ({ 
  trade, 
  onTradeClick, 
  onTraderClick, 
  hideTraderInfo = false,
  isOwner = false,
  isPinned = false,
  onPinToggle
}: TradeCardProps) => {
  const communityAction = useCommunityAction();
  const pinTrade = usePinTrade();
  const { toggleLike } = useTradeActions();

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleLike(trade.trade_id, trade.is_liked_by_user);
    // Refetch data to update like count
    await communityAction.mutateAsync({
      action: trade.is_liked_by_user ? 'unlike' : 'like',
      tradeId: trade.trade_id
    });
  };

  const handleComment = async (e: React.MouseEvent) => {
    e.stopPropagation();
    onTradeClick?.(trade.trade_id);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/shared/trades/${trade.trade_id}`;
    if (navigator.share) {
      await navigator.share({
        title: `${trade.instrument} Trade by @${trade.app_users?.username || 'Unknown'}`,
        url: shareUrl
      });
    } else {
      await navigator.clipboard.writeText(shareUrl);
    }
  };

  const handleTraderClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onTraderClick) {
      if (trade.app_users?.username) {
      onTraderClick(trade.app_users.username);
    }
    }
  };

  const handlePinToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPinToggle) {
      onPinToggle(trade.trade_id, !isPinned);
    }
  };

  const outcome = trade.trade_metrics?.trade_outcome || 'OPEN';

  // Format image URL
  const getImageUrl = () => {
    if (trade.main_image) {
      return trade.main_image;
    }
    return '/placeholder.svg';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <Card 
      className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] group h-full flex flex-col"
      onClick={() => onTradeClick?.(trade.trade_id)}
    >
      <div className="p-0 flex flex-col h-full">
        {/* Trade Image */}
        <div className="relative aspect-video bg-muted rounded-t-lg overflow-hidden flex-shrink-0">
          <img 
            src={getImageUrl()} 
            alt={`${trade.instrument} trade`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            onError={(e) => {
              e.currentTarget.src = '/placeholder.svg';
            }}
          />
          {/* Status badge overlay */}
          <div className="absolute top-2 right-2">
            <Badge 
              variant={outcome === 'WIN' ? 'default' : outcome === 'LOSS' ? 'destructive' : 'secondary'}
              className="text-xs"
            >
              {outcome}
            </Badge>
          </div>
          
          {/* Pin functionality - top left */}
          {isOwner && (
            <div className="absolute top-2 left-2">
              <Button
                size="sm"
                variant={isPinned ? "default" : "secondary"}
                className="h-7 w-7 p-0"
                onClick={handlePinToggle}
              >
                {isPinned ? (
                  <Pin className="h-3 w-3 fill-current" />
                ) : (
                  <PinOff className="h-3 w-3" />
                )}
              </Button>
            </div>
          )}
          
          {/* Pinned indicator for public view */}
          {!isOwner && isPinned && (
            <div className="absolute top-2 left-2">
              <Badge variant="secondary" className="text-xs">
                <Pin className="h-3 w-3 mr-1 fill-current" />
                Pinned
              </Badge>
            </div>
          )}
        </div>

        {/* Trade Details */}
        <div className="p-4 space-y-3 flex-1 flex flex-col min-h-0">
          {/* Instrument & Action */}
          <div className="flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-semibold text-lg truncate">{trade.instrument}</span>
              <Badge variant={trade.action === 'buy' ? 'default' : 'secondary'} className="text-xs flex-shrink-0">
                {trade.action.toUpperCase()}
              </Badge>
            </div>
            <div className="flex-shrink-0">
              <TradePnLBadge pnl={trade.trade_metrics?.net_p_and_l || 0} pnlPercent={trade.trade_metrics?.percent_gain || 0} />
            </div>
          </div>

          {/* Price Range */}
          <div className="flex items-center justify-between text-sm text-muted-foreground flex-shrink-0">
            <span className="truncate">{formatCurrency(trade.entry_price)} – {trade.exit_price ? formatCurrency(trade.exit_price) : 'Open'}</span>
          </div>

          {/* Time Range and Date - Single Row */}
          <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-2 flex-shrink-0">
            <span className="truncate">
              {format(new Date(trade.entry_time), 'HH:mm')}
              {trade.exit_time ? ` - ${format(new Date(trade.exit_time), 'HH:mm')}` : ''}
            </span>
            <span className="truncate text-right">
              {format(new Date(trade.entry_time), 'EEEE, MMMM d, yyyy')}
            </span>
          </div>

          {/* Actions Section */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-1">
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-8 px-2 hover:bg-muted"
                onClick={handleLike}
              >
                <Heart 
                  className={`h-4 w-4 mr-1 ${trade.is_liked_by_user ? 'fill-red-500 text-red-500' : ''}`} 
                />
                <span className="text-xs">{trade.likes_count}</span>
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-8 px-2 hover:bg-muted"
                onClick={handleComment}
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                <span className="text-xs">{trade.comments_count}</span>
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-8 px-2 hover:bg-muted"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Trader Info Section - Only show if not hidden */}
          {!hideTraderInfo && (
            <div className="flex items-center justify-between pt-2 border-t">
              <div 
                className="flex items-center gap-2 cursor-pointer hover:opacity-80 flex-1 min-w-0"
                onClick={handleTraderClick}
              >
                <Avatar className="h-6 w-6 flex-shrink-0">
                  <AvatarImage src={trade.app_users?.profile_picture_url || ''} />
                  <AvatarFallback className="text-xs">
                    {trade.app_users.username?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium truncate">@{trade.app_users?.username || 'Unknown'}</span>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="h-7 text-xs flex-shrink-0 ml-2"
              >
                Follow
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
