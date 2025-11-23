import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Heart, 
  MessageCircle, 
  Settings, 
  Share2, 
  ExternalLink,
  User,
  TrendingUp,
  Grid3X3,
  Pin,
  Bell,
  Edit
} from "lucide-react";
import { 
  Breadcrumb, 
  BreadcrumbList, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb";
import { useTraderProfile, useCommunityAction, useTraderSharedTrades, usePinnedTrades, usePinTrade } from "@/hooks/useCommunity";
import { useAuth } from "@/context/AuthContext";
import { useAppUserId } from "@/hooks/useAppUserId";
import { TradeCard } from "@/components/community/TradeCard";
import { BentoAboutEditor } from "@/components/profile/BentoAboutEditor";
import { PublicTraderOverviewTab } from "@/components/profile/PublicTraderOverviewTab";
import { ProfileEditModal } from "@/components/profile/ProfileEditModal";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ChatPanel } from "@/components/profile/ChatPanel";
import { supabase } from '@/integrations/supabase/client';
import { saveProfileAbout } from '@/services/profileAboutService';
import { useToast } from "@/hooks/use-toast";
import { Trade } from "@/types/trade";
import { usePublicProfileAnalytics } from "@/hooks/usePublicProfileAnalytics";
import { usePublicTraderTrades } from "@/hooks/usePublicTraderTrades";
import { getPresetDateRange } from "@/components/filters/DateRangeUtils";

