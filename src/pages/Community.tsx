import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Users, TrendingUp } from "lucide-react";
import { useCommunityFeed, useCommunityTraders } from "@/hooks/useCommunity";
import { usePublicProfileAnalytics } from "@/hooks/usePublicProfileAnalytics";
import { CommunityTradeCard } from "@/components/community/CommunityTradeCard";
import { TraderCard } from "@/components/community/TraderCard";
import { Leaderboard } from "@/components/community/Leaderboard";
import { ChatPanel } from "@/components/profile/ChatPanel";
import { useChat } from "@/hooks/useChat";
import { useNavigate } from "react-router-dom";

// Component to wrap TraderCard with analytics data
const TraderCardWithAnalytics = ({ trader, onTraderClick, onMessageClick }: {
  trader: any;
  onTraderClick: (username: string) => void;
  onMessageClick: (userId: string) => void;
}) => {
  // Fetch analytics data for this trader using the same hook as ProfileHeader
  const { data: analyticsData } = usePublicProfileAnalytics(
    trader.user_id,
    undefined, // No date range filter for community view
    true // enabled
  );

  // Extract calculated stats from analytics data (same as ProfileHeader)
  const calculatedStats = analyticsData?.data ? {
    totalTrades: analyticsData.data.totalTrades,
    netPnL: analyticsData.data.netPnL || 0,
    winRate: analyticsData.data.winRate || 0
  } : undefined;

  return (
    <TraderCard
      trader={trader}
      calculatedStats={calculatedStats}
      onTraderClick={onTraderClick}
      onMessageClick={onMessageClick}
    />
  );
};

export const Community = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("explore");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");

  const [tradersSortBy, setTradersSortBy] = useState("followers");
  const [tradersSearch, setTradersSearch] = useState("");
  const [showChat, setShowChat] = useState(false);

  // Chat functionality
  const { createOrGetChat } = useChat();

  // Fetch data using our custom hooks
  const {
    data: feedData,
    isLoading: feedLoading
  } = useCommunityFeed(sortBy, searchQuery);

  const {
    data: tradersData,
    isLoading: tradersLoading
  } = useCommunityTraders(tradersSortBy, tradersSearch);

  const handleTradeClick = (tradeId: string) => {
    navigate(`/shared/trades/${tradeId}`);
  };

  const handleTraderClick = (username: string) => {
    navigate(`/traders/${username}`);
  };

  const handleMessageClick = async (userId: string) => {
    try {
      await createOrGetChat(userId);
      setShowChat(true);
    } catch (error) {
      console.error('Error opening chat:', error);
    }
  };

  const handleCloseChat = () => {
    setShowChat(false);
  };
  return <Layout>
      <div className="p-2 sm:p-4 md:p-6 max-w-full overflow-hidden">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Community</h1>
          </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="explore" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Explore
            </TabsTrigger>
            <TabsTrigger value="traders" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Traders
            </TabsTrigger>
          </TabsList>

          {/* Explore Tab */}
          <TabsContent value="explore" className="space-y-6">
            {/* Leaderboard Section */}
            <Leaderboard />

            {/* Filter Bar */}
            <div className="flex gap-4 items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input placeholder="Search by instrument or trader..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="liked">Top Liked</SelectItem>
                  <SelectItem value="pnl">Top P&L</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Shared Trades Feed */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {feedLoading ? Array.from({
                length: 8
              }).map((_, i) => <div key={i} className="h-80 bg-muted animate-pulse rounded-lg" />) : feedData?.data?.length === 0 ? <div className="col-span-full text-center py-12">
                  <p className="text-muted-foreground">No shared trades found. Be the first to share your trades!</p>
                </div> : feedData?.data?.map(trade => <CommunityTradeCard key={trade.trade_id} trade={trade} onTradeClick={handleTradeClick} onTraderClick={handleTraderClick} />)}
            </div>
          </TabsContent>

          {/* Traders Tab */}
          <TabsContent value="traders" className="space-y-6">
            {/* Filter Bar */}
            <div className="flex gap-4 items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input placeholder="Search by name or username..." value={tradersSearch} onChange={e => setTradersSearch(e.target.value)} className="pl-10" />
              </div>
              <Select value={tradersSortBy} onValueChange={setTradersSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="followers">Most Followed</SelectItem>
                  <SelectItem value="winrate">Top Win Rate</SelectItem>
                  <SelectItem value="pnl">Top P&L</SelectItem>
                  <SelectItem value="active">Most Active</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Traders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {tradersLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-80 bg-muted animate-pulse rounded-lg" />
                  ))
                : tradersData?.data?.map((trader) => (
                    <TraderCardWithAnalytics
                      key={trader.user_id}
                      trader={trader}
                      onTraderClick={handleTraderClick}
                      onMessageClick={handleMessageClick}
                    />
                  ))}
            </div>
          </TabsContent>
        </Tabs>
        </div>

        {/* Chat Panel */}
        {showChat && (
          <ChatPanel isOpen={showChat} onClose={handleCloseChat} />
        )}
      </div>
    </Layout>;
};
