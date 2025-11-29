
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import { TradeDetail } from "@/components/trades/TradeDetail";
import { useTrades, Trade } from "@/hooks/useTrades";
import { useStrategies } from "@/hooks/useStrategies";
import { useTags } from "@/hooks/useTags";
import { useToast } from "@/hooks/use-toast";
import { useGlobalSettings } from "@/hooks/useGlobalSettings";
import { useIsMobile } from "@/hooks/use-mobile";
import { BreadcrumbNavigation } from "@/components/navigation/BreadcrumbNavigation";
import { useEnhancedNavigation } from "@/hooks/useEnhancedNavigation";

const TradeDetailPage = () => {
  const { tradeId, source, contextId } = useParams();
  const [trade, setTrade] = useState<Trade | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const {
    trades,
    isLoading,
    updateTrade,
    refetch,
    formatCurrency
  } = useTrades();
  const { strategies, isLoading: strategiesLoading } = useStrategies();
  const { tags } = useTags();
  const { toast } = useToast();
  const { settings } = useGlobalSettings();
  const isMobile = useIsMobile();
  const { getCurrentContext, setBreadcrumbsFromContext } = useEnhancedNavigation();

  useEffect(() => {
    if (trades.length > 0 && tradeId) {
      const foundTrade = trades.find(t => t.id === tradeId);
      console.log('Looking for trade with ID:', tradeId);
      console.log('Found trade:', foundTrade);
      setTrade(foundTrade || null);
    }
  }, [trades, tradeId]);

  // Helper function to create strategy slug from name
  const createStrategySlug = (strategyName: string) => {
    return strategyName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .trim();
  };

  // Helper function to find strategy by slug
  const findStrategyBySlug = (slug: string) => {
    return strategies.find(strategy => 
      createStrategySlug(strategy.strategy_name) === slug
    );
  };

  // Set breadcrumbs based on URL context
  useEffect(() => {
    if (source && contextId) {
      if (source === 'strategy') {
        // Wait for strategies to load before setting breadcrumbs
        if (!strategiesLoading && strategies.length > 0) {
          const strategy = findStrategyBySlug(contextId);
          setBreadcrumbsFromContext(source, contextId, strategy?.strategy_name);
        }
      } else {
        setBreadcrumbsFromContext(source, contextId);
      }
    }
  }, [source, contextId, setBreadcrumbsFromContext, strategies, strategiesLoading]);

  // Generate context-aware title (simplified to remove date/strategy suffixes)
  const getContextAwareTitle = () => {
    return trade?.instrument || 'Trade';
  };

  const handleTradeUpdate = async (updatedTrade: any) => {
    try {
      await updateTrade({
        id: updatedTrade.id,
        instrument: updatedTrade.symbol,
        action: updatedTrade.action.toLowerCase(),
        quantity: updatedTrade.quantity,
        entry_price: updatedTrade.entryPrice,
        exit_price: updatedTrade.exitPrice || null,
        market_type: updatedTrade.marketType || "Stock",
        trade_time_frame: updatedTrade.timeframe,
        notes: updatedTrade.notes || "",
        strategy_id: updatedTrade.strategy || null,
        sl: updatedTrade.stopLoss || null,
        target: updatedTrade.target || null,
        account_id: updatedTrade.accountId || null,
        contract_multiplier: updatedTrade.contractMultiplier || 1,
        commission: updatedTrade.commission || 0,
        fees: updatedTrade.fees || 0,
        tags: updatedTrade.tags || [],
        main_image: updatedTrade.main_image || null,
        additional_images: updatedTrade.additional_images || [],
        trade_rating: updatedTrade.trade_rating || null
      });
      toast({
        title: "Trade updated",
        description: "Your trade has been successfully updated"
      });
      refetch();
    } catch (error: any) {
      console.error("Error updating trade:", error);
      toast({
        title: "Update failed",
        description: error.message || "Failed to update trade",
        variant: "destructive"
      });
    }
  };

  const mapTradeForDisplay = (trade: Trade) => {
    // Filter tags by type
    const mistakeTags = tags.filter(tag => tag.tag_type === 'Mistake');
    const otherTags = tags.filter(tag => tag.tag_type === 'Other');

    // Use the actual entry_time and exit_time from the trade data
    const entryDateTime = trade.entry_time || new Date().toISOString();
    const exitDateTime = trade.exit_time || undefined;
    
    // Calculate total fees from commission and fees
    const totalFees = (trade.commission || 0) + (trade.fees || 0);
    
    return {
      id: trade.id,
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
      strategies: strategies,
      mistakeTags: mistakeTags,
      otherTags: otherTags,
      formattedCurrency: settings?.base_currency || "USD",
      partialExits: trade.partial_exits || [],
      tradeRating: trade.trade_rating || 0
    };
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar mobileOpen={mobileMenuOpen} onMobileOpenChange={setMobileMenuOpen} forceCollapsible={isMobile} />
      
      <div className="flex-1 lg:ml-56 overflow-hidden">
        <TopBar title="Trade Details" showMobileMenu={isMobile} onMobileMenuClick={() => setMobileMenuOpen(true)} />
        
        <main className="p-3 sm:p-4 lg:p-6 overflow-auto h-[calc(100vh-64px)] py-0">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <p>Loading trade details...</p>
            </div>
          ) : !trade ? (
            <div className="flex justify-center items-center h-full">
              <p>Trade not found</p>
            </div>
          ) : (
            <div className="space-y-6">
              <TradeDetail {...mapTradeForDisplay(trade)} onSave={handleTradeUpdate} isEditable={true} hideBackButton={true} breadcrumbElement={<BreadcrumbNavigation currentPageTitle={getContextAwareTitle()} />} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default TradeDetailPage;