export const TraderProfile = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { appUserId } = useAppUserId();
  const [activeTab, setActiveTab] = useState("about");
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatWithUserId, setChatWithUserId] = useState<string | undefined>();
  const { toast } = useToast();
  
  const { data: traderData, isLoading, error, refetch } = useTraderProfile(username || '');
  const { data: sharedTrades, isLoading: isLoadingSharedTrades, error: sharedTradesError, refetch: refetchSharedTrades } = useTraderSharedTrades(traderData?.user_id || '', !!traderData?.user_id);
  const { data: pinnedTrades, refetch: refetchPinnedTrades } = usePinnedTrades(traderData?.user_id || '', !!traderData?.user_id);
  
  // Get date range from privacy settings for analytics
  const privacySettings = traderData?.privacy_settings || {};
  const analyticsDateRange = privacySettings.date_range ? (
     privacySettings.date_range.from && privacySettings.date_range.to ? {
       from: new Date(privacySettings.date_range.from),
       to: new Date(privacySettings.date_range.to)
     } : privacySettings.date_range.preset ? (
       () => {
         const presetRange = getPresetDateRange(privacySettings.date_range.preset);
         return {
           from: presetRange.from,
           to: presetRange.to
         };
       }
     )() : undefined
   ) : undefined;
  
  // Fetch analytics data for all trades (respecting privacy settings)
  const { data: analyticsData, isLoading: isLoadingAnalytics, error: analyticsError } = usePublicProfileAnalytics(
    traderData?.user_id || '', 
    analyticsDateRange,
    !!traderData?.user_id
  );
  
  // Fetch all trades for charts and calendar (respecting privacy settings)
  const publicTradesPrivacySettings = privacySettings.account_ids || privacySettings.date_range ? {
    selectedAccountIds: privacySettings.account_ids || [],
    dateRange: analyticsDateRange
  } : undefined;
  
  const { 
    trades: allTradesForCharts, 
    isLoading: isLoadingAllTrades, 
    hasRealTrades: hasAllRealTrades 
  } = usePublicTraderTrades({
    userId: traderData?.user_id || '',
    privacySettings: publicTradesPrivacySettings,
    enabled: !!traderData?.user_id
  });
  
  const communityAction = useCommunityAction();
  const pinTrade = usePinTrade();

  const handleFollow = async () => {
    if (!traderData) return;
    
    try {
      await communityAction.mutateAsync({
        action: traderData.is_followed_by_user ? 'unfollow' : 'follow',
        userId: traderData.user_id
      });

      // Create notification for follow action (if following, not unfollowing)
      if (!traderData.is_followed_by_user && user) {
        if (appUserId) {
          await (supabase as any)
            .from('notifications')
            .insert({
              user_id: traderData.user_id,
              type: 'follow',
              source_user_id: appUserId,
              title: 'New Follower',
              message: `${user.user_metadata?.username || user.email} started following you`
            });
        }
      }
    } catch (error) {
      console.error('Error following/unfollowing user:', error);
    }
  };

  const handleMessage = () => {
    if (!traderData?.user_id) return;
    setChatWithUserId(traderData.user_id);
    setShowChat(true);
  };

  const handleShare = () => {
    console.log('Share trader profile:', username);
  };

  const handleNotifications = () => {
    console.log('Show notifications');
  };

  const handleEditProfile = () => {
    setShowEditProfile(true);
  };

  const handleSaveAboutContent = async (content: any[], bio: string) => {
    try {
      if (!traderData?.user_id) {
        throw new Error('User ID not found');
      }
      
      await saveProfileAbout(traderData.user_id, bio, content);

      toast({
        title: "About content updated",
        description: "Your profile has been updated successfully.",
      });

      setIsEditingAbout(false);
      refetch();
    } catch (error) {
      console.error('Error updating about content:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePinToggle = async (tradeId: string, pin: boolean) => {
    try {
      await pinTrade.mutateAsync({ tradeId, pin });
      await Promise.all([refetchSharedTrades(), refetchPinnedTrades()]);
      
      toast({
        title: pin ? "Trade pinned" : "Trade unpinned",
        description: pin ? "This trade is now pinned to the top of your profile." : "This trade has been unpinned.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update pin status. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Fix owner detection: compare auth IDs  
  const isOwner = user && traderData && user.id === traderData.app_users?.auth_id;
  
  // Create a combined list of trades with pinned ones at the top
  const getCombinedSharedTrades = () => {
    if (!sharedTrades || !Array.isArray(sharedTrades)) {
      return [];
    }
    
    const pinnedTradeIds = new Set(pinnedTrades?.map(pin => pin.trade_id) || []);
    const pinnedTradesData = sharedTrades.filter(trade => pinnedTradeIds.has(trade.trade_id));
    const unpinnedTradesData = sharedTrades.filter(trade => !pinnedTradeIds.has(trade.trade_id));
    
    return [...pinnedTradesData, ...unpinnedTradesData];
  };

  // Convert shared trades to Trade format for stats calculation
  const convertToTradeFormat = (sharedTrades: any[]): Trade[] => {
    if (!Array.isArray(sharedTrades)) return [];
    
    return sharedTrades.map(trade => ({
      trade_id: trade.trade_id,
      user_id: trade.user_id || '',
      instrument: trade.instrument,
      action: trade.action?.toLowerCase() || 'buy',
      entry_price: trade.entry_price,
      exit_price: trade.exit_price,
      quantity: trade.quantity,
      entry_time: trade.entry_time,
      exit_time: trade.exit_time,
      net_pl: trade.trade_metrics?.net_p_and_l || 0,
      percent_gain: trade.trade_metrics?.percent_gain || 0,
      trade_result: trade.trade_metrics?.trade_outcome || null,
      r2r: trade.trade_metrics?.r2r || null,
      trade_duration: trade.trade_metrics?.trade_duration || null,
      market_type: trade.market_type || 'Stock',
      chart_link: trade.chart_link,
      sl: trade.sl,
      target: trade.target,
      rating: trade.rating,
      notes: trade.notes,
      account_id: trade.account_id,
      commission: trade.commission || 0,
      fees: trade.fees || 0,
      strategy_id: trade.strategy_id,
      contract: trade.contract,
      trade_time_frame: trade.trade_time_frame,
      contract_multiplier: trade.contract_multiplier || 1,
      tick_size: trade.tick_size,
      tick_value: trade.tick_value,
      trade_rating: trade.trade_rating,
      remaining_quantity: trade.remaining_quantity,
      parent_trade_id: trade.parent_trade_id,
      status: (trade.status === 'open' || trade.status === 'partially_closed' || trade.status === 'closed') 
        ? trade.status as 'open' | 'partially_closed' | 'closed'
        : 'closed',
      total_exit_quantity: trade.total_exit_quantity,
      partial_exits: trade.partial_exits,
      tags: trade.tags,
      main_image: trade.main_image,
      additional_images: trade.additional_images,
      is_shared: trade.is_shared,
      shared_at: trade.shared_at,
      shared_by_user_id: trade.shared_by_user_id,
      trade_date: trade.trade_date
    }));
  };

  const combinedSharedTrades = getCombinedSharedTrades();
  const tradesForStats = sharedTrades ? convertToTradeFormat(sharedTrades) : [];

  // Extract calculated stats from analytics data for ProfileHeader
  const calculatedStats = analyticsData?.data ? {
    totalTrades: analyticsData.data.totalTrades,
    netPnL: analyticsData.data.netPnL || 0,
    winRate: analyticsData.data.winRate || 0
  } : undefined;

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">Loading trader profile...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    console.error('TraderProfile - Error:', error);
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-destructive">Error Loading Profile</h2>
              <p className="text-muted-foreground">{error.message}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!traderData) {
    // Check if this is the current user trying to access their own profile
    const isCurrentUserProfile = user && username === user.user_metadata?.username;
    
    if (isCurrentUserProfile) {
      // Auto-create trader profile for current user
      const createTraderProfile = async () => {
        try {
          const { data: userIdData } = await supabase.rpc('get_user_id_from_auth', {
            auth_user_id: user.id
          });

          if (userIdData) {
            const { error } = await supabase
              .from('trader_profiles')
              .insert({
                user_id: userIdData,
                is_public: false, // Start as private
                bio: '',
                stats_visibility: {
                  win_rate: true,
                  total_pnl: true,
                  profit_factor: true,
                  trades_count: true,
                  calendar_view: true,
                  performance_chart: true,
                  monthly_performance: true,
                  trade_distribution: true,
                  top_instruments: true,
                  recent_trades: true
                }
              });

            if (error) {
              console.error('Error creating trader profile:', error);
              toast({
                title: "Error",
                description: "Failed to create trader profile. Please try again.",
                variant: "destructive",
              });
            } else {
              toast({
                title: "Profile Created",
                description: "Your trader profile has been created successfully!",
              });
              // Refetch the data
              refetch();
            }
          }
        } catch (error) {
          console.error('Error creating trader profile:', error);
          toast({
            title: "Error",
            description: "Failed to create trader profile. Please try again.",
            variant: "destructive",
          });
        }
      };

      return (
        <Layout>
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center space-y-4">
                <h2 className="text-2xl font-bold">Create Your Trader Profile</h2>
                <p className="text-muted-foreground">
                  You don't have a trader profile yet. Create one to share your trading journey with the community.
                </p>
                <Button onClick={createTraderProfile}>
                  Create Trader Profile
                </Button>
              </div>
            </div>
          </div>
        </Layout>
      );
    }

    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">Trader Not Found</h2>
              <p className="text-muted-foreground">
                The trader profile you're looking for doesn't exist or is not public.
              </p>
              <Button onClick={() => navigate('/community')}>
                Browse Community
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-2 sm:p-4 md:p-6 max-w-full overflow-hidden">
        <div className="space-y-6">
          {/* Breadcrumbs */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/community">Community</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{traderData?.app_users?.username || username}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          {/* Profile Header */}
          <ProfileHeader
            traderData={traderData}
            calculatedStats={calculatedStats}
            isOwner={isOwner}
            onEditProfile={handleEditProfile}
            onFollow={handleFollow}
            onMessage={handleMessage}
            onShare={handleShare}
            onNotifications={handleNotifications}
            isFollowLoading={communityAction.isPending}
          />

          {/* Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="about" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                About
              </TabsTrigger>
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="trades" className="flex items-center gap-2">
                <Grid3X3 className="h-4 w-4" />
                Shared Trades
              </TabsTrigger>
            </TabsList>

            <TabsContent value="about" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>About</CardTitle>
                    {isOwner && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setIsEditingAbout(!isEditingAbout)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        {isEditingAbout ? 'Cancel' : 'Edit'}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <BentoAboutEditor
                    initialBio={traderData?.bio || ''}
                    initialContent={(() => {
                      // More robust content processing
                      if (!traderData?.about_content) {
                        return [];
                      }
                      
                      // Handle case where about_content might be a string (JSON)
                      let content = traderData.about_content;
                      if (typeof content === 'string') {
                        try {
                          content = JSON.parse(content);
                        } catch (e) {
                          return [];
                        }
                      }
                      
                      // Ensure it's an array
                      if (!Array.isArray(content)) {
                        return [];
                      }
                      
                      // Map and validate each block
                      return content.map((block: any, index: number) => {
                        if (!block || typeof block !== 'object') {
                          return {
                            id: `fallback-${index}-${Date.now()}`,
                            type: 'text',
                            content: '',
                            size: 'medium'
                          };
                        }
                        
                        return {
                          id: block.id || `block-${index}-${Date.now()}`,
                          type: block.type || 'text',
                          content: block.content || '',
                          size: block.size || 'medium'
                        };
                      });
                    })()}
                    onSave={handleSaveAboutContent}
                    readOnly={!isOwner}
                    isEditing={isEditingAbout}
                    onEditingChange={setIsEditingAbout}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="overview" className="space-y-6">
              <PublicTraderOverviewTab
                traderData={traderData}
                isOwner={isOwner}
                analyticsData={analyticsData}
                isLoadingAnalytics={isLoadingAnalytics}
                analyticsError={analyticsError}
                onVisibilityUpdate={refetch}
                trades={allTradesForCharts || []}
                accounts={[]} // We don't have account data for public profiles, but charts can work without it
              />
            </TabsContent>

            <TabsContent value="trades" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Shared Trades ({combinedSharedTrades.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingSharedTrades ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : sharedTradesError ? (
                    <div className="text-center py-8 text-red-500">
                      <p>Error loading shared trades: {sharedTradesError.message}</p>
                    </div>
                  ) : combinedSharedTrades && combinedSharedTrades.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {combinedSharedTrades.map((trade: any) => {
                        const isPinned = pinnedTrades?.some(pin => pin.trade_id === trade.trade_id);
                        return (
                          <TradeCard
                            key={trade.trade_id}
                            trade={trade}
                            onTradeClick={(tradeId) => navigate(`/shared/trades/${tradeId}`)}
                            hideTraderInfo={true}
                            isOwner={isOwner}
                            isPinned={isPinned}
                            onPinToggle={handlePinToggle}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No shared trades yet</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          {/* Profile Edit Modal */}
          <ProfileEditModal
            open={showEditProfile}
            onOpenChange={setShowEditProfile}
            traderData={traderData}
            onUpdate={refetch}
          />

          {/* Chat Panel */}
          <ChatPanel
            isOpen={showChat}
            onClose={() => {
              setShowChat(false);
              setChatWithUserId(undefined);
            }}
            initialChatWithUser={chatWithUserId}
          />
        </div>
      </div>
    </Layout>
  );
};
