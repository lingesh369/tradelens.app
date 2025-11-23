
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Heart, MessageCircle, Share2, Edit, Plus, ExternalLink, UserPlus, UserMinus } from "lucide-react";
import { TraderProfileShareButton } from "@/components/shared/TraderProfileShareButton";
import { cn } from "@/lib/utils";
import { NotificationPanel } from "./NotificationPanel";
import { ChatPanel } from "./ChatPanel";
import { useProfileNotifications } from "@/hooks/useProfileNotifications";

interface ProfileHeaderProps {
  traderData: {
    user_id: string;
    app_users?: {
      username?: string;
      first_name?: string;
      last_name?: string;
      profile_picture_url?: string;
      auth_id?: string;
    };
    followers_count: number;
    win_rate: number;
    total_pnl: number;
    profit_factor: number;
    trades_count: number;
    badge?: string;
    social_links?: any;
    stats_visibility?: any;
    is_followed_by_user?: boolean;
  };
  calculatedStats?: {
    totalTrades: number;
    netPnL: number;
    winRate: number;
  };
  isOwner: boolean;
  onEditProfile: () => void;
  onFollow: () => void;
  onMessage: () => void;
  onShare: () => void;
  onNotifications: () => void;
  isFollowLoading?: boolean;
}

export function ProfileHeader({
  traderData,
  calculatedStats,
  isOwner,
  onEditProfile,
  onFollow,
  onMessage,
  onShare,
  onNotifications,
  isFollowLoading = false
}: ProfileHeaderProps) {
  const [imageError, setImageError] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const { unreadCount } = useProfileNotifications();
  
  const displayName = traderData.app_users?.first_name && traderData.app_users?.last_name 
    ? `${traderData.app_users.first_name} ${traderData.app_users.last_name}` 
    : traderData.app_users?.username || 'Unknown User';
  const username = traderData.app_users?.username || 'unknown';

  const handleNotifications = () => {
    setShowNotifications(true);
    onNotifications();
  };

  const handleMessage = () => {
    if (isOwner) {
      setShowChat(true);
    } else {
      onMessage();
    }
  };

  // Use calculated stats from overview tab if available, otherwise fallback to trader data
  const actualStats = useMemo(() => {
    if (calculatedStats) {
      return {
        trades: calculatedStats.totalTrades,
        followers: traderData.followers_count || 0,
        pnl: calculatedStats.netPnL,
        winRate: calculatedStats.winRate
      };
    }
    
    return {
      trades: traderData.trades_count || 0,
      followers: traderData.followers_count || 0,
      pnl: traderData.total_pnl || 0,
      winRate: traderData.win_rate || 0
    };
  }, [calculatedStats, traderData]);

  // Stats configuration with visibility checks
  const stats = [
    {
      key: 'trades',
      label: 'Trades',
      value: actualStats.trades,
      visible: true,
      color: 'text-foreground'
    },
    {
      key: 'followers',
      label: 'Followers',
      value: actualStats.followers,
      visible: true,
      color: 'text-foreground'
    },
    {
      key: 'pnl',
      label: 'Net P&L',
      value: calculatedStats ? `$${actualStats.pnl.toFixed(2)}` : `${actualStats.pnl >= 0 ? '+' : ''}${actualStats.pnl.toFixed(1)}%`,
      visible: !traderData.stats_visibility || traderData.stats_visibility.net_pnl !== false,
      color: actualStats.pnl >= 0 ? 'text-green-600' : 'text-red-600'
    },
    {
      key: 'winRate',
      label: 'Win Rate',
      value: `${actualStats.winRate.toFixed(1)}%`,
      visible: !traderData.stats_visibility || traderData.stats_visibility.win_rate !== false,
      color: actualStats.winRate >= 50 ? 'text-green-600' : 'text-red-600'
    }
  ];

  // Social platforms configuration
  // Social platform configurations with colored SVG icons
  const socialPlatforms = [{
    key: 'twitter',
    label: 'Twitter',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#9CA3AF">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    )
  }, {
    key: 'instagram',
    label: 'Instagram',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#E4405F">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.40z"/>
      </svg>
    )
  }, {
    key: 'youtube',
    label: 'YouTube',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#FF0000">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    )
  }, {
    key: 'discord',
    label: 'Discord',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#5865F2">
        <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.8354.0992 18.5492a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0002 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1568 2.4189Z"/>
      </svg>
    )
  }, {
    key: 'linkedin',
    label: 'LinkedIn',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#0077B5">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    )
  }, {
    key: 'telegram',
    label: 'Telegram',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#0088CC">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
      </svg>
    )
  }, {
    key: 'website',
    label: 'Website',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#4285F4">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
      </svg>
    )
  }];

  const activeSocialLinks = socialPlatforms.filter(platform => 
    traderData.social_links?.[platform.key]
  );

  return (
    <>
      <div className="bg-background border rounded-lg overflow-hidden">
        <div className="p-4 sm:p-6">
          {/* Desktop Layout (1200px+) */}
          <div className="hidden xl:flex items-start justify-between">
            {/* Left Section: Identity + Stats */}
            <div className="flex items-start gap-6">
              {/* Profile Picture */}
              <div className="flex-shrink-0">
                <Avatar className="h-20 w-20 lg:h-24 lg:w-24 ring-4 ring-primary/10 cursor-pointer">
                  <AvatarImage src={!imageError ? traderData.app_users?.profile_picture_url : undefined} onError={() => setImageError(true)} />
                  <AvatarFallback className="text-2xl font-bold">
                    {displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* User Info */}
              <div className="space-y-3">
                {/* Name and Badge */}
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl lg:text-3xl font-bold">{displayName}</h1>
                  {traderData.badge && traderData.badge !== 'Free' && <Badge variant="secondary" className="px-2 py-1">
                      {traderData.badge}
                    </Badge>}
                </div>
                
                {/* Username */}
                <p className="text-muted-foreground">@{username}</p>
                
                {/* Social Icons */}
                <div className="flex items-center gap-2">
                  {activeSocialLinks.length > 0 && activeSocialLinks.map(platform => <Button key={platform.key} variant="outline" size="sm" onClick={() => window.open(traderData.social_links![platform.key], '_blank')} className="h-8 w-8 p-0">
                        <span className="text-sm">{platform.icon}</span>
                      </Button>)}
                </div>
              </div>

              {/* Vertical Divider */}
              <Separator orientation="vertical" className="h-20 lg:h-24 mx-[16px] my-[16px]" />

              {/* Stats Section */}
              <div className="flex gap-8 mx-0 my-[30px]">
                {stats.filter(stat => stat.visible).map(stat => (
                  <div key={stat.key} className="text-center">
                    <p className={cn("text-xl lg:text-2xl font-bold", stat.color)}>
                      {stat.value}
                    </p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Section: Actions */}
            <div className="flex flex-col gap-3">
              {/* Owner Icons */}
              {isOwner && <div className="flex gap-2 justify-end mx-1 my-0">
                  <Button variant="ghost" size="sm" onClick={onEditProfile}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleNotifications} className="relative">
                    <Heart className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full" />
                    )}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleMessage}>
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>}

              {/* Action Buttons */}
              {!isOwner && <div className="flex gap-2 my-[40px]">
                  <Button variant={traderData.is_followed_by_user ? "outline" : "default"} onClick={onFollow} disabled={isFollowLoading} className="min-w-[100px]">
                    {isFollowLoading ? 'Loading...' : traderData.is_followed_by_user ? 'Unfollow' : 'Follow'}
                  </Button>
                  <Button variant="outline" onClick={onMessage}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                  <TraderProfileShareButton username={username} traderName={displayName} variant="default" />
                </div>}
            </div>
          </div>

          {/* Tablet Layout (768px - 1199px) - Single Row with Responsive Buttons */}
          <div className="hidden md:flex xl:hidden items-center justify-between">
            {/* Left Section: Profile + Name + Stats */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Profile Picture */}
              <div className="flex-shrink-0">
                <Avatar className="h-16 w-16 ring-4 ring-primary/10 cursor-pointer">
                  <AvatarImage src={!imageError ? traderData.app_users?.profile_picture_url : undefined} onError={() => setImageError(true)} />
                  <AvatarFallback className="text-xl font-bold">
                    {displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* User Info */}
              <div className="min-w-0 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold truncate">{displayName}</h1>
                  {traderData.badge && traderData.badge !== 'Free' && <Badge variant="secondary" className="px-2 py-1 text-xs">
                      {traderData.badge}
                    </Badge>}
                </div>
                <p className="text-sm text-muted-foreground truncate">@{username}</p>
                
                {/* Social Icons - Compact for tablet */}
                <div className="flex items-center gap-1 mt-1">
                  {activeSocialLinks.length > 0 && activeSocialLinks.map(platform => <Button key={platform.key} variant="outline" size="sm" onClick={() => window.open(traderData.social_links![platform.key], '_blank')} className="h-6 w-6 p-0">
                        <span className="text-xs">{platform.icon}</span>
                      </Button>)}
                </div>
              </div>

              {/* Vertical Divider */}
              <Separator orientation="vertical" className="h-12 mx-2" />

              {/* Stats Section */}
              <div className="flex gap-4 lg:gap-6">
                {stats.filter(stat => stat.visible).map(stat => (
                  <div key={stat.key} className="text-center">
                    <p className={cn("text-lg font-bold", stat.color)}>
                      {stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Section: Actions - Responsive */}
            <div className="flex-shrink-0 ml-4">
              {/* Owner Actions */}
              {isOwner && <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={onEditProfile}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleNotifications} className="relative">
                    <Heart className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full" />
                    )}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleMessage}>
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>}

              {/* Non-Owner Actions - Responsive Design */}
              {!isOwner && (
                <>
                  {/* Large Tablet: Buttons with text (1024px+) */}
                  <div className="hidden lg:flex gap-2">
                    <Button variant={traderData.is_followed_by_user ? "outline" : "default"} onClick={onFollow} disabled={isFollowLoading} className="min-w-[90px]">
                      {isFollowLoading ? 'Loading...' : traderData.is_followed_by_user ? 'Unfollow' : 'Follow'}
                    </Button>
                    <Button variant="outline" onClick={onMessage}>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                    <TraderProfileShareButton username={username} traderName={displayName} variant="default" />
                  </div>

                  {/* Medium Tablet: Icon-only buttons (768px - 1023px) */}
                  <div className="flex lg:hidden gap-1">
                    <Button variant={traderData.is_followed_by_user ? "outline" : "default"} onClick={onFollow} disabled={isFollowLoading} size="sm" className="px-3">
                      {traderData.is_followed_by_user ? (
                        <UserMinus className="h-4 w-4" />
                      ) : (
                        <UserPlus className="h-4 w-4" />
                      )}
                    </Button>
                    <Button variant="outline" onClick={onMessage} size="sm" className="px-3">
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                    <TraderProfileShareButton username={username} traderName={displayName} variant="icon" />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Mobile Layout (below 768px) */}
          <div className="md:hidden space-y-4">
            {/* Top Row: Avatar + Name/Username + Owner Icons */}
            <div className="flex items-start justify-between">
              <div className="flex gap-3">
                {/* Profile Picture */}
                <Avatar className="h-16 w-16 ring-4 ring-primary/10 cursor-pointer">
                  <AvatarImage src={!imageError ? traderData.app_users?.profile_picture_url : undefined} onError={() => setImageError(true)} />
                  <AvatarFallback className="text-xl font-bold">
                    {displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                {/* Name, Username and Social Icons */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl font-bold leading-tight">{displayName}</h1>
                    {traderData.badge && traderData.badge !== 'Free' && <Badge variant="secondary" className="px-2 py-1 text-xs">
                        {traderData.badge}
                      </Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">@{username}</p>
                  
                  {/* Social Icons - Below username */}
                  {activeSocialLinks.length > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      {activeSocialLinks.map(platform => <Button key={platform.key} variant="outline" size="sm" onClick={() => window.open(traderData.social_links![platform.key], '_blank')} className="h-6 w-6 p-0">
                            <span className="text-xs">{platform.icon}</span>
                          </Button>)}
                    </div>
                  )}
                </div>
              </div>

              {/* Owner Icons (Top Right) */}
              {isOwner && <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={onEditProfile}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleNotifications} className="relative">
                    <Heart className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full" />
                    )}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleMessage}>
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>}
            </div>

            {/* Stats Section - Same format as desktop */}
            <div className="flex gap-6 justify-center">
              {stats.filter(stat => stat.visible).map(stat => (
                <div key={stat.key} className="text-center">
                  <p className={cn("text-lg font-bold", stat.color)}>
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Action Buttons - Single row */}
            {!isOwner && <div className="flex gap-2">
                <Button variant={traderData.is_followed_by_user ? "outline" : "default"} onClick={onFollow} disabled={isFollowLoading} className="flex-1">
                  {isFollowLoading ? 'Loading...' : traderData.is_followed_by_user ? 'Unfollow' : 'Follow'}
                </Button>
                <Button variant="outline" onClick={onMessage} className="flex-1">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Message
                </Button>
                <TraderProfileShareButton username={username} traderName={displayName} variant="icon" />
              </div>}
          </div>
        </div>
      </div>

      {/* Notification Panel */}
      <NotificationPanel 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />

      {/* Chat Panel */}
      <ChatPanel 
        isOpen={showChat} 
        onClose={() => setShowChat(false)} 
      />
    </>
  );
}
