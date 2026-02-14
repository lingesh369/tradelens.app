
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import { TradeDetail } from "@/components/trades/TradeDetail";
import { ShareButton } from "@/components/shared/ShareButton";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTrades, Trade } from "@/hooks/useTrades";
import { useToast } from "@/components/ui/use-toast";
import { useGlobalSettings } from "@/hooks/useGlobalSettings";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, MessageCircle, UserPlus, UserMinus, Heart, ExternalLink } from "lucide-react";
import { useCommunityAction } from "@/hooks/useCommunity";
import { deserializePartialExits, deserializeTags, deserializeAdditionalImages } from "@/types/trade";
import { Account } from "@/hooks/useAccounts";
import { Strategy } from "@/hooks/useStrategies";
import { Tag } from "@/hooks/useTags";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";

const SharedTradePage = () => {
  const { tradeId } = useParams();
  const navigate = useNavigate();
  const [trade, setTrade] = useState<Trade | null>(null);
  const [username, setUsername] = useState<string>("");
  const [traderProfile, setTraderProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [customLinks, setCustomLinks] = useState<Array<{ id: string, label: string, url: string }>>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);

  const communityAction = useCommunityAction();

  // State for trade owner's data
  const [tradeOwnerAccounts, setTradeOwnerAccounts] = useState<Account[]>([]);
  const [tradeOwnerStrategies, setTradeOwnerStrategies] = useState<Strategy[]>([]);
  const [tradeOwnerTags, setTradeOwnerTags] = useState<Tag[]>([]);

  const { toast } = useToast();
  const { settings } = useGlobalSettings();
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchSharedTrade = async () => {
      if (!tradeId) return;

      try {
        setIsLoading(true);

        // Fetch the shared trade with user information and metrics
        const { data: tradeData, error: tradeError } = await supabase
          .from('trades')
          .select(`
            *,
            app_users!user_id(username, email, id),
            trade_metrics(
              net_p_and_l,
              gross_p_and_l,
              percent_gain,
              trade_outcome,
              r2r,
              trade_duration
            )
          `)
          .eq('id', tradeId)
          .eq('is_shared', true)
          .single();

        if (tradeError) {
          if (tradeError.code === 'PGRST116') {
            setError("This trade is not shared or doesn't exist.");
          } else {
            console.error("Trade fetch error:", tradeError);
            setError("Failed to load trade data.");
          }
          return;
        }

        if (!tradeData) {
          setError("Trade not found or not shared.");
          return;
        }

        // Set the trade data with proper type casting and JSON deserialization
        // Extract metrics
        const metricsRaw = tradeData?.trade_metrics;
        const metrics = Array.isArray(metricsRaw) ? metricsRaw[0] : metricsRaw;

        const tradeWithSharing: Trade = {
          ...tradeData,
          // Map metrics fields
          net_pl: metrics?.net_p_and_l ?? null,
          percent_gain: metrics?.percent_gain ?? null,
          trade_result: metrics?.trade_outcome ?? null,
          r2r: metrics?.r2r ?? null,
          trade_duration: metrics?.trade_duration ?? null,
          // Sharing fields
          is_shared: tradeData.is_shared || false,
          shared_at: tradeData.shared_at || null,
          shared_by_user_id: tradeData.shared_by_user_id || null,
          // Parse JSON fields
          partial_exits: deserializePartialExits(tradeData.partial_exits),
          tags: deserializeTags(tradeData.tags),
          additional_images: deserializeAdditionalImages(tradeData.additional_images),
          // Ensure proper types
          action: tradeData.action ? tradeData.action.toLowerCase() : "buy",
          commission: tradeData.commission ?? 0,
          fees: tradeData.fees ?? 0,
          contract_multiplier: tradeData.contract_multiplier ?? 1,
          status: (tradeData.status as "open" | "partially_closed" | "closed") || "open",
        };

        setTrade(tradeWithSharing);

        // Handle user data safely
        const userData = tradeData.app_users as any;
        let tradeOwnerId = null;
        let tradeOwnerUsername = "";

        if (userData && Array.isArray(userData) && userData.length > 0) {
          tradeOwnerUsername = userData[0].username || userData[0].email || "Unknown User";
          tradeOwnerId = userData[0].id;
        } else if (userData && typeof userData === 'object') {
          tradeOwnerUsername = userData.username || userData.email || "Unknown User";
          tradeOwnerId = userData.id;
        } else {
          tradeOwnerUsername = "Unknown User";
        }

        setUsername(tradeOwnerUsername);

        // Fetch trader profile data
        if (tradeOwnerId && tradeOwnerUsername !== "Unknown User") {
          const { data: profileData, error: profileError } = await supabase
            .from('trader_profiles')
            .select(`
              *,
              app_users(
                username,
                email,
                first_name,
                last_name,
                avatar_url
              )
            `)
            .eq('user_id', tradeOwnerId)
            .single();

          if (!profileError && profileData) {
            setTraderProfile(profileData);

            // Extract custom links from social_links
            if (profileData?.social_links?.custom_links_data) {
              setCustomLinks(profileData.social_links.custom_links_data);
            }
          }

          // Fetch trade interaction data (likes, comments) using RPC functions
          const { data: { user } } = await supabase.auth.getUser();

          // Get likes count
          const { data: likesCountData } = await supabase
            .rpc('get_trade_like_count', { p_trade_id: tradeId });

          // Get comments count  
          const { data: commentsCountData } = await supabase
            .rpc('get_trade_comment_count', { p_trade_id: tradeId });

          // Check if current user liked this trade
          let isLikedData = false;
          if (user) {
            const { data } = await supabase
              .rpc('has_liked_trade', {
                p_user_id: user.id,
                p_trade_id: tradeId
              });
            isLikedData = data || false;
          }

          setLikesCount(likesCountData || 0);
          setCommentsCount(commentsCountData || 0);
          setIsLiked(isLikedData);
        }

        // Fetch trade owner's accounts, strategies, and tags

        if (tradeOwnerId) {
          // Fetch accounts
          const { data: accountsData, error: accountsError } = await supabase
            .from('accounts')
            .select('*')
            .eq('user_id', tradeOwnerId);

          if (!accountsError && accountsData) {
            setTradeOwnerAccounts(accountsData);
          }

          // Fetch strategies
          const { data: strategiesData, error: strategiesError } = await supabase
            .from('strategies')
            .select('*')
            .eq('user_id', tradeOwnerId);

          if (!strategiesError && strategiesData) {
            setTradeOwnerStrategies(strategiesData);
          }

          // Fetch tags
          const { data: tagsData, error: tagsError } = await supabase
            .from('tags')
            .select('*')
            .eq('user_id', tradeOwnerId);

          if (!tagsError && tagsData) {
            setTradeOwnerTags(tagsData);
          }
        }

      } catch (error) {
        console.error("Error fetching shared trade:", error);
        setError("An error occurred while loading the trade.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSharedTrade();
  }, [tradeId]);

  const handleShareToggle = async (shared: boolean) => {
    if (!tradeId) return;

    try {
      const { error } = await supabase
        .from('trades')
        .update({
          is_shared: shared,
          shared_at: shared ? new Date().toISOString() : null
        })
        .eq('id', tradeId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update sharing status",
          variant: "destructive"
        });
        return;
      }

      if (trade) {
        setTrade({ ...trade, is_shared: shared });
      }

      toast({
        title: shared ? "Trade shared" : "Sharing disabled",
        description: shared ? "Trade is now publicly accessible" : "Trade is no longer shared"
      });
    } catch (error) {
      console.error("Error updating share status:", error);
      toast({
        title: "Error",
        description: "Failed to update sharing status",
        variant: "destructive"
      });
    }
  };

  const handleFollow = async () => {
    if (!traderProfile?.user_id || isFollowLoading) return;

    setIsFollowLoading(true);
    try {
      const isCurrentlyFollowing = traderProfile.is_followed_by_user;

      if (isCurrentlyFollowing) {
        // Unfollow - need to get current user ID
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { error } = await supabase
          .from('community_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', traderProfile.user_id);

        if (error) throw error;

        setTraderProfile(prev => ({
          ...prev,
          is_followed_by_user: false,
          followers_count: (prev.followers_count || 0) - 1
        }));

        toast({
          title: "Unfollowed",
          description: `You are no longer following ${username}`,
        });
      } else {
        // Follow - need to get current user ID
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { error } = await supabase
          .from('community_follows')
          .insert({
            follower_id: user.id,
            following_id: traderProfile.user_id
          });

        if (error) throw error;

        setTraderProfile(prev => ({
          ...prev,
          is_followed_by_user: true,
          followers_count: (prev.followers_count || 0) + 1
        }));

        toast({
          title: "Following",
          description: `You are now following ${username}`,
        });
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast({
        title: "Error",
        description: "Failed to update follow status",
        variant: "destructive"
      });
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleMessage = () => {
    if (!traderProfile?.user_id) return;

    // Navigate to messages or open chat
    toast({
      title: "Message Feature",
      description: "Message functionality will be implemented soon",
    });
  };

  const handleLike = async () => {
    if (!tradeId) return;

    try {
      await communityAction.mutateAsync({
        action: isLiked ? 'unlike' : 'like',
        tradeId: tradeId
      });

      setIsLiked(!isLiked);
      setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    } catch (error) {
      console.error("Error toggling like:", error);
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive"
      });
    }
  };

  const handleComment = () => {
    // Navigate to trade detail with comment focus or open comment modal
    toast({
      title: "Comment Feature",
      description: "Comment functionality will be implemented soon",
    });
  };

  const mapTradeForDisplay = (trade: Trade) => {
    const mistakeTags = tradeOwnerTags.filter(tag => tag.tag_type === 'Mistake');
    const otherTags = tradeOwnerTags.filter(tag => tag.tag_type === 'Other');
    const entryDateTime = trade.entry_time || new Date().toISOString();
    const exitDateTime = trade.exit_time || undefined;
    const totalFees = (trade.commission || 0) + (trade.fees || 0);

    return {
      id: trade.trade_id,
      symbol: trade.instrument,
      entryDate: entryDateTime,
      exitDate: exitDateTime,
      action: trade.action.toLowerCase(),
      pnl: trade.net_pl || 0,
      pnlPercent: trade.percent_gain || 0,
      quantity: trade.quantity,
      status: trade.trade_result as "WIN" | "LOSS" | "OPEN" || "OPEN",
      entryPrice: trade.entry_price,
      exitPrice: trade.exit_price || undefined,
      strategy: trade.strategy_id || undefined,
      timeframe: trade.trade_time_frame || trade.market_type || "",
      marketType: trade.market_type || "Stock",
      notes: trade.notes || undefined,
      fees: totalFees,
      target: trade.target || undefined,
      stopLoss: trade.sl || undefined,
      r2r: trade.r2r || undefined,
      accountId: trade.account_id || undefined,
      contractMultiplier: trade.contract_multiplier || 1,
      strategies: tradeOwnerStrategies,
      mistakeTags: mistakeTags,
      otherTags: otherTags,
      formattedCurrency: settings?.base_currency || "USD",
      partialExits: trade.partial_exits || [],
      tradeRating: trade.trade_rating || 0,
      // Pass the owner's data for shared trades
      sharedTradeOwnerData: {
        accounts: tradeOwnerAccounts,
        strategies: tradeOwnerStrategies,
        tags: tradeOwnerTags
      }
    };
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar mobileOpen={mobileMenuOpen} onMobileOpenChange={setMobileMenuOpen} forceCollapsible={isMobile} />

      <div className="flex-1 lg:ml-56 overflow-hidden">
        <TopBar title="Shared Trade" showMobileMenu={isMobile} onMobileMenuClick={() => setMobileMenuOpen(true)} />

        {/* Header Section */}
        <div className="bg-card border-b px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
          {/* Responsive layout: single row on larger screens, stacked on mobile */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
            {/* Left Container - Shared by info and custom links */}
            <div className="flex items-center gap-4 min-w-0 flex-1 order-1 sm:order-1">
              {/* Shared by section */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-sm text-muted-foreground">Shared by</span>
                <span className="font-medium text-sm bg-gradient-to-r from-purple-500/10 to-purple-600/10 
                               border border-purple-500/20 px-3 py-1.5 rounded-md text-purple-700 dark:text-purple-300">
                  @{username}
                </span>
              </div>

              {/* Separator and Custom Links */}
              {customLinks.length > 0 && (
                <>
                  <span className="hidden sm:inline text-sm text-muted-foreground mx-1">–</span>
                  <div className="flex items-center gap-3 flex-wrap min-w-0">
                    {customLinks.map((link) => (
                      <button
                        key={link.id}
                        onClick={() => window.open(link.url, '_blank')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full 
                                 bg-gradient-to-r from-purple-500/10 to-purple-600/10 
                                 border border-purple-500/20 
                                 hover:from-purple-500/20 hover:to-purple-600/20 
                                 backdrop-blur-sm transition-all duration-200
                                 text-purple-700 dark:text-purple-300
                                 hover:scale-105 active:scale-95"
                      >
                        <span className="truncate max-w-[80px] sm:max-w-[120px]">{link.label}</span>
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Right Container - Action buttons */}
            <div className="flex items-center gap-3 flex-shrink-0 order-2 sm:order-2 justify-start sm:justify-end">
              {/* Desktop: Full buttons with text */}
              <div className="hidden lg:flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  className="h-9 px-4 hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  <Heart className={`h-4 w-4 mr-2 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                  <span className="text-xs">{likesCount}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleComment}
                  className="h-9 px-4 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  <span className="text-xs">{commentsCount}</span>
                </Button>
                <ShareButton
                  tradeId={tradeId!}
                  isShared={trade?.is_shared || false}
                  onShareToggle={handleShareToggle}
                  isOwner={false}
                />
              </div>

              {/* Mobile/Tablet: Icon-only buttons */}
              <div className="flex lg:hidden items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  className="h-9 w-9 p-0 hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleComment}
                  className="h-9 w-9 p-0 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
                <ShareButton
                  tradeId={tradeId!}
                  isShared={trade?.is_shared || false}
                  onShareToggle={handleShareToggle}
                  isOwner={false}
                />
              </div>
            </div>
          </div>
        </div>

        <main className="px-4 sm:px-6 lg:px-8 overflow-auto h-[calc(100vh-128px)]">
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="flex items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Loading shared trade...</span>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center space-y-4">
                <h1 className="text-2xl font-bold text-destructive">Trade Not Available</h1>
                <p className="text-muted-foreground">{error}</p>
              </div>
            </div>
          ) : !trade ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center space-y-4">
                <h1 className="text-2xl font-bold">Trade Not Found</h1>
                <p className="text-muted-foreground">This trade may no longer be shared or doesn't exist.</p>
              </div>
            </div>
          ) : (
            <div className="pt-4 pb-4">
              {/* Breadcrumbs */}
              <div className="mb-4">
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink href="/community">Community</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbLink href={`/traders/${username}`}>{username}</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Trade {trade.instrument}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>

              <TradeDetail
                {...mapTradeForDisplay(trade)}
                onBack={() => navigate("/trades")}
                isReadOnly={true}
                hideBackButton={true}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SharedTradePage;
